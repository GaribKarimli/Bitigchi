"""
Sentiment Analysis Service — combines Yahoo Finance RSS news and Reddit (praw)
with ProsusAI/finbert for financial sentiment classification.

Key design: Reddit scraping gracefully falls back if PRAW credentials are missing.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

import feedparser

from config import settings

logger = logging.getLogger(__name__)

# ─── Lazy-loaded globals ───────────────────────────────
_finbert_pipeline = None
_reddit_instance = None
_reddit_init_attempted = False


def _get_finbert():
    """Lazy-load the FinBERT pipeline (heavy model, load once)."""
    global _finbert_pipeline
    if _finbert_pipeline is None:
        logger.info("Loading FinBERT model (first call)...")
        from transformers import pipeline

        _finbert_pipeline = pipeline(
            "sentiment-analysis",
            model="ProsusAI/finbert",
            top_k=None,
            truncation=True,
        )
        logger.info("FinBERT model loaded successfully.")
    return _finbert_pipeline


def _get_reddit():
    """
    Lazy-initialize Reddit (praw) client.
    Returns None if credentials are missing — this is the fallback path.
    """
    global _reddit_instance, _reddit_init_attempted

    if _reddit_init_attempted:
        return _reddit_instance

    _reddit_init_attempted = True

    if not settings.reddit_configured:
        logger.info(
            "Reddit API credentials not configured. "
            "Sentiment analysis will use news headlines only."
        )
        return None

    try:
        import praw

        _reddit_instance = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT,
        )
        # Quick validation
        _reddit_instance.user.me()
        logger.info("Reddit (praw) client initialized successfully.")
    except Exception as e:
        logger.warning(f"Reddit initialization failed (falling back to news-only): {e}")
        _reddit_instance = None

    return _reddit_instance


# ─── Data Fetchers ──────────────────────────────────────


def fetch_news_headlines(ticker: str, max_items: int = 15) -> list[dict]:
    """Fetch latest and most relevant news headlines from Google News RSS."""
    headlines = []
    try:
        url = f"https://news.google.com/rss/search?q={ticker}+stock&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(url)

        for entry in feed.entries[:max_items]:
            headlines.append(
                {
                    "title": entry.get("title", ""),
                    "source": "news",
                    "url": entry.get("link", ""),
                }
            )
        logger.info(f"Fetched {len(headlines)} news headlines for {ticker}")
    except Exception as e:
        logger.error(f"Error fetching news for {ticker}: {e}")

    return headlines


def fetch_reddit_posts(ticker: str, max_items: int = 10) -> list[dict]:
    """Fetch recent hot posts from financial subreddits."""
    reddit = _get_reddit()
    if reddit is None:
        return []

    posts = []
    subreddits = ["wallstreetbets", "stocks", "investing"]

    try:
        for sub_name in subreddits:
            if len(posts) >= max_items:
                break
            try:
                subreddit = reddit.subreddit(sub_name)
                # Changed time_filter from week to month to capture bigger structural sentiment changes
                for post in subreddit.search(
                    ticker, sort="hot", time_filter="month", limit=5
                ):
                    posts.append(
                        {
                            "title": post.title,
                            "source": "reddit",
                            "url": f"https://reddit.com{post.permalink}",
                        }
                    )
                    if len(posts) >= max_items:
                        break
            except Exception as e:
                logger.warning(f"Error searching r/{sub_name} for {ticker}: {e}")
                continue

        logger.info(f"Fetched {len(posts)} Reddit posts for {ticker}")
    except Exception as e:
        logger.error(f"Reddit scraping failed for {ticker}: {e}")

    return posts


# ─── Sentiment Analysis ────────────────────────────────


def analyze_texts(texts: list[str]) -> list[dict]:
    """
    Run a batch of texts through FinBERT.
    Returns list of { label, positive, negative, neutral } dicts.
    """
    if not texts:
        return []

    classifier = _get_finbert()
    results = []

    # Process in batches of 8 to avoid memory issues
    batch_size = 8
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        try:
            predictions = classifier(batch)
            for pred in predictions:
                scores = {item["label"]: item["score"] for item in pred}
                top_label = max(scores, key=scores.get)
                results.append(
                    {
                        "label": top_label,
                        "positive": round(scores.get("positive", 0), 4),
                        "negative": round(scores.get("negative", 0), 4),
                        "neutral": round(scores.get("neutral", 0), 4),
                    }
                )
        except Exception as e:
            logger.error(f"FinBERT inference error on batch {i}: {e}")
            for _ in batch:
                results.append(
                    {"label": "neutral", "positive": 0, "negative": 0, "neutral": 1}
                )

    return results


def get_sentiment(ticker: str) -> dict:
    """
    Full sentiment analysis pipeline for a ticker:
    1. Fetch news headlines
    2. Fetch Reddit posts (if configured)
    3. Run all through FinBERT
    4. Aggregate scores
    """
    # Fetch sources
    news = fetch_news_headlines(ticker)
    reddit_posts = fetch_reddit_posts(ticker)
    reddit_available = len(reddit_posts) > 0

    all_items = news + reddit_posts
    if not all_items:
        return {
            "ticker": ticker,
            "bullish_pct": 0,
            "neutral_pct": 100,
            "bearish_pct": 0,
            "overall_sentiment": "neutral",
            "article_count": 0,
            "articles": [],
            "reddit_available": False,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }

    # Run FinBERT
    texts = [item["title"] for item in all_items]
    sentiments = analyze_texts(texts)

    # Build enriched articles
    articles = []
    for item, sent in zip(all_items, sentiments):
        # Map FinBERT labels to our naming
        label_map = {"positive": "positive", "negative": "negative", "neutral": "neutral"}
        mapped_label = label_map.get(sent["label"], "neutral")
        confidence = max(sent["positive"], sent["negative"], sent["neutral"])

        articles.append(
            {
                "title": item["title"],
                "source": item["source"],
                "url": item.get("url", ""),
                "sentiment": mapped_label,
                "confidence": round(confidence, 4),
            }
        )

    # Aggregate scores with a slight amplification to positive/negative to counter FinBERT's heavy Neutral bias on objective news
    total = len(sentiments)
    raw_pos = sum(s["positive"] for s in sentiments) / total
    raw_neg = sum(s["negative"] for s in sentiments) / total
    raw_neu = sum(s["neutral"] for s in sentiments) / total

    # Amplify pos/neg signals (Financial news is highly objective, so a 0.2 positive score is actually a strong buy signal)
    boosted_pos = raw_pos * 1.6
    boosted_neg = raw_neg * 1.6
    boosted_neu = raw_neu
    
    total_score = boosted_pos + boosted_neg + boosted_neu
    bullish_pct = round((boosted_pos / total_score) * 100, 1) if total_score > 0 else 0
    bearish_pct = round((boosted_neg / total_score) * 100, 1) if total_score > 0 else 0
    neutral_pct = round(100 - bullish_pct - bearish_pct, 1)

    # Overall sentiment (Relative instead of strict 50%)
    if bullish_pct > bearish_pct and bullish_pct > 35:
        overall = "bullish"
    elif bearish_pct > bullish_pct and bearish_pct > 35:
        overall = "bearish"
    else:
        overall = "neutral"

    return {
        "ticker": ticker.upper(),
        "bullish_pct": bullish_pct,
        "neutral_pct": neutral_pct,
        "bearish_pct": bearish_pct,
        "overall_sentiment": overall,
        "article_count": total,
        "articles": articles,
        "reddit_available": reddit_available,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
