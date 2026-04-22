from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# -----------------
# Posts & Feed
# -----------------
class PostCreate(BaseModel):
    content: str
    ticker: Optional[str] = None
    media_url: Optional[str] = None  # URL from MinIO
    media_type: Optional[str] = None # 'image' or 'video'
    sentiment: Optional[str] = None  # 'bullish' or 'bearish'

class PostResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    ticker: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    sentiment: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime
    
    class Config:
        populate_by_name = True

# -----------------
# Messages / DMs
# -----------------
class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    media_url: Optional[str] = None

class MessageResponse(BaseModel):
    id: str = Field(alias="_id")
    sender_id: int
    receiver_id: int
    content: str
    media_url: Optional[str] = None
    is_read: bool = False
    created_at: datetime
    
    class Config:
        populate_by_name = True

# -----------------
# Followers
# -----------------
class FollowAction(BaseModel):
    user_id_to_follow: int

class FollowStatus(BaseModel):
    is_following: bool
    followers_count: int
    following_count: int

# -----------------
# Comments
# -----------------
class CommentResponse(BaseModel):
    id: str = Field(alias="_id")
    post_id: str
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    created_at: datetime
    
    class Config:
        populate_by_name = True

# -----------------
# User Search & Profile
# -----------------
class UserSearchResponse(BaseModel):
    id: int
    full_name: str
    avatar_url: Optional[str] = None
    is_premium: bool = False

class ProfileViewResponse(BaseModel):
    id: str = Field(alias="_id")
    viewer_id: int
    viewer_name: str
    viewer_avatar: Optional[str] = None
    viewed_at: datetime

    class Config:
        populate_by_name = True
