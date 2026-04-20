"""
Stock Lookup Router — on-demand data for any ticker symbol.
Allows users to search for stocks not in the curated 30-ticker list.
"""

import logging
import time
from datetime import datetime, timezone
from typing import Optional

import yfinance as yf
import pandas as pd
import httpx
from fastapi import APIRouter, HTTPException

from config import settings
from services.stock_data import calculate_rsi, calculate_sma

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Lookup"])

# Simple in-memory cache: {symbol: {data, timestamp}}
_lookup_cache: dict[str, dict] = {}
CACHE_TTL = 300  # 5 minutes


def _fetch_ticker_data(symbol: str, period: str = "3mo", interval: str = "1d") -> Optional[dict]:
    """Fetch full data for a single ticker with specified period and interval."""
    try:
        ticker = yf.Ticker(symbol)

        df = ticker.history(period=period, interval=interval)
        if df is None or df.empty or len(df) < 2:
            return _fetch_twelvedata(symbol, period=period, interval=interval)

        df.reset_index(inplace=True)

        # Basic info
        try:
            fi = ticker.fast_info
            name = symbol
            sector = "Unknown"
            current_price = getattr(fi, "last_price", None)
            market_cap = getattr(fi, "market_cap", None)
            volume = getattr(fi, "last_volume", None)
        except Exception:
            current_price = float(df["Close"].iloc[-1])
            name = symbol
            sector = "Unknown"
            market_cap = None
            volume = int(df["Volume"].iloc[-1]) if pd.notna(df["Volume"].iloc[-1]) else None

        # Try to get full info for name/sector
        try:
            info = ticker.info or {}
            name = info.get("shortName") or info.get("longName") or symbol
            sector = info.get("sector", "Unknown")
            if current_price is None:
                current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        except Exception:
            pass

        if current_price is None and len(df) > 0:
            current_price = float(df["Close"].iloc[-1])

        # Price change (last trading day)
        if len(df) >= 2:
            change_pct = round(
                ((df["Close"].iloc[-1] - df["Close"].iloc[-2]) / df["Close"].iloc[-2]) * 100, 2
            )
        else:
            change_pct = 0.0

        rsi = calculate_rsi(df) or 50.0
        sma_20 = calculate_sma(df, 20)
        sma_50 = calculate_sma(df, 50)

        # Price history for chart (last 30 days)
        history_slice = df.tail(30)
        price_history = []
        for _, row in history_slice.iterrows():
            date_val = row.get("Date")
            date_str = date_val.isoformat() if hasattr(date_val, "isoformat") else str(date_val)
            price_history.append({
                "date": date_str,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else 0,
            })

        latest_vol = df["Volume"].iloc[-1]

        return {
            "symbol": symbol.upper(),
            "name": name,
            "sector": sector,
            "current_price": round(current_price, 2) if current_price else None,
            "change_pct": float(change_pct),
            "volume": int(latest_vol) if pd.notna(latest_vol) else None,
            "market_cap": market_cap,
            "rsi": float(rsi),
            "sma_20": sma_20,
            "sma_50": sma_50,
            "price_history": price_history,
            "cluster": None,
            "cluster_label": None,
        }
    except Exception as e:
        logger.error(f"yfinance lookup failed for {symbol}: {e}")
        return _fetch_twelvedata(symbol, period=period, interval=interval)


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
            return _fetch_finnhub_quote_only(symbol)

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

        # RSI / SMA from price history
        df_mini = pd.DataFrame({
            "Close":  [p["close"]  for p in price_history],
            "Open":   [p["open"]   for p in price_history],
            "High":   [p["high"]   for p in price_history],
            "Low":    [p["low"]    for p in price_history],
            "Volume": [p["volume"] for p in price_history],
        })
        rsi = calculate_rsi(df_mini) or 50.0
        sma_20 = calculate_sma(df_mini, 20)
        sma_50 = calculate_sma(df_mini, 50)

        # Finnhub for company name, sector, market cap
        name = symbol
        sector = "Unknown"
        market_cap = None
        finnhub_key = os.getenv("FINNHUB_API_KEY")
        if finnhub_key:
            try:
                prof = req.get(
                    f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={finnhub_key}",
                    timeout=5
                ).json()
                name = prof.get("name", symbol)
                sector = prof.get("finnhubIndustry", "Unknown")
                market_cap = prof.get("marketCapitalization")
            except Exception:
                pass

        logger.info(f"Twelve Data fetch succeeded for {symbol}: {len(price_history)} bars")
        return {
            "symbol": symbol.upper(),
            "name": name,
            "sector": sector,
            "current_price": round(current_price, 2),
            "change_pct": change_pct,
            "volume": latest_volume,
            "market_cap": market_cap,
            "rsi": float(rsi),
            "sma_20": sma_20,
            "sma_50": sma_50,
            "price_history": price_history,
            "cluster": None,
            "cluster_label": None,
        }

    except Exception as e:
        logger.error(f"Twelve Data fetch failed for {symbol}: {e}")
        return _fetch_finnhub_quote_only(symbol)


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

