from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from db.database import get_db
from db import models
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/social", tags=["Social"])

# --- Schemas ---

class CommentCreate(BaseModel):
    symbol: str
    content: str
    sentiment: Optional[str] = None # "bullish", "bearish", "neutral"
    parent_id: Optional[int] = None

class ReactionCreate(BaseModel):
    comment_id: int
    reaction_type: str # "like", "bullish", "bearish"

class UserPublic(BaseModel):
    full_name: Optional[str]
    email: str # In a real app, hide this or use a username

class CommentResponse(BaseModel):
    id: int
    user: UserPublic
    symbol: str
    content: str
    sentiment: Optional[str]
    parent_id: Optional[int]
    created_at: datetime
    likes_count: int = 0
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/comments", response_model=CommentResponse)
def post_comment(
    req: CommentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Post a new comment on a stock."""
    new_comment = models.Comment(
        user_id=current_user.id,
        symbol=req.symbol.upper(),
        content=req.content,
        sentiment=req.sentiment,
        parent_id=req.parent_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return new_comment

@router.get("/comments/{symbol}", response_model=List[CommentResponse])
def get_comments(
    symbol: str,
    db: Session = Depends(get_db)
):
    """Fetch all discussions for a specific ticker."""
    comments = db.query(models.Comment).filter(
        models.Comment.symbol == symbol.upper(),
        models.Comment.parent_id == None
    ).order_by(desc(models.Comment.created_at)).all()
    
    # Simple manual count for reactions (could be optimized)
    for c in comments:
        c.likes_count = len([r for r in c.reactions if r.reaction_type == "like"])
        
    return comments

@router.get("/community/feed", response_model=List[CommentResponse])
def get_global_feed(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """The 'Community' page feed — latest highlights from all stocks."""
    comments = db.query(models.Comment).order_by(
        desc(models.Comment.created_at)
    ).limit(limit).all()
    return comments

@router.post("/react")
def react_to_comment(
    req: ReactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like or tag a comment."""
    # Remove existing reaction from this user on this comment
    db.query(models.CommentReaction).filter(
        models.CommentReaction.comment_id == req.comment_id,
        models.CommentReaction.user_id == current_user.id
    ).delete()
    
    new_reaction = models.CommentReaction(
        comment_id=req.comment_id,
        user_id=current_user.id,
        reaction_type=req.reaction_type
    )
    db.add(new_reaction)
    db.commit()
    return {"status": "success", "reaction": req.reaction_type}
