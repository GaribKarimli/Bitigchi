"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ─── Auth ───────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    plan: str = "free"
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


# ─── Subscription / Billing ────────────────────────────

class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None

    class Config:
        from_attributes = True


class CheckoutSessionRequest(BaseModel):
    price_id: Optional[str] = None  # Uses default if not provided


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


# ─── Feedback ──────────────────────────────────────────

class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)


class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Screener ──────────────────────────────────────────

class TickerScreenerItem(BaseModel):
    symbol: str
    name: Optional[str] = None
    sector: Optional[str] = None
    current_price: Optional[float] = None
    change_pct: Optional[float] = None
    volume: Optional[int] = None
    rsi: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    cluster: Optional[int] = None
    cluster_label: Optional[str] = None
    price_history: list[dict] = []


class ScreenerResponse(BaseModel):
    tickers: list[TickerScreenerItem]
    clusters: dict[str, list[str]] = {}
    updated_at: datetime


# ─── Sentiment ─────────────────────────────────────────

class SentimentArticle(BaseModel):
    title: str
    source: str  # "news" or "reddit"
    url: Optional[str] = None
    sentiment: str  # "positive", "negative", "neutral"
    confidence: float


class SentimentResponse(BaseModel):
    ticker: str
    bullish_pct: float
    neutral_pct: float
    bearish_pct: float
    overall_sentiment: str
    article_count: int
    articles: list[SentimentArticle]
    reddit_available: bool = False
    analyzed_at: datetime


# ─── Admin ─────────────────────────────────────────────

class AdminUserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    plan: str = "free"
    subscription_status: Optional[str] = None
    sentiment_checks_today: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    total_users: int
    premium_users: int
    free_users: int
    total_feedback: int
    total_sentiment_checks_today: int
    avg_feedback_rating: Optional[float] = None
