"""
Admin Router — admin-only endpoints for user management,
feedback monitoring, and system stats.
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from auth.dependencies import require_admin
from db.models import User, Subscription, Feedback, SentimentCheck, UserRole, SubscriptionPlan
from schemas import AdminUserResponse, AdminStatsResponse, FeedbackResponse
from middleware.subscription import get_user_plan

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get system-wide statistics."""
    total_users = db.query(func.count(User.id)).scalar()
    premium_users = (
        db.query(func.count(Subscription.id))
        .filter(Subscription.plan == SubscriptionPlan.PREMIUM)
        .scalar()
    )
    total_feedback = db.query(func.count(Feedback.id)).scalar()
    avg_rating = db.query(func.avg(Feedback.rating)).scalar()

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    sentiment_today = (
        db.query(func.count(SentimentCheck.id))
        .filter(SentimentCheck.created_at >= today_start)
        .scalar()
    )

    return AdminStatsResponse(
        total_users=total_users or 0,
        premium_users=premium_users or 0,
        free_users=(total_users or 0) - (premium_users or 0),
        total_feedback=total_feedback or 0,
        total_sentiment_checks_today=sentiment_today or 0,
        avg_feedback_rating=round(avg_rating, 2) if avg_rating else None,
    )


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users with their subscription info."""
    users = db.query(User).offset(skip).limit(limit).all()

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    result = []
    for user in users:
        plan = get_user_plan(user, db)

        checks_today = (
            db.query(func.count(SentimentCheck.id))
            .filter(
                SentimentCheck.user_id == user.id,
                SentimentCheck.created_at >= today_start,
            )
            .scalar()
        )

        sub_status = None
        if user.subscription:
            sub_status = user.subscription.status.value

        result.append(
            AdminUserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role.value,
                is_active=user.is_active,
                is_verified=user.is_verified,
                plan=plan,
                subscription_status=sub_status,
                sentiment_checks_today=checks_today or 0,
                created_at=user.created_at,
            )
        )

    return result


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Activate or deactivate a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot deactivate admin users")

    user.is_active = not user.is_active
    db.commit()
    return {"user_id": user.id, "is_active": user.is_active}


@router.get("/feedback", response_model=list[FeedbackResponse])
def list_feedback(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all user feedback."""
    feedbacks = (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for f in feedbacks:
        user = db.query(User).filter(User.id == f.user_id).first()
        result.append(
            FeedbackResponse(
                id=f.id,
                user_id=f.user_id,
                user_email=user.email if user else None,
                rating=f.rating,
                comment=f.comment,
                created_at=f.created_at,
            )
        )
    return result
