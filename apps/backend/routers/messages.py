from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List, Optional
from datetime import datetime

from db.mongo import get_mongo_db
from schemas.social_mongo import MessageCreate, MessageResponse, generate_uuid
from auth.dependencies import get_current_user
from db.models import User
from services.minio_service import compress_and_upload_image

router = APIRouter(prefix="/api/v2/messages", tags=["Messages (MongoDB)"])

@router.post("/", response_model=MessageResponse)
async def send_message(
    receiver_id: int = Form(...),
    content: str = Form(...),
    file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user)
):
    if receiver_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")
        
    db = get_mongo_db()
    media_url = None
    
    if file and file.content_type.startswith("image/"):
        media_url = await compress_and_upload_image(file, folder="messages")
        
    msg_doc = {
        "_id": generate_uuid(),
        "sender_id": user.id,
        "receiver_id": receiver_id,
        "content": content,
        "media_url": media_url,
        "is_read": False,
        "created_at": datetime.utcnow()
    }
    
    await db.messages.insert_one(msg_doc)
    return msg_doc

@router.get("/{other_user_id}", response_model=List[MessageResponse])
async def get_conversation(
    other_user_id: int, 
    user: User = Depends(get_current_user),
    limit: int = 50
):
    db = get_mongo_db()
    
    # Find messages where user is sender and other is receiver, OR vice versa
    query = {
        "$or": [
            {"sender_id": user.id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user.id}
        ]
    }
    
    cursor = db.messages.find(query).sort("created_at", -1).limit(limit)
    messages = await cursor.to_list(length=limit)
    
    # Optional: mark fetched messages as read
    unread_ids = [m["_id"] for m in messages if m["receiver_id"] == user.id and not m["is_read"]]
    if unread_ids:
        await db.messages.update_many(
            {"_id": {"$in": unread_ids}},
            {"$set": {"is_read": True}}
        )
        
    return messages
