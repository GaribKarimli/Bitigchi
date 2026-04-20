from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List, Optional
from datetime import datetime

from db.mongo import get_mongo_db
from schemas.social_mongo import PostResponse, generate_uuid, FollowStatus
from auth.dependencies import get_current_user
from db.models import User
from services.minio_service import compress_and_upload_image, upload_video

router = APIRouter(prefix="/api/v2/social", tags=["Social V2 (MongoDB)"])

async def get_user_metadata(db_postgres, user_id: int):
    # Depending on architecture, we might fetch user info from postgres to enrich mongo posts
    # For performance, this could be cached or stored redundantly in Mongo.
    pass

@router.post("/posts", response_model=PostResponse)
async def create_post(
    content: str = Form(...),
    ticker: Optional[str] = Form(None),
    sentiment: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user)
):
    db = get_mongo_db()
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
    
    await db.posts.insert_one(post_doc)
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
