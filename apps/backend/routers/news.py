"""
News Router — fetches financial news using a round-robin strategy:
  - NewsData.io (rich data, images) with daily quota management
  - Google News RSS (unlimited, no images) as fallback

Strategy: Every 3rd request goes to NewsData.io, the rest to Google RSS.
This stretches the 200/day NewsData free-tier limit.
"""

import logging
import time
import os
import hashlib
import json
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
import xml.etree.ElementTree as ET
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["News"])

# ─── Configuration ──────────────────────────────────────
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY", "")
NEWSDATA_BASE = "https://newsdata.io/api/1/news"
# Google News Business RSS — unlimited, no API key required
GOOGLE_NEWS_RSS = "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en"

# ─── Rate tracking ──────────────────────────────────────
_newsapi_calls_today = 0
_newsapi_day_start = datetime.now(timezone.utc).date()
NEWSAPI_DAILY_LIMIT = 190  # Reserve 10 calls as buffer

_request_counter = 0  # Round-robin counter

# ─── Cache ──────────────────────────────────────────────
_news_cache: list[dict] = []
_cache_time: float = 0
CACHE_TTL = 600  # 10 minutes


def _reset_daily_counter():
    """Reset NewsAPI counter at day boundary."""
    global _newsapi_calls_today, _newsapi_day_start
    today = datetime.now(timezone.utc).date()
    if today != _newsapi_day_start:
        _newsapi_calls_today = 0
        _newsapi_day_start = today
        logger.info("NewsAPI daily counter reset")


def _can_use_newsapi() -> bool:
    """Check if NewsData.io is available and under quota."""
    _reset_daily_counter()
    return bool(NEWSDATA_API_KEY) and _newsapi_calls_today < NEWSAPI_DAILY_LIMIT


async def _fetch_newsapi() -> list[dict]:
    """Fetch news from NewsData.io."""
    global _newsapi_calls_today
    
    if not _can_use_newsapi():
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                NEWSDATA_BASE,
                params={
                    "category": "business",
                    "language": "en",
                    "apikey": NEWSDATA_API_KEY,
                },
            )
            _newsapi_calls_today += 1
            logger.info(f"NewsData.io call #{_newsapi_calls_today}/{NEWSAPI_DAILY_LIMIT}")

            if resp.status_code != 200:
                logger.warning(f"NewsData.io returned {resp.status_code}")
                return []

            data = resp.json()
            articles = []
            for a in data.get("results", []):
                if not a.get("title") or a.get("title") == "[Removed]":
                    continue
                articles.append({
                    "id": a.get("article_id") or hashlib.md5(a["title"].encode()).hexdigest()[:12],
                    "title": a["title"],
                    "summary": a.get("description") or "",
                    "source": a.get("source_name", "Unknown"),
                    "url": a.get("link", ""),
                    "image_url": a.get("image_url") or "",
                    "published_at": a.get("pubDate", ""),
                    "provider": "newsdata.io",
                })
            return articles
    except Exception as e:
        logger.error(f"NewsData.io fetch failed: {e}")
        return []


async def _fetch_google_rss() -> list[dict]:
    """Fetch news from Google News RSS feed."""
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(GOOGLE_NEWS_RSS)
            if resp.status_code != 200:
                logger.warning(f"Google RSS returned {resp.status_code}")
                return []

            root = ET.fromstring(resp.text)
            channel = root.find("channel")
            if channel is None:
                return []

            articles = []
            for item in channel.findall("item"):
                title = item.findtext("title", "")
                link = item.findtext("link", "")
                description = item.findtext("description", "")
                pub_date = item.findtext("pubDate", "")
                
                source = "Google News"
                source_elem = item.find("source")
                if source_elem is not None and source_elem.text:
                    source = source_elem.text

                image_url = ""

                if not title:
                    continue

                # Parse date
                parsed_date = ""
                if pub_date:
                    try:
                        from email.utils import parsedate_to_datetime
                        dt = parsedate_to_datetime(pub_date)
                        parsed_date = dt.isoformat()
                    except Exception:
                        parsed_date = pub_date

                import re
                summary_text = re.sub('<[^<]+?>', '', description) if description else ""

                articles.append({
                    "id": hashlib.md5(title.encode()).hexdigest()[:12],
                    "title": title,
                    "summary": summary_text[:300] if summary_text else "",
                    "source": source,
                    "url": link,
                    "image_url": image_url,
                    "published_at": parsed_date,
                    "provider": "google",
                })
            return articles
    except Exception as e:
        logger.error(f"Google RSS fetch failed: {e}")
        return []


async def _fetch_merged_news() -> list[dict]:
    """
    Round-robin news fetching:
    - Every 3rd call uses NewsAPI (if quota available)
    - Other calls use Google RSS
    - Results are merged and deduplicated
    """
    global _request_counter
    _request_counter += 1

    newsapi_articles = []
    google_articles = []

    # Round-robin: every 3rd request goes to NewsAPI
    use_newsapi = (_request_counter % 3 == 0) and _can_use_newsapi()

    if use_newsapi:
        newsapi_articles = await _fetch_newsapi()
        logger.info(f"NewsAPI returned {len(newsapi_articles)} articles")

    # Always fetch Google as baseline
    google_articles = await _fetch_google_rss()
    logger.info(f"Google RSS returned {len(google_articles)} articles")

    # Merge: NewsAPI first (better quality), then Google
    seen_titles = set()
    merged = []

    for article in newsapi_articles + google_articles:
        # Deduplicate by normalized title
        norm_title = article["title"].lower().strip()[:60]
        if norm_title not in seen_titles:
            seen_titles.add(norm_title)
            merged.append(article)

    # Sort by date (newest first)
    merged.sort(key=lambda x: x.get("published_at", ""), reverse=True)

    return merged[:30]  # Cap at 30 articles


@router.get("/news")
async def get_news():
    """Get latest financial news (merged from NewsData.io + Google RSS)."""
    global _news_cache, _cache_time

    # Serve from cache if fresh
    if time.time() - _cache_time < CACHE_TTL and _news_cache:
        return {
            "articles": _news_cache,
            "total": len(_news_cache),
            "cached": True,
            "newsapi_remaining": NEWSAPI_DAILY_LIMIT - _newsapi_calls_today,
        }

    articles = await _fetch_merged_news()

    # Update cache
    _news_cache = articles
    _cache_time = time.time()

    return {
        "articles": articles,
        "total": len(articles),
        "cached": False,
        "newsapi_remaining": NEWSAPI_DAILY_LIMIT - _newsapi_calls_today,
    }
