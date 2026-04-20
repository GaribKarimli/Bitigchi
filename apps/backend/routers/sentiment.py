"""
Sentiment Router — exposes FinBERT-powered sentiment analysis endpoint.
Enforces subscription rate limits (free: 5/day, premium: unlimited).
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from auth.dependencies import get_current_user
from db.models import User
from services.sentiment_service import get_sentiment
from middleware.subscription import (
    enforce_sentiment_limit,
    record_sentiment_check,
    check_sentiment_rate_limit,
)
from schemas import SentimentResponse
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Sentiment Analysis"])


@router.get("/sentiment/{ticker}", response_model=SentimentResponse)
def analyze_sentiment(
    ticker: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get AI sentiment analysis for a ticker.
    Requires authentication. Free tier limited to 5 checks/day.
    """
    # Normalize and validate ticker format (allow any valid ticker, not just curated list)
    ticker = ticker.upper().strip()
    if not ticker or len(ticker) > 10 or not ticker.replace(".", "").replace("-", "").isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ticker symbol: '{ticker}'",
        )

    # Enforce rate limit
    enforce_sentiment_limit(current_user, db)

    # Run sentiment analysis
    logger.info(f"Running sentiment analysis for {ticker} (user: {current_user.email})")
    result = get_sentiment(ticker)

    # Record the check for rate limiting
    record_sentiment_check(
        current_user, ticker, result["overall_sentiment"], db
    )

    return result


@router.get("/sentiment-limit")
def get_sentiment_limit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check current user's remaining sentiment checks."""
    return check_sentiment_rate_limit(current_user, db)
