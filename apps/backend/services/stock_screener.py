"""
Stock Screener Service — fetches data for curated tickers, calculates
technical indicators, and clusters them with KMeans to identify patterns.

Falls back to realistic demo data when Yahoo Finance is unavailable.
"""

import logging
import random
import math
from datetime import datetime, timezone, timedelta
from typing import Optional
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from config import settings
from services.stock_data import (
    get_stock_info,
    get_price_history,
    calculate_rsi,
    calculate_sma,
)

logger = logging.getLogger(__name__)

CLUSTER_LABELS = {
    0: "Momentum",
    1: "Oversold",
    2: "Stable",
    3: "Volatile",
    4: "Overbought",
}

# Realistic reference data for demo mode — must match config.py TICKERS exactly
DEMO_STOCKS = {
    "AAPL": {"name": "Apple Inc.", "sector": "Technology", "base_price": 198.50, "volatility": 0.015},
    "MSFT": {"name": "Microsoft Corp.", "sector": "Technology", "base_price": 425.80, "volatility": 0.012},
    "GOOGL": {"name": "Alphabet Inc.", "sector": "Technology", "base_price": 176.20, "volatility": 0.014},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Consumer Cyclical", "base_price": 186.50, "volatility": 0.016},
    "NVDA": {"name": "NVIDIA Corp.", "sector": "Technology", "base_price": 880.40, "volatility": 0.025},
    "META": {"name": "Meta Platforms Inc.", "sector": "Technology", "base_price": 510.30, "volatility": 0.02},
    "TSLA": {"name": "Tesla Inc.", "sector": "Consumer Cyclical", "base_price": 172.80, "volatility": 0.035},
    "AMD": {"name": "Advanced Micro Devices", "sector": "Technology", "base_price": 162.50, "volatility": 0.022},
    "NFLX": {"name": "Netflix Inc.", "sector": "Communication", "base_price": 628.40, "volatility": 0.018},
    "CRM": {"name": "Salesforce Inc.", "sector": "Technology", "base_price": 272.60, "volatility": 0.016},
    "ORCL": {"name": "Oracle Corp.", "sector": "Technology", "base_price": 164.80, "volatility": 0.015},
    "INTC": {"name": "Intel Corp.", "sector": "Technology", "base_price": 31.20, "volatility": 0.02},
    "QCOM": {"name": "Qualcomm Inc.", "sector": "Technology", "base_price": 168.40, "volatility": 0.018},
    "AVGO": {"name": "Broadcom Inc.", "sector": "Technology", "base_price": 1340.60, "volatility": 0.02},
    "ADBE": {"name": "Adobe Inc.", "sector": "Technology", "base_price": 524.30, "volatility": 0.016},
    "PYPL": {"name": "PayPal Holdings", "sector": "Financial", "base_price": 64.50, "volatility": 0.018},
    "SQ": {"name": "Block Inc.", "sector": "Technology", "base_price": 78.60, "volatility": 0.025},
    "SHOP": {"name": "Shopify Inc.", "sector": "Technology", "base_price": 78.90, "volatility": 0.025},
    "COIN": {"name": "Coinbase Global", "sector": "Financial", "base_price": 225.40, "volatility": 0.035},
    "PLTR": {"name": "Palantir Technologies", "sector": "Technology", "base_price": 24.30, "volatility": 0.03},
    "BA": {"name": "Boeing Co.", "sector": "Industrials", "base_price": 178.50, "volatility": 0.02},
    "DIS": {"name": "Walt Disney Co.", "sector": "Communication", "base_price": 112.40, "volatility": 0.016},
    "NKE": {"name": "Nike Inc.", "sector": "Consumer Cyclical", "base_price": 97.60, "volatility": 0.014},
    "JPM": {"name": "JPMorgan Chase", "sector": "Financial", "base_price": 198.90, "volatility": 0.012},
    "GS": {"name": "Goldman Sachs", "sector": "Financial", "base_price": 458.70, "volatility": 0.014},
    "V": {"name": "Visa Inc.", "sector": "Financial", "base_price": 280.30, "volatility": 0.01},
    "MA": {"name": "Mastercard Inc.", "sector": "Financial", "base_price": 468.20, "volatility": 0.011},
    "UNH": {"name": "UnitedHealth Group", "sector": "Healthcare", "base_price": 492.60, "volatility": 0.013},
    "PFE": {"name": "Pfizer Inc.", "sector": "Healthcare", "base_price": 27.80, "volatility": 0.015},
    "XOM": {"name": "Exxon Mobil Corp.", "sector": "Energy", "base_price": 104.20, "volatility": 0.012},
}


def _generate_demo_price_history(base_price: float, volatility: float, days: int = 60):
    """Generate realistic-looking price history with random walk."""
    random.seed(hash(str(base_price)))  # Deterministic per ticker
    prices = []
    price = base_price * 0.92  # Start ~8% lower to show growth trend
    now = datetime.now(timezone.utc)

    for i in range(days):
        date = now - timedelta(days=days - i)
        # Random walk with slight upward bias
        change = random.gauss(0.0003, volatility)
        price = price * (1 + change)
        high = price * (1 + abs(random.gauss(0, volatility * 0.5)))
        low = price * (1 - abs(random.gauss(0, volatility * 0.5)))
        volume = int(random.gauss(50_000_000, 15_000_000))
        prices.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(price * (1 + random.gauss(0, 0.002)), 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(price, 2),
            "volume": max(volume, 1_000_000),
        })

    return prices


def _generate_demo_data() -> dict:
    """Generate complete demo screener data when yfinance is unavailable."""
    logger.info("📊 Generating demo data (Yahoo Finance unavailable)...")
    results = []

    for symbol, meta in DEMO_STOCKS.items():
        if symbol not in settings.TICKERS:
            continue

        history = _generate_demo_price_history(meta["base_price"], meta["volatility"])
        closes = [p["close"] for p in history]
        current_price = closes[-1]
        change_pct = round(((closes[-1] - closes[-6]) / closes[-6]) * 100, 2)

        # Calculate RSI from demo data
        deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
        gains = [d if d > 0 else 0 for d in deltas[-14:]]
        losses = [-d if d < 0 else 0 for d in deltas[-14:]]
        avg_gain = sum(gains) / 14
        avg_loss = sum(losses) / 14
        rs = avg_gain / avg_loss if avg_loss > 0 else 100
        rsi = round(100 - (100 / (1 + rs)), 2)

        sma_20 = round(sum(closes[-20:]) / 20, 2)
        sma_50 = round(sum(closes[-50:]) / 50, 2) if len(closes) >= 50 else None

        vol_change = round(random.gauss(0, 25), 2)

        results.append({
            "symbol": symbol,
            "name": meta["name"],
            "sector": meta["sector"],
            "current_price": round(current_price, 2),
            "change_pct": change_pct,
            "volume": random.randint(10_000_000, 80_000_000),
            "rsi": rsi,
            "sma_20": sma_20,
            "sma_50": sma_50,
            "price_history": history[-30:],
            "_features": [rsi, change_pct, vol_change],
        })

    # Run KMeans clustering on demo data
    if len(results) >= 3:
        feature_matrix = np.array([r["_features"] for r in results])
        scaler = StandardScaler()
        scaled = scaler.fit_transform(feature_matrix)
        n_clusters = min(5, len(results))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(scaled)

        cluster_groups: dict[str, list[str]] = {}
        for i, item in enumerate(results):
            cluster_id = int(labels[i])
            label = CLUSTER_LABELS.get(cluster_id, f"Cluster {cluster_id}")
            item["cluster"] = cluster_id
            item["cluster_label"] = label
            del item["_features"]
            if label not in cluster_groups:
                cluster_groups[label] = []
            cluster_groups[label].append(item["symbol"])
    else:
        cluster_groups = {}
        for item in results:
            item["cluster"] = 0
            item["cluster_label"] = "Uncategorized"
            if "_features" in item:
                del item["_features"]

    logger.info(f"Demo data ready: {len(results)} tickers")
    return {
        "tickers": results,
        "clusters": cluster_groups,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _compute_features(symbol: str) -> Optional[dict]:
    """Compute screener features for a single ticker."""
    try:
        info = get_stock_info(symbol)
        df = get_price_history(symbol, period="3mo", interval="1d")
        if df is None or len(df) < 20:
            return None

        current_price = info.get("current_price")
        if current_price is None and len(df) > 0:
            current_price = float(df["Close"].iloc[-1])

        # Price change percentage (last trading day)
        if len(df) >= 2:
            change_pct = round(
                ((df["Close"].iloc[-1] - df["Close"].iloc[-2]) / df["Close"].iloc[-2])
                * 100,
                2,
            )
        else:
            change_pct = 0.0

        # Volume change percentage
        avg_vol = df["Volume"].rolling(20).mean().iloc[-1]
        latest_vol = df["Volume"].iloc[-1]
        vol_change = (
            round(((latest_vol - avg_vol) / avg_vol) * 100, 2)
            if avg_vol and avg_vol > 0
            else 0.0
        )

        rsi = calculate_rsi(df) or 50.0
        sma_20 = calculate_sma(df, 20)
        sma_50 = calculate_sma(df, 50)

        # Price history for sparkline (last 30 points)
        history_slice = df.tail(30)
        price_history = []
        for _, row in history_slice.iterrows():
            date_val = row.get("Date")
            if hasattr(date_val, "isoformat"):
                date_str = date_val.isoformat()
            else:
                date_str = str(date_val)
            price_history.append(
                {
                    "date": date_str,
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]),
                }
            )

        return {
            "symbol": symbol,
            "name": info.get("name", symbol),
            "sector": info.get("sector", "Unknown"),
            "current_price": round(current_price, 2) if current_price else None,
            "change_pct": float(change_pct),
            "volume": int(latest_vol) if pd.notna(latest_vol) else None,
            "rsi": float(rsi),
            "sma_20": sma_20,
            "sma_50": sma_50,
            "price_history": price_history,
            # Raw features for clustering
            "_features": [float(rsi), float(change_pct), float(vol_change)],
        }
    except Exception as e:
        logger.error(f"Error computing features for {symbol}: {e}")
        return None


def run_screener() -> dict:
    """Run the full screener: fetch data, compute indicators, cluster."""
    logger.info(f"Running screener for {len(settings.TICKERS)} tickers...")

    # Step 1: Compute features for all tickers
    results = []
    for symbol in settings.TICKERS:
        item = _compute_features(symbol)
        if item:
            results.append(item)

    # If live data failed (rate limited / no internet), use demo data
    if len(results) < 3:
        logger.warning(f"Only {len(results)} tickers returned live data — falling back to demo mode")
        return _generate_demo_data()

    # Step 2: KMeans clustering
    feature_matrix = np.array([r["_features"] for r in results])
    scaler = StandardScaler()
    scaled = scaler.fit_transform(feature_matrix)

    n_clusters = min(5, len(results))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(scaled)

    # Step 3: Assign cluster labels
    cluster_groups: dict[str, list[str]] = {}
    for i, item in enumerate(results):
        cluster_id = int(labels[i])
        label = CLUSTER_LABELS.get(cluster_id, f"Cluster {cluster_id}")
        item["cluster"] = cluster_id
        item["cluster_label"] = label
        del item["_features"]

        if label not in cluster_groups:
            cluster_groups[label] = []
        cluster_groups[label].append(item["symbol"])

    logger.info(f"Screener complete: {len(results)} tickers, {n_clusters} clusters")

    return {
        "tickers": results,
        "clusters": cluster_groups,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
