"""
Auth Router — Registration, Login, Token Refresh, Password Reset, Google OAuth.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import User, UserRole, Subscription, SubscriptionPlan, SubscriptionStatus
from auth.jwt_handler import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_password_reset_token,
    verify_password_reset_token,
    create_verification_token,
    verify_email_token,
)
from auth.oauth import get_google_auth_url, exchange_google_code
from auth.dependencies import get_current_user
from services.email_service import send_welcome_email, send_password_reset_email, send_verification_email
from schemas import (
    UserRegister, UserLogin, TokenResponse, TokenRefresh,
    ForgotPasswordRequest, ResetPasswordRequest, UserResponse, UserUpdate,
)
from config import settings
from middleware.subscription import get_user_plan

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with email/password."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.USER,
        is_active=True,
        # Auto-verify if email service isn't configured, otherwise they are locked out
        is_verified=False if settings.sendgrid_configured else True,
    )
    db.add(user)
    db.flush()

    # Create free subscription
    subscription = Subscription(
        user_id=user.id,
        plan=SubscriptionPlan.FREE,
        status=SubscriptionStatus.ACTIVE,
    )
    db.add(subscription)
    db.commit()
    db.refresh(user)

    # Create verification token and send email
    token = create_verification_token(user.email)
    send_verification_email(user.email, token)

    logger.info(f"New user registered, verification email sent: {user.email}")
    return {"message": "Registration successful. Please check your email to verify your account."}


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login with email/password."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to log in",
        )

    tokens = _create_tokens(user)
    logger.info(f"User logged in: {user.email}")
    return tokens


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email using token from email link."""
    email = verify_email_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_verified:
        return {"message": "Email is already verified"}

    user.is_verified = True
    db.commit()
    logger.info(f"User email verified: {email}")
    
    # Send welcome email now that they are verified
    send_welcome_email(user.email, user.full_name or "")
    
    return {"message": "Email verified successfully"}


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh an expired access token."""
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return _create_tokens(user)


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset email."""
    user = db.query(User).filter(User.email == data.email).first()
    if user and user.hashed_password:
        token = create_password_reset_token(user.email)
        send_password_reset_email(user.email, token)
        logger.info(f"Password reset requested for: {user.email}")
    # Always return success to prevent email enumeration
    return {"message": "If an account exists, a reset email has been sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a reset token."""
    email = verify_password_reset_token(data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.hashed_password = hash_password(data.new_password)
    db.commit()
    logger.info(f"Password reset completed for: {user.email}")
    return {"message": "Password reset successfully"}


# ─── Google OAuth2 ──────────────────────────────────────


@router.get("/google")
def google_login():
    """Redirect user to Google OAuth2 consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )
    url = get_google_auth_url()
    return {"auth_url": url}


@router.get("/google/callback")
async def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    """Handle Google OAuth2 callback and create/login user."""
    try:
        google_user = await exchange_google_code(code)
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with Google",
        )

    # Find or create user
    user = db.query(User).filter(User.google_id == google_user["google_id"]).first()
    if not user:
        user = db.query(User).filter(User.email == google_user["email"]).first()

    if user:
        # Update Google info
        user.google_id = google_user["google_id"]
        user.avatar_url = google_user.get("avatar_url") or user.avatar_url
        if not user.full_name:
            user.full_name = google_user.get("full_name")
        user.is_verified = True
    else:
        # Create new user
        user = User(
            email=google_user["email"],
            full_name=google_user.get("full_name"),
            avatar_url=google_user.get("avatar_url"),
            google_id=google_user["google_id"],
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()

        # Create free subscription
        subscription = Subscription(
            user_id=user.id,
            plan=SubscriptionPlan.FREE,
            status=SubscriptionStatus.ACTIVE,
        )
        db.add(subscription)
        send_welcome_email(user.email, user.full_name or "")

    db.commit()
    db.refresh(user)

    tokens = _create_tokens(user)
    # Redirect to frontend with tokens
    redirect_url = (
        f"{settings.FRONTEND_URL}/auth/callback"
        f"?access_token={tokens['access_token']}"
        f"&refresh_token={tokens['refresh_token']}"
    )
    return RedirectResponse(url=redirect_url)


# ─── User Profile ──────────────────────────────────────


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user profile."""
    plan = get_user_plan(current_user, db)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        role=current_user.role.value,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        plan=plan,
        created_at=current_user.created_at,
    )


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    db.commit()
    db.refresh(current_user)

    plan = get_user_plan(current_user, db)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        role=current_user.role.value,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        plan=plan,
        created_at=current_user.created_at,
    )

from fastapi import UploadFile, File
from services.minio_service import compress_and_upload_image

@router.post("/me/avatar", response_model=UserResponse)
async def update_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload and update user profile picture."""
    # Upload to MinIO
    avatar_url = await compress_and_upload_image(file, folder="avatars")
    
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)

    plan = get_user_plan(current_user, db)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        role=current_user.role.value,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        plan=plan,
        created_at=current_user.created_at,
    )

# ─── Helpers ────────────────────────────────────────────


def _create_tokens(user: User) -> dict:
    access = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh = create_refresh_token({"sub": str(user.id)})
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
    }
