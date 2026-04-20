"""
Stripe Billing Service — handles checkout sessions, webhooks,
customer portal, and subscription status sync.
"""

import logging
from typing import Optional
from datetime import datetime, timezone

import stripe
from sqlalchemy.orm import Session

from config import settings
from db.models import User, Subscription, SubscriptionPlan, SubscriptionStatus

logger = logging.getLogger(__name__)

if settings.stripe_configured:
    stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(user: User, db: Session) -> dict:
    """Create a Stripe Checkout session for premium upgrade."""
    if not settings.stripe_configured:
        raise ValueError("Stripe is not configured")

    # Ensure customer exists
    sub = user.subscription
    if not sub or not sub.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name or user.email,
            metadata={"user_id": str(user.id)},
        )
        if not sub:
            sub = Subscription(
                user_id=user.id,
                plan=SubscriptionPlan.FREE,
                status=SubscriptionStatus.ACTIVE,
                stripe_customer_id=customer.id,
            )
            db.add(sub)
        else:
            sub.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=sub.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[
            {
                "price": settings.STRIPE_PREMIUM_PRICE_ID,
                "quantity": 1,
            }
        ],
        mode="subscription",
        success_url=f"{settings.FRONTEND_URL}/settings?upgrade=success",
        cancel_url=f"{settings.FRONTEND_URL}/pricing?upgrade=cancelled",
        metadata={"user_id": str(user.id)},
    )

    return {"checkout_url": session.url, "session_id": session.id}


def create_customer_portal(user: User, db: Session) -> str:
    """Create a Stripe Customer Portal session URL."""
    if not settings.stripe_configured:
        raise ValueError("Stripe is not configured")

    sub = user.subscription
    if not sub or not sub.stripe_customer_id:
        raise ValueError("No Stripe customer found for this user")

    portal = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/settings",
    )
    return portal.url


def handle_webhook_event(payload: bytes, sig_header: str, db: Session) -> dict:
    """Process incoming Stripe webhook events."""
    if not settings.stripe_configured:
        return {"status": "skipped", "reason": "Stripe not configured"}

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid webhook signature")

    event_type = event["type"]
    data = event["data"]["object"]

    logger.info(f"Stripe webhook: {event_type}")

    if event_type in (
        "customer.subscription.created",
        "customer.subscription.updated",
    ):
        _sync_subscription(data, db)
    elif event_type == "customer.subscription.deleted":
        _cancel_subscription(data, db)
    elif event_type == "invoice.payment_failed":
        _handle_payment_failed(data, db)

    return {"status": "processed", "event_type": event_type}


def _sync_subscription(stripe_sub: dict, db: Session):
    """Sync Stripe subscription data to our database."""
    customer_id = stripe_sub.get("customer")
    sub = (
        db.query(Subscription)
        .filter(Subscription.stripe_customer_id == customer_id)
        .first()
    )
    if not sub:
        logger.warning(f"No subscription found for Stripe customer {customer_id}")
        return

    sub.stripe_subscription_id = stripe_sub.get("id")
    sub.plan = SubscriptionPlan.PREMIUM
    sub.status = _map_stripe_status(stripe_sub.get("status"))
    sub.current_period_start = datetime.fromtimestamp(
        stripe_sub.get("current_period_start", 0), tz=timezone.utc
    )
    sub.current_period_end = datetime.fromtimestamp(
        stripe_sub.get("current_period_end", 0), tz=timezone.utc
    )
    db.commit()
    logger.info(
        f"Subscription synced for customer {customer_id}: {sub.plan} / {sub.status}"
    )


def _cancel_subscription(stripe_sub: dict, db: Session):
    """Handle subscription cancellation."""
    customer_id = stripe_sub.get("customer")
    sub = (
        db.query(Subscription)
        .filter(Subscription.stripe_customer_id == customer_id)
        .first()
    )
    if sub:
        sub.plan = SubscriptionPlan.FREE
        sub.status = SubscriptionStatus.CANCELLED
        sub.stripe_subscription_id = None
        db.commit()
        logger.info(f"Subscription cancelled for customer {customer_id}")


def _handle_payment_failed(invoice: dict, db: Session):
    """Handle failed payment."""
    customer_id = invoice.get("customer")
    sub = (
        db.query(Subscription)
        .filter(Subscription.stripe_customer_id == customer_id)
        .first()
    )
    if sub:
        sub.status = SubscriptionStatus.PAST_DUE
        db.commit()
        logger.warning(f"Payment failed for customer {customer_id}")


def _map_stripe_status(status: str) -> SubscriptionStatus:
    """Map Stripe subscription status to our enum."""
    mapping = {
        "active": SubscriptionStatus.ACTIVE,
        "past_due": SubscriptionStatus.PAST_DUE,
        "canceled": SubscriptionStatus.CANCELLED,
        "trialing": SubscriptionStatus.TRIALING,
        "unpaid": SubscriptionStatus.PAST_DUE,
    }
    return mapping.get(status, SubscriptionStatus.INACTIVE)
