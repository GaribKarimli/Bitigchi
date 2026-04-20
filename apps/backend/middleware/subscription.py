"""
Subscription Middleware — checks user's subscription tier and enforces
rate limits on protected endpoints.

Free tier: Max 5 sentiment checks per day.
Premium tier: Unlimited.
"""

import logging
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.models import User, Subscription, SubscriptionPlan, SentimentCheck

logger = logging.getLogger(__name__)

FREE_TIER_DAILY_LIMIT = 5


def get_user_plan(user: User, db: Session) -> str:
    """Get the user's current subscription plan."""
    if user.role.value == "admin":
        return "premium"  # Admins always have premium access

    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == user.id)
        .first()
    )
    if sub and sub.plan == SubscriptionPlan.PREMIUM and sub.status.value == "active":
        return "premium"
    return "free"


def check_sentiment_rate_limit(user: User, db: Session) -> dict:
    """
    Check if the user can perform a sentiment analysis.
    Returns {allowed: bool, remaining: int, limit: int, plan: str}
    """
    plan = get_user_plan(user, db)

    if plan == "premium":
        return {
            "allowed": True,
            "remaining": -1,  # unlimited
            "limit": -1,
            "plan": "premium",
        }

    # Count today's checks for free tier
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    checks_today = (
        db.query(func.count(SentimentCheck.id))
        .filter(
            SentimentCheck.user_id == user.id,
            SentimentCheck.created_at >= today_start,
        )
        .scalar()
    )

    remaining = max(0, FREE_TIER_DAILY_LIMIT - checks_today)

    return {
        "allowed": checks_today < FREE_TIER_DAILY_LIMIT,
        "remaining": remaining,
        "limit": FREE_TIER_DAILY_LIMIT,
        "plan": "free",
    }


def enforce_sentiment_limit(user: User, db: Session):
    """Raise 429 if the user has exceeded their sentiment check limit."""
    result = check_sentiment_rate_limit(user, db)
    if not result["allowed"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Daily sentiment check limit reached. Upgrade to Premium for unlimited access.",
                "limit": result["limit"],
                "remaining": 0,
                "plan": result["plan"],
            },
        )


def record_sentiment_check(user: User, ticker: str, result_summary: str, db: Session):
    """Record a sentiment check for rate limiting purposes."""
    check = SentimentCheck(
        user_id=user.id,
        ticker_symbol=ticker.upper(),
        result_summary=result_summary,
    )
    db.add(check)
    db.commit()
