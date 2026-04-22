from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import or_

from db.mongo import get_mongo_db
from auth.dependencies import get_current_user
from db.models import User
from services.minio_service import compress_and_upload_image, upload_video
from schemas.social_mongo import (
    PostResponse, generate_uuid, FollowStatus, 
    CommentResponse, UserSearchResponse, ProfileViewResponse
)

router = APIRouter(prefix="/api/v2/social", tags=["Social V2 (MongoDB)"])

# -----------------
# Likes & Comments
# -----------------

@router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user: User = Depends(get_current_user)):
    db_mongo = get_mongo_db()
    
    # Check if already liked
    like_id = f"{user.id}_{post_id}"
    existing = await db_mongo.likes.find_one({"_id": like_id})
    
    if existing:
        # Unlike
        await db_mongo.likes.delete_one({"_id": like_id})
        await db_mongo.posts.update_one({"_id": post_id}, {"$inc": {"likes_count": -1}})
        return {"status": "unliked", "post_id": post_id}
    else:
        # Like
        await db_mongo.likes.insert_one({
            "_id": like_id,
            "user_id": user.id,
            "post_id": post_id,
            "created_at": datetime.utcnow()
        })
        await db_mongo.posts.update_one({"_id": post_id}, {"$inc": {"likes_count": 1}})
        return {"status": "liked", "post_id": post_id}

@router.post("/posts/{post_id}/comment", response_model=CommentResponse)
async def add_comment(
    post_id: str, 
    content: str = Form(...), 
    user: User = Depends(get_current_user)
):
    db_mongo = get_mongo_db()
    
    comment_doc = {
        "_id": generate_uuid(),
        "post_id": post_id,
        "user_id": user.id,
        "user_name": user.full_name or "Anonymous Investor",
        "user_avatar": user.avatar_url,
        "content": content,
        "created_at": datetime.utcnow()
    }
    
    await db_mongo.comments.insert_one(comment_doc)
    await db_mongo.posts.update_one({"_id": post_id}, {"$inc": {"comments_count": 1}})
    return comment_doc

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    db_mongo = get_mongo_db()
    cursor = db_mongo.comments.find({"post_id": post_id}).sort("created_at", 1)
    return await cursor.to_list(length=100)

# -----------------
# User Search & Profile Views
# -----------------

@router.get("/users/search", response_model=List[UserSearchResponse])
async def search_users(q: str, db_postgres: Session = Depends(get_db)):
    # Search in Postgres
    users = db_postgres.query(User).filter(
        or_(
            User.full_name.ilike(f"%{q}%"),
            User.email.ilike(f"%{q}%")
        )
    ).limit(20).all()
    
    return [
        {
            "id": u.id,
            "full_name": u.full_name or "Anonymous",
            "avatar_url": u.avatar_url,
            "is_premium": u.is_premium
        } for u in users
    ]

@router.post("/users/{target_id}/view")
async def record_profile_view(target_id: int, user: User = Depends(get_current_user)):
    if target_id == user.id:
        return {"status": "ignored"}
        
    db_mongo = get_mongo_db()
    
    # Track daily views to avoid spam
    today = datetime.utcnow().strftime("%Y-%m-%d")
    view_id = f"view_{user.id}_{target_id}_{today}"
    
    existing = await db_mongo.profile_views.find_one({"_id": view_id})
    if not existing:
        await db_mongo.profile_views.insert_one({
            "_id": view_id,
            "viewer_id": user.id,
            "viewer_name": user.full_name or "Someone",
            "viewer_avatar": user.avatar_url,
            "viewed_user_id": target_id,
            "viewed_at": datetime.utcnow()
        })
    return {"status": "recorded"}

@router.get("/users/me/views", response_model=List[ProfileViewResponse])
async def get_my_profile_views(user: User = Depends(get_current_user)):
    if not user.is_premium:
        raise HTTPException(
            status_code=403, 
            detail="Who viewed my profile feature is exclusive to PRO users."
        )
        
    db_mongo = get_mongo_db()
    cursor = db_mongo.profile_views.find({"viewed_user_id": user.id}).sort("viewed_at", -1).limit(50)
    return await cursor.to_list(length=50)

# -----------------
# Feeds (Existing)
# -----------------

@router.post("/posts", response_model=PostResponse)
async def create_post(
    content: str = Form(...),
    ticker: Optional[str] = Form(None),
    sentiment: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user)
):
    db_mongo = get_mongo_db()
    media_url = None
    media_type = None
    
    if file:
        if file.content_type.startswith("image/"):
            media_url = await compress_and_upload_image(file)
            media_type = "image"
        elif file.content_type.startswith("video/"):
            media_url = await upload_video(file)
            media_type = "video"
            
    post_doc = {
        "_id": generate_uuid(),
        "user_id": user.id,
        "user_name": user.full_name or "Anonymous Investor",
        "user_avatar": user.avatar_url,
        "content": content,
        "ticker": ticker,
        "sentiment": sentiment,
        "media_url": media_url,
        "media_type": media_type,
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.utcnow()
    }
    
    await db_mongo.posts.insert_one(post_doc)
    return post_doc

@router.get("/feed/global", response_model=List[PostResponse])
async def get_global_feed(limit: int = 50, skip: int = 0):
    db = get_mongo_db()
    cursor = db.posts.find().sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)
    return posts

@router.post("/users/{target_id}/follow")
async def follow_user(target_id: int, user: User = Depends(get_current_user)):
    if target_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
    db = get_mongo_db()
    
    # Check if already following
    existing = await db.followers.find_one({"follower_id": user.id, "following_id": target_id})
    
    if existing:
        # Unfollow
        await db.followers.delete_one({"_id": existing["_id"]})
        return {"status": "unfollowed"}
    else:
        # Follow
        await db.followers.insert_one({
            "_id": generate_uuid(),
            "follower_id": user.id,
            "following_id": target_id,
            "created_at": datetime.utcnow()
        })
        return {"status": "followed"}

@router.get("/feed/following", response_model=List[PostResponse])
async def get_following_feed(user: User = Depends(get_current_user), limit: int = 50):
    db = get_mongo_db()
    
    # Get list of user IDs this user follows
    following_cursor = db.followers.find({"follower_id": user.id})
    following_docs = await following_cursor.to_list(length=1000)
    following_ids = [doc["following_id"] for doc in following_docs]
    
    if not following_ids:
        return []
        
    cursor = db.posts.find({"user_id": {"$in": following_ids}}).sort("created_at", -1).limit(limit)
    posts = await cursor.to_list(length=limit)
    return posts
