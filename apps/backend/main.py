"""
Bitigchi Backend — FastAPI Application Entry Point

Assembles all routers, middleware, CORS, and startup events
including database table creation and admin seeding.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.database import engine, SessionLocal, Base
from db.models import User, UserRole, Subscription, SubscriptionPlan, SubscriptionStatus
from auth.jwt_handler import hash_password

from routers import (
    auth, screener, sentiment, billing, feedback, 
    admin, news, lookup, ai_chat, social
)

# ─── Logging ────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("bitigchi")


# ─── Lifespan (Startup / Shutdown) ─────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables, seed admin. Shutdown: cleanup."""
    logger.info("🚀 Bitigchi backend starting...")

    # Create all tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created / verified")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        logger.warning("⚠️  Running in degraded mode (no database)")

    # Seed default admin user
    try:
        _seed_admin()
    except Exception as e:
        logger.warning(f"⚠️  Admin seeding skipped: {e}")

    # Log service status
    logger.info(f"📡 Reddit API: {'✅ Configured' if settings.reddit_configured else '❌ Not configured (fallback mode)'}")
    logger.info(f"💳 Stripe:     {'✅ Configured' if settings.stripe_configured else '❌ Not configured'}")
    logger.info(f"📧 SendGrid:   {'✅ Configured' if settings.sendgrid_configured else '❌ Not configured (mock mode)'}")
    logger.info(f"🌐 Frontend:   {settings.FRONTEND_URL}")
    logger.info("✅ Bitigchi backend ready!")

    yield

    logger.info("👋 Bitigchi backend shutting down...")


def _seed_admin():
    """Create default admin user if not exists."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@bitigchi.com").first()
        if existing:
            logger.info("Admin user already exists")
            return

        admin_user = User(
            email="admin@bitigchi.com",
            hashed_password=hash_password(settings.ADMIN_DEFAULT_PASSWORD[:72]),
            full_name="Bitigchi Admin",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)
        db.flush()

        admin_sub = Subscription(
            user_id=admin_user.id,
            plan=SubscriptionPlan.PREMIUM,
            status=SubscriptionStatus.ACTIVE,
        )
        db.add(admin_sub)
        db.commit()
        logger.info("✅ Default admin user seeded (admin@bitigchi.com)")
    finally:
        db.close()


# ─── App Factory ────────────────────────────────────────

app = FastAPI(
    title="Bitigchi API",
    description="AI-powered Stock Screener & Sentiment Analyzer",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ──────────────────────────────────

app.include_router(auth.router)
app.include_router(screener.router)
app.include_router(sentiment.router)
app.include_router(billing.router)
app.include_router(feedback.router)
app.include_router(admin.router)
app.include_router(news.router)
app.include_router(lookup.router)
app.include_router(ai_chat.router)
app.include_router(social.router)


# ─── Health Check ───────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "name": "Bitigchi API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
