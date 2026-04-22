import logging
import time
import requests
from typing import Optional, Dict, Any
import pandas as pd
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from config import settings

logger = logging.getLogger(__name__)

# --- Connection Pool Management ---
def create_robust_session():
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.3,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(
        pool_connections=50, 
        pool_maxsize=50, 
        max_retries=retry
    )
    session.mount('https://', adapter)
    session.headers.update({
        'User-Agent': 'Bitigchi/1.0 (Market Intelligence)'
    })
    return session

global_session = create_robust_session()

# Module-level cache for downloaded data
_batch_cache: dict = {}
_batch_cache_time: float = 0
BATCH_CACHE_TTL = 1200  # 20 minutes

def _get_finnhub_price(symbol: str) -> Optional[float]:
    """Fetch current price from Finnhub."""
    if not settings.FINNHUB_API_KEY:
        return None
    try:
        fsym = symbol.replace("-USD", "USDT") if "-USD" in symbol else symbol
        url = f"https://finnhub.io/api/v1/quote?symbol={fsym}&token={settings.FINNHUB_API_KEY}"
        response = global_session.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            price = data.get("c")
            return float(price) if price and price > 0 else None
    except Exception as e:
        logger.debug(f"Finnhub failed for {symbol}: {e}")
    return None

def _get_twelvedata_batch_quotes(symbols: list[str]) -> Dict[str, Any]:
    """Fetch batch quotes from TwelveData."""
    if not settings.TWELVEDATA_API_KEY:
        return {}
    try:
        sym_str = ",".join(symbols)
        url = f"https://api.twelvedata.com/quote?symbol={sym_str}&apikey={settings.TWELVEDATA_API_KEY}"
        response = global_session.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.error(f"TwelveData quote batch failed: {e}")
    return {}

def _get_twelvedata_batch_history(symbols: list[str]) -> Dict[str, Any]:
    """Fetch batch time series from TwelveData."""
    if not settings.TWELVEDATA_API_KEY:
        return {}
    try:
        sym_str = ",".join(symbols)
        # Fetch last 60 days
        url = f"https://api.twelvedata.com/time_series?symbol={sym_str}&interval=1day&outputsize=60&apikey={settings.TWELVEDATA_API_KEY}"
        response = global_session.get(url, timeout=15)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.error(f"TwelveData history batch failed: {e}")
    return {}

def _ensure_batch_cache(symbols: list[str] = None):
    """Refreshes basic data cache using TwelveData batching + Finnhub fallbacks."""
    global _batch_cache, _batch_cache_time

    if time.time() - _batch_cache_time < BATCH_CACHE_TTL and _batch_cache:
        return

    if not symbols:
        symbols = settings.TICKERS

    logger.info(f"Synchronizing {len(symbols)} tickers via reliable APIs (No Yahoo Finance)...")
    
    # 1. Try TwelveData Batch Quotes
    batch_quotes = _get_twelvedata_batch_quotes(symbols)
    
    # 2. Try TwelveData Batch History (for charts and technicals)
    batch_history = _get_twelvedata_batch_history(symbols)
    
    # 3. Process results
    for sym in symbols:
        price = 0.0
        name = sym
        
        # Parse Quotes
        if sym in batch_quotes:
            q_data = batch_quotes[sym]
            price = float(q_data.get("price", 0))
            name = q_data.get("name", sym)
        elif "price" in batch_quotes and len(symbols) == 1:
            price = float(batch_quotes.get("price", 0))
            name = batch_quotes.get("name", sym)

        # Fallback to Finnhub if price is missing
        if price <= 0:
            price = _get_finnhub_price(sym) or 0.0

        # Parse History for this symbol
        history_df = None
        if sym in batch_history:
            h_data = batch_history[sym]
            values = h_data.get("values", [])
            if values:
                df = pd.DataFrame(values)
                df = df.iloc[::-1].reset_index(drop=True)
                df = df.rename(columns={
                    "datetime": "Date", "open": "Open", "high": "High", 
                    "low": "Low", "close": "Close", "volume": "Volume"
                })
                for col in ["Open", "High", "Low", "Close", "Volume"]:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                history_df = df

        _batch_cache[f"{sym}_info"] = {
            "symbol": sym,
            "name": name,
            "sector": "Market Component",
            "current_price": price,
            "market_cap": 0,
            "volume": 0,
        }
        if history_df is not None:
             _batch_cache[f"{sym}_history"] = history_df

    _batch_cache_time = time.time()
    _batch_cache["_symbols"] = symbols
    logger.info("Reliable data synchronization complete (TwelveData & Finnhub)")

def get_stock_info(symbol: str) -> dict:
    _ensure_batch_cache()
    cached = _batch_cache.get(f"{symbol}_info")
    if cached:
        return cached

    # Manual fallback for single symbol (rare)
    price = _get_finnhub_price(symbol) or 0.0
    return {
        "symbol": symbol,
        "name": symbol,
        "sector": "Market Component",
        "current_price": price,
        "market_cap": 0,
        "volume": 0,
    }

def get_price_history(
    symbol: str, period: str = "3mo", interval: str = "1d"
) -> Optional[pd.DataFrame]:
    _ensure_batch_cache()
    
    # Check cache first
    cached_df = _batch_cache.get(f"{symbol}_history")
    if cached_df is not None:
        return cached_df.copy()

    # Manual fetch if not in batch (rare, only for non-curated tickers)
    if not settings.TWELVEDATA_API_KEY:
        return None
    
    try:
        td_interval = "1day" if "d" in interval else "1h" if "h" in interval else "1min"
        url = f"https://api.twelvedata.com/time_series?symbol={symbol}&interval={td_interval}&outputsize=60&apikey={settings.TWELVEDATA_API_KEY}"
        response = global_session.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            values = data.get("values", [])
            if values:
                df = pd.DataFrame(values)
                df = df.iloc[::-1].reset_index(drop=True)
                df = df.rename(columns={
                    "datetime": "Date", "open": "Open", "high": "High", 
                    "low": "Low", "close": "Close", "volume": "Volume"
                })
                for col in ["Open", "High", "Low", "Close", "Volume"]:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                return df
    except Exception as e:
        logger.warning(f"Single history fetch failed for {symbol}: {e}")
    
    return None

def calculate_rsi(df: pd.DataFrame, period: int = 14) -> Optional[float]:
    if df is None or len(df) < period + 1:
        return None
    try:
        delta = df["Close"].diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.rolling(window=period).mean()
        avg_loss = loss.rolling(window=period).mean()
        rs = avg_gain / avg_loss.replace(0, 0.001)
        return round(float(100 - (100 / (1 + rs)).iloc[-1]), 2)
    except Exception:
        return None

def calculate_sma(df: pd.DataFrame, window: int) -> Optional[float]:
    if df is None or len(df) < window:
        return None
    try:
        return round(float(df["Close"].rolling(window=window).mean().iloc[-1]), 2)
    except Exception:
        return None
