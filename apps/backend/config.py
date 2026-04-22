"""
Bitigchi Backend Configuration
Loads all environment variables with sensible defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    # --- Database ---
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://bitigchi_user:password@localhost:5432/bitigchi_db",
    )

    # --- JWT ---
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-prod")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # --- Google OAuth2 ---
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:3000/api/auth/callback/google"
    )

    # --- Reddit (Optional) ---
    REDDIT_CLIENT_ID: str = os.getenv("REDDIT_CLIENT_ID", "")
    REDDIT_CLIENT_SECRET: str = os.getenv("REDDIT_CLIENT_SECRET", "")
    REDDIT_USER_AGENT: str = os.getenv("REDDIT_USER_AGENT", "")

    @property
    def reddit_configured(self) -> bool:
        return bool(
            self.REDDIT_CLIENT_ID
            and self.REDDIT_CLIENT_SECRET
            and self.REDDIT_USER_AGENT
        )

    # --- Stripe ---
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_PREMIUM_PRICE_ID: str = os.getenv("STRIPE_PREMIUM_PRICE_ID", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    @property
    def stripe_configured(self) -> bool:
        return bool(self.STRIPE_SECRET_KEY and self.STRIPE_PREMIUM_PRICE_ID)

    # --- SendGrid ---
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL: str = os.getenv("SENDGRID_FROM_EMAIL", "noreply@bitigchi.com")

    @property
    def sendgrid_configured(self) -> bool:
        return bool(self.SENDGRID_API_KEY)

    # --- App ---
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    ADMIN_DEFAULT_PASSWORD: str = os.getenv(
        "ADMIN_DEFAULT_PASSWORD", "BitigchiAdmin2024!"
    )

    # --- Market Data APIs ---
    TWELVEDATA_API_KEY: str = os.getenv("TWELVEDATA_API_KEY", "")
    FINNHUB_API_KEY: str = os.getenv("FINNHUB_API_KEY", "")

    # --- Curated Ticker Universe ---
    TICKERS: list[str] = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
        "META", "TSLA", "AMD", "NFLX", "CRM",
        "ORCL", "INTC", "QCOM", "AVGO", "ADBE",
        "PYPL", "SQ", "SHOP", "COIN", "PLTR",
        "BA", "DIS", "NKE", "JPM", "GS",
        "V", "MA", "UNH", "PFE", "XOM",
    ]


settings = Settings()
