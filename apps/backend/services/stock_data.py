"""
Stock Data Service — wraps yfinance for price history and company info.
Uses batch downloads to avoid Yahoo Finance rate limits.
"""

import logging
import time
from typing import Optional
import yfinance as yf
import pandas as pd

logger = logging.getLogger(__name__)

# Module-level cache for batch-downloaded data
_batch_cache: dict = {}
_batch_cache_time: float = 0
BATCH_CACHE_TTL = 900  # 15 minutes


def _ensure_batch_cache(symbols: list[str] = None):
    """Download data for all symbols in one batch call to avoid rate limits."""
    global _batch_cache, _batch_cache_time

    if time.time() - _batch_cache_time < BATCH_CACHE_TTL and _batch_cache:
        return

    if not symbols:
        from config import settings
        symbols = settings.TICKERS

    logger.info(f"Batch downloading {len(symbols)} tickers...")
    try:
        # Download all history in a single call
        data = yf.download(
            tickers=symbols,
            period="3mo",
            interval="1d",
            group_by="ticker",
            threads=True,
            progress=False,
        )

        if data is None or data.empty:
            logger.warning("Batch download returned empty data")
            return

        _batch_cache = {"_raw": data, "_symbols": symbols}

        # Also fetch basic info one at a time with small delay
        for sym in symbols:
            try:
                ticker = yf.Ticker(sym)
                # Only access fast_info to avoid rate limits
                fi = ticker.fast_info
                _batch_cache[f"{sym}_info"] = {
                    "symbol": sym,
                    "name": sym,  # fast_info doesn't reliably have shortName
                    "sector": "Unknown",
                    "current_price": getattr(fi, "last_price", None),
                    "market_cap": getattr(fi, "market_cap", None),
                    "volume": getattr(fi, "last_volume", None),
                }
            except Exception as e:
                logger.debug(f"fast_info failed for {sym}: {e}")
                _batch_cache[f"{sym}_info"] = {
                    "symbol": sym,
                    "name": sym,
                    "sector": "Unknown",
                    "current_price": None,
                    "market_cap": None,
                    "volume": None,
                }
            time.sleep(0.1)  # Small delay to avoid throttling

        _batch_cache_time = time.time()
        logger.info("Batch download complete")
    except Exception as e:
        logger.error(f"Batch download failed: {e}")


def get_stock_info(symbol: str) -> dict:
    """Fetch basic company info for a ticker."""
    _ensure_batch_cache()

    cached = _batch_cache.get(f"{symbol}_info")
    if cached:
        return cached

    # Fallback: try individual fetch
    try:
        ticker = yf.Ticker(symbol)
        fi = ticker.fast_info
        return {
            "symbol": symbol,
            "name": symbol,
            "sector": "Unknown",
            "current_price": getattr(fi, "last_price", None),
            "market_cap": getattr(fi, "market_cap", None),
            "volume": getattr(fi, "last_volume", None),
        }
    except Exception as e:
        logger.warning(f"Failed to fetch info for {symbol}: {e}")
        return {
            "symbol": symbol,
            "name": symbol,
            "sector": "Unknown",
            "current_price": None,
            "market_cap": None,
            "volume": None,
        }


def get_price_history(
    symbol: str, period: str = "3mo", interval: str = "1d"
) -> Optional[pd.DataFrame]:
    """Fetch historical OHLCV data (from batch cache if available)."""
    _ensure_batch_cache()

    raw = _batch_cache.get("_raw")
    symbols = _batch_cache.get("_symbols", [])

    if raw is not None and symbol in symbols:
        try:
            if len(symbols) == 1:
                df = raw.copy()
            else:
                df = raw[symbol].copy()

            df = df.dropna(how="all")
            if df.empty:
                return None
            df.reset_index(inplace=True)
            return df
        except Exception as e:
            logger.debug(f"Cache extraction failed for {symbol}: {e}")

    # Fallback: individual download
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
        if df.empty:
            return None
        df.reset_index(inplace=True)
        return df
    except Exception as e:
        logger.warning(f"Failed to fetch history for {symbol}: {e}")
        return None


def calculate_rsi(df: pd.DataFrame, period: int = 14) -> Optional[float]:
    """Calculate the Relative Strength Index (RSI)."""
    if df is None or len(df) < period + 1:
        return None
    try:
        delta = df["Close"].diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)

        avg_gain = gain.rolling(window=period, min_periods=period).mean()
        avg_loss = loss.rolling(window=period, min_periods=period).mean()

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        latest_rsi = rsi.iloc[-1]
        return round(float(latest_rsi), 2) if pd.notna(latest_rsi) else None
    except Exception:
        return None


def calculate_sma(df: pd.DataFrame, window: int) -> Optional[float]:
    """Calculate the Simple Moving Average for the given window."""
    if df is None or len(df) < window:
        return None
    try:
        sma = df["Close"].rolling(window=window).mean().iloc[-1]
        return round(float(sma), 2) if pd.notna(sma) else None
    except Exception:
        return None
