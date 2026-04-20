"""
Email Service — sends transactional emails via SendGrid.
Handles password resets, welcome emails, and sentiment alerts.
Falls back gracefully if SendGrid is not configured (logs only).
"""

import logging
from config import settings

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email via SendGrid. Returns True if sent successfully."""
    if not settings.sendgrid_configured:
        logger.info(
            f"[EMAIL-MOCK] SendGrid not configured. Would send to {to_email}: {subject}"
        )
        return False

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=settings.SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content,
        )
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(
            f"Email sent to {to_email}: {subject} (status: {response.status_code})"
        )
        return response.status_code in (200, 201, 202)
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_welcome_email(to_email: str, full_name: str = "") -> bool:
    """Send a welcome email after registration."""
    name = full_name or "there"
    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #12121a; color: #e8e6e3; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #c9a84c; font-size: 28px; margin: 0;">𐰋𐰃𐱅𐰃𐰏𐰲𐰃</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">BITIGCHI</p>
        </div>
        <h2 style="color: #e8e6e3; font-size: 20px;">Welcome, {name}!</h2>
        <p style="color: #a0a0b0; line-height: 1.7;">
            You've joined <strong style="color: #c9a84c;">Bitigchi</strong> — your AI-powered market intelligence platform.
            Start exploring stock patterns and sentiment analysis right away.
        </p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="{settings.FRONTEND_URL}" style="background: linear-gradient(135deg, #c9a84c, #b08d57); color: #0a0a0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Open Dashboard
            </a>
        </div>
        <p style="color: #4a4a5a; font-size: 12px; margin-top: 40px; text-align: center;">
            &copy; 2024 Bitigchi. All rights reserved.
        </p>
    </div>
    """
    return _send_email(to_email, "Welcome to Bitigchi 📜", html)


def send_verification_email(to_email: str, token: str) -> bool:
    """Send an email verification link."""
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #12121a; color: #e8e6e3; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #c9a84c; font-size: 28px; margin: 0;">𐰋𐰃𐱅𐰃𐰏𐰲𐰃</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">BITIGCHI</p>
        </div>
        <h2 style="color: #e8e6e3; font-size: 20px;">Verify Your Email Address</h2>
        <p style="color: #a0a0b0; line-height: 1.7;">
            Please tap the button below to verify your email and activate your account.
        </p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="{verify_url}" style="background: linear-gradient(135deg, #c9a84c, #b08d57); color: #0a0a0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Verify Email
            </a>
        </div>
        <p style="color: #4a4a5a; font-size: 12px; margin-top: 40px; text-align: center;">
            &copy; 2024 Bitigchi. All rights reserved.
        </p>
    </div>
    """
    return _send_email(to_email, "Verify Your Bitigchi Action", html)


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """Send a password reset link."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #12121a; color: #e8e6e3; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #c9a84c; font-size: 28px; margin: 0;">𐰋𐰃𐱅𐰃𐰏𐰲𐰃</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">BITIGCHI</p>
        </div>
        <h2 style="color: #e8e6e3; font-size: 20px;">Reset Your Password</h2>
        <p style="color: #a0a0b0; line-height: 1.7;">
            We received a request to reset your password. Click the button below to create a new password.
            This link expires in 15 minutes.
        </p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="{reset_url}" style="background: linear-gradient(135deg, #c9a84c, #b08d57); color: #0a0a0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Reset Password
            </a>
        </div>
        <p style="color: #4a4a5a; font-size: 12px; margin-top: 40px; text-align: center;">
            If you didn't request this, you can safely ignore this email.
        </p>
    </div>
    """
    return _send_email(to_email, "Reset Your Bitigchi Password", html)


def send_sentiment_alert(to_email: str, ticker: str, sentiment: str, score: float) -> bool:
    """Send a sentiment shift alert email (Premium feature)."""
    emoji = "🟢" if sentiment == "bullish" else ("🔴" if sentiment == "bearish" else "🟡")
    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #12121a; color: #e8e6e3; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #c9a84c; font-size: 28px; margin: 0;">𐰋𐰃𐱅𐰃𐰏𐰲𐰃</h1>
        </div>
        <h2 style="color: #e8e6e3; font-size: 20px;">{emoji} Sentiment Alert: {ticker}</h2>
        <p style="color: #a0a0b0; line-height: 1.7;">
            The AI sentiment for <strong style="color: #00d4ff;">{ticker}</strong> has shifted to
            <strong style="color: {'#10b981' if sentiment == 'bullish' else '#ef4444' if sentiment == 'bearish' else '#c9a84c'};">{sentiment.upper()}</strong>
            with a confidence score of <strong>{score:.1f}%</strong>.
        </p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="{settings.FRONTEND_URL}" style="background: linear-gradient(135deg, #c9a84c, #b08d57); color: #0a0a0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Details
            </a>
        </div>
    </div>
    """
    return _send_email(to_email, f"Bitigchi Alert: {ticker} is {sentiment.upper()}", html)
