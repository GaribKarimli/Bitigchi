from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from db.database import get_db
from db import models
from auth.dependencies import get_current_user
from services.ai_chat_service import get_bitigchi_ai_response
from routers.lookup import get_analyst_data, lookup_stock

router = APIRouter(prefix="/api/ai", tags=["AI Chat"])

class ChatRequest(BaseModel):
    symbol: str
    message: str
    thread_id: Optional[int] = None

class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: str

class ChatThreadResponse(BaseModel):
    id: int
    symbol: str
    messages: List[ChatMessageResponse]

@router.post("/chat", response_model=ChatMessageResponse)
def chat_with_bitigchi(
    req: ChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Core AI Chat endpoint. 
    1. Fetches current stock context.
    2. Retrieves thread history.
    3. Calls Gemini AI.
    4. Persists exchange to DB.
    """
    symbol = req.symbol.upper()
    
    # 1. Get Ticker Context (Live data)
    try:
        stock_data = lookup_stock(symbol)
        analyst_data = get_analyst_data(symbol)
        
        context = {
            "current_price": stock_data.get("current_price"),
            "change_pct": stock_data.get("change_pct"),
            "rsi": stock_data.get("rsi"),
            "analyst_consensus": analyst_data.get("consensus") if analyst_data else "No data"
        }
    except Exception:
        context = None

    # 2. Handle Thread
    if req.thread_id:
        thread = db.query(models.AIChatThread).filter(
            models.AIChatThread.id == req.thread_id,
            models.AIChatThread.user_id == current_user.id
        ).first()
        if not thread:
            raise HTTPException(status_code=404, detail="Chat thread not found")
    else:
        # Create new thread for this ticker
        thread = models.AIChatThread(user_id=current_user.id, symbol=symbol, title=f"Discussion on {symbol}")
        db.add(thread)
        db.commit()
        db.refresh(thread)

    # 3. Get History for AI
    db_history = db.query(models.AIChatMessage).filter(
        models.AIChatMessage.thread_id == thread.id
    ).order_by(models.AIChatMessage.created_at.asc()).all()
    
    history = [{"role": m.role, "content": m.content} for m in db_history]

    # 4. Call AI
    ai_response_text = get_bitigchi_ai_response(symbol, req.message, history, context)

    # 5. Persist Messages
    user_msg = models.AIChatMessage(thread_id=thread.id, role="user", content=req.message)
    ai_msg = models.AIChatMessage(thread_id=thread.id, role="ai", content=ai_response_text)
    
    db.add(user_msg)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return {
        "role": "ai",
        "content": ai_msg.content,
        "created_at": ai_msg.created_at.isoformat()
    }

@router.get("/threads/{symbol}", response_model=List[ChatThreadResponse])
def get_user_threads(
    symbol: str, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch existing chat history for a specific stock."""
    threads = db.query(models.AIChatThread).filter(
        models.AIChatThread.user_id == current_user.id,
        models.AIChatThread.symbol == symbol.upper()
    ).all()
    return threads
