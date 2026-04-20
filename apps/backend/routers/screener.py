"""
Screener Router — exposes the stock screener endpoint.
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from auth.dependencies import get_current_user_optional
from db.models import User
from services.stock_screener import run_screener
from schemas import ScreenerResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Screener"])

# In-memory cache for screener results (refreshed every 15 minutes)
_screener_cache: dict = {}
_cache_timestamp: datetime | None = None
_CACHE_TTL_SECONDS = 900  # 15 minutes


@router.get("/screener", response_model=ScreenerResponse)
def get_screener(
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Get screened stock data with clustering.
    Available to all users (auth optional for basic view).
    """
    global _screener_cache, _cache_timestamp

    now = datetime.now(timezone.utc)

    # Check cache
    if (
        _screener_cache
        and _cache_timestamp
        and (now - _cache_timestamp).total_seconds() < _CACHE_TTL_SECONDS
    ):
        logger.info("Serving screener from cache")
        return _screener_cache

    # Run fresh screener
    logger.info("Running fresh screener analysis...")
    result = run_screener()

    # Cache the result
    _screener_cache = result
    _cache_timestamp = now

    return result
