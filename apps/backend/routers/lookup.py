import logging
import time
import os
import requests as req
from datetime import datetime, timezone
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException

from config import settings
from services.stock_data import calculate_rsi, calculate_sma

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Lookup"])

# Simple in-memory cache
_lookup_cache: dict[str, dict] = {}
CACHE_TTL = 300  # 5 minutes
def _fetch_ticker_data(symbol: str, period: str = "3mo", interval: str = "1d") -> Optional[dict]:
    """Fetch full data for a single ticker with multiple redundancy layers and live pricing."""
    # Layer 0: Always fetch a fresh Live Quote from Finnhub (Header Price)
    live_quote = _fetch_live_quote(symbol)

    # Layer 1: TwelveData (Primary for rich history)
    data = _fetch_twelvedata(symbol, period=period, interval=interval)
    if not (data and data.get("price_history")):
        # Layer 2: Finnhub Candles (Secondary for charts when TD fails/throttles)
        data = _fetch_finnhub_candles(symbol, period=period)

    if not data and live_quote:
        # ULTIMATE FALLBACK: Construct 1-point history from live quote so chart/UI don't break
        data = {
            "symbol": symbol.upper(),
            "name": symbol,
            "sector": "Unknown",
            "current_price": live_quote["current_price"],
            "change_pct": live_quote["change_pct"],
            "volume": live_quote.get("volume", 0),
            "price_history": [{
                "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                "open": live_quote["current_price"],
                "high": live_quote["current_price"],
                "low": live_quote["current_price"],
                "close": live_quote["current_price"],
                "volume": live_quote.get("volume", 0)
            }]
        }

    if not data:
        return None

    # Merge Live Quote over historical data to ensure current accuracy
    if live_quote:
        data["current_price"] = live_quote["current_price"]
        data["change_pct"] = live_quote["change_pct"]
        data["volume"] = live_quote.get("volume", data["volume"])
        data["live_source"] = "Finnhub (BATS/CBOE Real-time)"

    # ALWAYS ensure SMA/RSI are calculated based on whatever history we got
    if data.get("price_history") and len(data["price_history"]) > 5:
        df_mini = pd.DataFrame({
            "Close":  [p["close"]  for p in data["price_history"]],
            "Open":   [p["open"]   for p in data["price_history"]],
            "High":   [p["high"]   for p in data["price_history"]],
            "Low":    [p["low"]    for p in data["price_history"]],
            "Volume": [p["volume"] for p in data["price_history"]],
        })
        data["rsi"] = float(calculate_rsi(df_mini) or 50.0)
        data["sma_20"] = calculate_sma(df_mini, 20)
        data["sma_50"] = calculate_sma(df_mini, 50)
    else:
        # Default/Fallback values to avoid blank UI
        data["rsi"] = data.get("rsi") or 50.0
        data["sma_20"] = data.get("sma_20")
        data["sma_50"] = data.get("sma_50")

    return data


def _fetch_twelvedata(symbol: str, period: str = "3mo", interval: str = "1d") -> Optional[dict]:
    """
    Twelve Data API — 800 free calls/day.
    Now supports various intervals and output sizes based on requested period.
    """
    import os
    import requests as req

    td_key = os.getenv("TWELVEDATA_API_KEY")
    if not td_key:
        logger.warning("TWELVEDATA_API_KEY not set, skipping Twelve Data fallback")
        return _fetch_finnhub_quote_only(symbol)

    # Map yfinance-style periods to TwelveData outputsize/interval
    mapping = {
        "1d": {"interval": "5min", "outputsize": "78"}, # Approx one trading day
        "1mo": {"interval": "1h", "outputsize": "160"},
        "3mo": {"interval": "1day", "outputsize": "90"},
        "6mo": {"interval": "1day", "outputsize": "180"},
        "1y": {"interval": "1day", "outputsize": "365"},
        "5y": {"interval": "1day", "outputsize": "1260"},
        "max": {"interval": "1day", "outputsize": "5000"},
    }
    
    cfg = mapping.get(period, mapping["3mo"]) # Default to 3mo
    td_interval = cfg["interval"]
    td_outputsize = cfg["outputsize"]

    try:
        # Fetch OHLCV time series
        url = (
            f"https://api.twelvedata.com/time_series"
            f"?symbol={symbol}&interval={td_interval}&outputsize={td_outputsize}"
            f"&format=JSON&apikey={td_key}"
        )
        r = req.get(url, timeout=10)
        d = r.json()

        if d.get("status") == "error" or not d.get("values"):
            logger.warning(f"Twelve Data error for {symbol}: {d.get('message')}")
            return None # Trigger fallback in _fetch_ticker_data

        values = d["values"]  # newest first
        values_asc = list(reversed(values))  # oldest first for RSI/SMA

        price_history = []
        for row in values_asc:
            try:
                price_history.append({
                    "date": row["datetime"],
                    "open": round(float(row["open"]), 2),
                    "high": round(float(row["high"]), 2),
                    "low": round(float(row["low"]), 2),
                    "close": round(float(row["close"]), 2),
                    "volume": int(row.get("volume", 0)),
                })
            except Exception:
                continue

        if len(price_history) < 2:
            raise ValueError("Insufficient bars from Twelve Data")

        current_price = float(values[0]["close"])
        prev_close = float(values[1]["close"])
        change_pct = round(((current_price - prev_close) / prev_close) * 100, 2)
        latest_volume = int(values[0].get("volume", 0))

        logger.info(f"Twelve Data fetch succeeded for {symbol}: {len(price_history)} bars")
        return {
            "symbol": symbol.upper(),
            "name": name,
            "sector": sector,
            "current_price": round(current_price, 2),
            "change_pct": change_pct,
            "volume": latest_volume,
            "market_cap": market_cap,
            "price_history": price_history,
            "cluster": None,
            "cluster_label": None,
        }

    except Exception as e:
        logger.error(f"Twelve Data fetch failed for {symbol}: {e}")
        return None


def _fetch_finnhub_candles(symbol: str, period: str = "3mo") -> Optional[dict]:
    """Fetch candles from Finnhub as a reliable fallback for TwelveData."""
    import os
    import requests as req
    from datetime import datetime, timedelta

    finnhub_key = os.getenv("FINNHUB_API_KEY")
    if not finnhub_key:
        return None

    # Map period to Finnhub resolution and 'from' timestamp
    now = int(time.time())
    mapping = {
        "1d":   {"res": "5",  "days": 1},
        "1mo":  {"res": "60", "days": 30},
        "3mo":  {"res": "D",  "days": 90},
        "6mo":  {"res": "D",  "days": 180},
        "1y":   {"res": "D",  "days": 365},
        "5y":   {"res": "W",  "days": 1825},
        "max":  {"res": "M",  "days": 7300},
    }
    
    cfg = mapping.get(period, mapping["3mo"])
    start_ts = int((datetime.now() - timedelta(days=cfg["days"])).timestamp())
    
    try:
        url = (
            f"https://finnhub.io/api/v1/stock/candle"
            f"?symbol={symbol.upper()}&resolution={cfg['res']}"
            f"&from={start_ts}&to={now}&token={finnhub_key}"
        )
        r = req.get(url, timeout=10)
        d = r.json()

        if d.get("s") != "ok" or not d.get("c"):
            logger.warning(f"Finnhub candle error for {symbol}: {d.get('s')}")
            return None

        # Format price history
        price_history = []
        for i in range(len(d["t"])):
            dt = datetime.fromtimestamp(d["t"][i], tz=timezone.utc)
            price_history.append({
                "date": dt.strftime("%Y-%m-%d %H:%M:%S"),
                "open": round(float(d["o"][i]), 2),
                "high": round(float(d["h"][i]), 2),
                "low": round(float(d["l"][i]), 2),
                "close": round(float(d["c"][i]), 2),
                "volume": int(d["v"][i]),
            })

        current_price = price_history[-1]["close"]
        prev_close = price_history[-2]["close"] if len(price_history) > 1 else current_price
        change_pct = round(((current_price - prev_close) / prev_close) * 100, 2)

        # Profile fetch for basic info
        prof = req.get(
            f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={finnhub_key}",
            timeout=5
        ).json()

        logger.info(f"Finnhub candle fetch succeeded for {symbol}: {len(price_history)} bars")
        return {
            "symbol": symbol.upper(),
            "name": prof.get("name", symbol),
            "sector": prof.get("finnhubIndustry", "Unknown"),
            "current_price": round(current_price, 2),
            "change_pct": change_pct,
            "volume": price_history[-1]["volume"],
            "market_cap": prof.get("marketCapitalization"),
            "rsi": 50.0,  # Fallback
            "sma_20": None,
            "sma_50": None,
            "price_history": price_history,
            "cluster": None,
            "cluster_label": None,
        }
    except Exception as e:
        logger.error(f"Finnhub candle fallback failed for {symbol}: {e}")
        return None


def _fetch_live_quote(symbol: str) -> Optional[dict]:
    """Fetch the absolute latest price (Live/Pre-market) with multiple source redundancy."""
    import os
    import requests as req

    # Source 1: TwelveData Quote (Often better pre-market coverage)
    td_key = os.getenv("TWELVEDATA_API_KEY")
    if td_key:
        try:
            url = f"https://api.twelvedata.com/quote?symbol={symbol.upper()}&apikey={td_key}"
            r = req.get(url, timeout=5)
            d = r.json()
            if d.get("price"):
                return {
                    "current_price": round(float(d["price"]), 2),
                    "change_pct": round(float(d.get("percent_change", 0.0)), 2),
                    "volume": int(d.get("volume", 0)),
                    "high": float(d.get("high", 0)),
                    "low": float(d.get("low", 0)),
                    "open": float(d.get("open", 0)),
                    "prev_close": float(d.get("previous_close", 0)),
                    "source": "TwelveData"
                }
        except Exception:
            pass

    # Source 2: Finnhub Quote (Solid fallback)
    finnhub_key = os.getenv("FINNHUB_API_KEY")
    if finnhub_key:
        try:
            url = f"https://finnhub.io/api/v1/quote?symbol={symbol.upper()}&token={finnhub_key}"
            r = req.get(url, timeout=5)
            d = r.json()
            if d.get("c"):
                return {
                    "current_price": round(float(d["c"]), 2),
                    "change_pct": round(float(d.get("dp", 0.0)), 2),
                    "volume": d.get("v"),
                    "source": "Finnhub"
                }
        except Exception:
            pass
            
    return None


def _fetch_finnhub_quote_only(symbol: str) -> Optional[dict]:
    """Last resort: Finnhub quote+profile only (no price chart)."""
    import os, requests as req
    finnhub_key = os.getenv("FINNHUB_API_KEY")
    if not finnhub_key:
        return None
    try:
        qr = req.get(f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={finnhub_key}", timeout=5).json()
        if not qr.get("c"):
            return None
        pr = req.get(f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={finnhub_key}", timeout=5).json()
        return {
            "symbol": symbol.upper(),
            "name": pr.get("name", symbol),
            "sector": pr.get("finnhubIndustry", "Unknown"),
            "current_price": round(float(qr["c"]), 2),
            "change_pct": float(qr.get("dp", 0.0)),
            "volume": qr.get("v"),
            "market_cap": pr.get("marketCapitalization"),
            "rsi": 50.0,
            "sma_20": None,
            "sma_50": None,
            "price_history": [],
            "cluster": None,
            "cluster_label": None,
        }
    except Exception as e:
        logger.error(f"Finnhub quote-only fallback failed for {symbol}: {e}")
        return None


@router.get("/lookup/{symbol}")
def lookup_stock(symbol: str, period: str = "3mo", interval: str = "1d"):
    """
    Look up any stock ticker on-demand.
    Returns price data, technical indicators, and chart history.
    Supports period (1d, 1mo, 3mo, 6mo, 1y) and interval.
    """
    symbol = symbol.upper().strip()
    if not symbol or len(symbol) > 10:
        raise HTTPException(status_code=400, detail="Invalid ticker symbol")

    # Cache key includes period and interval to prevent stale range data
    cache_key = f"{symbol}_{period}_{interval}"
    
    # Check cache
    cached = _lookup_cache.get(cache_key)
    if cached and time.time() - cached["timestamp"] < CACHE_TTL:
        logger.info(f"Serving lookup for {cache_key} from cache")
        return cached["data"]

    # Fetch fresh data
    logger.info(f"Fetching live data for {symbol} ({period}/{interval})...")
    data = _fetch_ticker_data(symbol, period=period, interval=interval)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Stock '{symbol}' not found. Please check the ticker symbol and try again."
        )

    # Cache result
    _lookup_cache[cache_key] = {"data": data, "timestamp": time.time()}

    return data


# ─── Analyst / Bitigchi Score Cache ────────────────────
_analyst_cache: dict[str, dict] = {}
ANALYST_CACHE_TTL = 3600  # 1 hour (analyst data doesn't change frequently)


@router.get("/analyst/{symbol}")
def get_analyst_data(symbol: str):
    """
    Returns Wall Street analyst consensus from Finnhub + computes the
    unique 'Bitigchi Score' — a weighted composite of:
      - Analyst Signal  (30%)
      - Technical Score (30%)
      - AI Sentiment    (40%) [client-side, passed in query param]
    """
    import os
    import requests as req

    symbol = symbol.upper().strip()
    if not symbol or len(symbol) > 10:
        raise HTTPException(status_code=400, detail="Invalid ticker symbol")

    # Check cache
    cached = _analyst_cache.get(symbol)
    if cached and time.time() - cached["timestamp"] < ANALYST_CACHE_TTL:
        return cached["data"]

    finnhub_key = os.getenv("FINNHUB_API_KEY")
    if not finnhub_key:
        raise HTTPException(status_code=503, detail="Analyst data service not configured")

    try:
        rec_url = f"https://finnhub.io/api/v1/stock/recommendation?symbol={symbol}&token={finnhub_key}"
        rec_data = req.get(rec_url, timeout=5).json()

        if not rec_data or not isinstance(rec_data, list):
            raise HTTPException(status_code=404, detail=f"No analyst data for {symbol}")

        # Use latest month's data
        latest = rec_data[0]
        strong_buy  = latest.get("strongBuy", 0)
        buy         = latest.get("buy", 0)
        hold        = latest.get("hold", 0)
        sell        = latest.get("sell", 0)
        strong_sell = latest.get("strongSell", 0)
        period      = latest.get("period", "")
        total = strong_buy + buy + hold + sell + strong_sell

        if total == 0:
            raise HTTPException(status_code=404, detail=f"No analyst coverage for {symbol}")

        # Weighted analyst score: strongBuy=2, buy=1, hold=0, sell=-1, strongSell=-2
        # Normalize to 0-100
        raw = (strong_buy * 2 + buy * 1 + hold * 0 + sell * -1 + strong_sell * -2)
        max_possible = total * 2
        analyst_score = round(((raw + max_possible) / (2 * max_possible)) * 100, 1)

        # Consensus label
        pct_buy = (strong_buy + buy) / total
        pct_sell = (sell + strong_sell) / total
        if pct_buy >= 0.6:
            consensus = "Strong Buy" if strong_buy / total >= 0.3 else "Buy"
        elif pct_sell >= 0.5:
            consensus = "Strong Sell" if strong_sell / total >= 0.3 else "Sell"
        else:
            consensus = "Hold"

        # Historical trend (last 3 months)
        trend = []
        for month_data in rec_data[:3]:
            m_total = sum([month_data.get(k, 0) for k in ["strongBuy","buy","hold","sell","strongSell"]])
            if m_total > 0:
                trend.append({
                    "period": month_data.get("period", ""),
                    "strongBuy": month_data.get("strongBuy", 0),
                    "buy": month_data.get("buy", 0),
                    "hold": month_data.get("hold", 0),
                    "sell": month_data.get("sell", 0),
                    "strongSell": month_data.get("strongSell", 0),
                })

        result = {
            "symbol": symbol,
            "period": period,
            "strong_buy": strong_buy,
            "buy": buy,
            "hold": hold,
            "sell": sell,
            "strong_sell": strong_sell,
            "total_analysts": total,
            "consensus": consensus,
            "analyst_score": analyst_score,  # 0-100
            "trend": trend,
        }

        _analyst_cache[symbol] = {"data": result, "timestamp": time.time()}
        logger.info(f"Analyst data fetched for {symbol}: {consensus} ({total} analysts)")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analyst fetch failed for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analyst data: {str(e)}")

