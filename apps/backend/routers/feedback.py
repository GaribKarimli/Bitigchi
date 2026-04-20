"""
Feedback Router — user feedback submission and retrieval.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from auth.dependencies import get_current_user
from db.models import User, Feedback
from schemas import FeedbackCreate, FeedbackResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit user feedback (rating + optional comment)."""
    feedback = Feedback(
        user_id=current_user.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    logger.info(f"Feedback submitted by {current_user.email}: {data.rating}/5")

    return FeedbackResponse(
        id=feedback.id,
        user_id=feedback.user_id,
        user_email=current_user.email,
        rating=feedback.rating,
        comment=feedback.comment,
        created_at=feedback.created_at,
    )


@router.get("/mine", response_model=list[FeedbackResponse])
def get_my_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's submitted feedback."""
    feedbacks = (
        db.query(Feedback)
        .filter(Feedback.user_id == current_user.id)
        .order_by(Feedback.created_at.desc())
        .all()
    )
    return [
        FeedbackResponse(
            id=f.id,
            user_id=f.user_id,
            user_email=current_user.email,
            rating=f.rating,
            comment=f.comment,
            created_at=f.created_at,
        )
        for f in feedbacks
    ]
