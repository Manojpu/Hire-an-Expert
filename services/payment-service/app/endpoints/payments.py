import stripe
import httpx
import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Request, Header, Response, BackgroundTasks
from pydantic import BaseModel
import os
import re
from enum import Enum
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from dotenv import load_dotenv
from app.db import crud, models, schemas
from app.db.session import get_db
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

def ensure_url_has_scheme(url):
    """
    Ensure that a URL has a scheme (http:// or https://).
    If no scheme is present, https:// is added as default.
    """
    if not re.match(r'^https?://', url):
        return f"https://{url}"
    return url

# Initialize Stripe with the secret key from environment variables
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
stripe_publishable_key = os.getenv("STRIPE_PUBLIC_KEY")
webhook_secret = os.getenv("WEBHOOK_SECRET") or os.getenv("STRIPE_WEBHOOK_SECRET")
currency = os.getenv("CURRENCY", "LKR")
platform_fee_percent = float(os.getenv("PLATFORM_FEE_PERCENT", "5"))
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
booking_service_url = os.getenv("BOOKING_SERVICE_URL", "http://localhost:8006")

router = APIRouter()

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELED = "canceled"

class CheckoutRequest(BaseModel):
    booking_id: str
    booking_price: float
    gig_title: str

class PaymentIntentRequest(BaseModel):
    booking_id: str
    amount: float
    gig_title: str
    customer_email: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None

class RefundRequest(BaseModel):
    payment_intent_id: str
    reason: Optional[str] = None

async def update_booking_status(booking_id: str, status: str):
    """
    Update the booking status in the booking service.
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{booking_service_url}/booking/{booking_id}/status"
            response = await client.put(url, json={"status": status})
            if response.status_code != 200:
                logger.error(f"Failed to update booking status: {response.text}")
                return False
            return True
    except Exception as e:
        logger.error(f"Error updating booking status: {str(e)}")
        return False

@router.post("/create-checkout-session")
def create_checkout_session(request: CheckoutRequest, db: Session = Depends(get_db)):
    """
    Create a Stripe checkout session for a booking.
    This uses Stripe's hosted checkout page.
    """
    try:

        base_amount = request.booking_price
        platform_fee = base_amount * (platform_fee_percent / 100)
        total_amount = base_amount + platform_fee
        
        success_url = f"{frontend_url}/booking/{request.booking_id}/success"
        cancel_url = f"{frontend_url}/booking/{request.booking_id}/cancel"
        
        metadata = {
            'booking_id': request.booking_id,
            'gig_title': request.gig_title,
        }
        
        session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price_data': {
                        'currency': currency,
                        'product_data': {
                            'name': request.gig_title,
                        },
                        'unit_amount': int(total_amount * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }
            ],
            mode='payment',
            metadata=metadata,
            success_url=ensure_url_has_scheme(success_url),
            cancel_url=ensure_url_has_scheme(cancel_url),
        )
        
        # Record the payment intent in our database
        if hasattr(session, 'payment_intent'):
            crud.create_payment_record(
                db=db,
                booking_id=request.booking_id,
                payment_intent_id=session.payment_intent,
                amount=total_amount,
                currency=currency,
                status=models.PaymentStatus.PENDING,
                metadata=metadata
            )
        
        return {"sessionId": session.id, "url": session.url}
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-payment-intent")
async def create_payment_intent(request: PaymentIntentRequest, db: Session = Depends(get_db)):
    """
    Create a Stripe payment intent for direct integration with the frontend.
    This is used when you want to handle the payment flow in your own UI.
    """
    try:
        # Calculate the total amount including platform fee
        base_amount = request.amount
        platform_fee = base_amount * (platform_fee_percent / 100)
        total_amount = base_amount + platform_fee
        
        metadata = request.metadata or {}
        metadata["booking_id"] = request.booking_id
        metadata["gig_title"] = request.gig_title
        
        payment_intent = stripe.PaymentIntent.create(
            amount=int(total_amount * 100),  # Convert to cents
            currency=currency,
            metadata=metadata,
            automatic_payment_methods={"enabled": True},
        )
        
        # Record the payment intent in our database
        crud.create_payment_record(
            db=db,
            booking_id=request.booking_id,
            payment_intent_id=payment_intent.id,
            amount=total_amount,
            currency=currency,
            status=models.PaymentStatus.PENDING,
            metadata=metadata
        )
        
        return {
            "clientSecret": payment_intent.client_secret,
            "paymentIntentId": payment_intent.id,
            "amount": total_amount,
        }
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refund")
async def refund_payment(request: RefundRequest, db: Session = Depends(get_db)):
    """
    Refund a payment that was previously processed.
    """
    try:
        # First check if the payment exists in our database
        payment = crud.get_payment_by_intent_id(db, request.payment_intent_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        refund = stripe.Refund.create(
            payment_intent=request.payment_intent_id,
            reason=request.reason
        )
        
        # Update payment status in our database
        crud.update_payment_status(db, request.payment_intent_id, models.PaymentStatus.REFUNDED)
        
        # Update booking status
        background_tasks = BackgroundTasks()
        background_tasks.add_task(update_booking_status, payment.booking_id, "cancelled")
        
        return {"refund_id": refund.id, "status": refund.status}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error processing refund: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing refund: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks, 
                         db: Session = Depends(get_db), 
                         stripe_signature: str = Header(None)):
    """
    Handle Stripe webhook events.
    """
    try:
        payload = await request.body()
        sig_header = stripe_signature

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid signature")

        logger.info(f"Received webhook event: {event['type']}")

        # Handle the event
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent.id
            booking_id = payment_intent.metadata.get('booking_id')
            
            logger.info(f"Payment succeeded for payment_intent: {payment_intent_id}, booking: {booking_id}")
            
            # Update our database record
            if payment_intent_id:
                crud.update_payment_status(db, payment_intent_id, models.PaymentStatus.SUCCEEDED)
            
            if booking_id:
                # Update the booking status asynchronously
                success = await update_booking_status(booking_id, "confirmed")
                if success:
                    logger.info(f"Successfully updated booking {booking_id} to confirmed")
                else:
                    logger.error(f"Failed to update booking {booking_id}")
            
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent.id
            booking_id = payment_intent.metadata.get('booking_id')
            
            logger.info(f"Payment failed for payment_intent: {payment_intent_id}, booking: {booking_id}")
            
            # Update our database record
            if payment_intent_id:
                crud.update_payment_status(db, payment_intent_id, models.PaymentStatus.FAILED)
            
            if booking_id:
                await update_booking_status(booking_id, "cancelled")
        
        elif event['type'] == 'payment_intent.processing':
            payment_intent = event['data']['object']
            logger.info(f"Payment processing: {payment_intent.id}")
        
        # Return a 200 response to acknowledge receipt
        return {"status": "success", "event_type": event['type']}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payment-status/{payment_intent_id}")
async def get_payment_status(payment_intent_id: str, db: Session = Depends(get_db)):
    """
    Get the status of a payment intent.
    """
    try:
        # First check our local database
        payment = crud.get_payment_by_intent_id(db, payment_intent_id)
        
        # If not found or needs refreshing, fetch from Stripe
        if not payment:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "status": payment_intent.status,
                "amount": payment_intent.amount / 100,  # Convert from cents
                "currency": payment_intent.currency,
                "metadata": payment_intent.metadata,
            }
        else:
            # Get the latest status from Stripe to ensure it's up to date
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            # Update our database if the status has changed
            if payment_intent.status != payment.status:
                crud.update_payment_status(
                    db, 
                    payment_intent_id, 
                    getattr(models.PaymentStatus, payment_intent.status.upper(), models.PaymentStatus.PENDING)
                )
            
            return {
                "status": payment_intent.status,
                "amount": payment.amount,
                "currency": payment.currency,
                "metadata": json.loads(payment.payment_metadata) if payment.payment_metadata else {},
                "created_at": payment.created_at,
                "updated_at": payment.updated_at,
            }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error retrieving payment status: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bookings/{booking_id}/payments")
async def get_booking_payments(booking_id: str, db: Session = Depends(get_db)):
    """
    Get all payments for a booking.
    """
    try:
        payments = crud.get_payments_by_booking_id(db, booking_id)
        return [
            {
                "id": payment.id,
                "payment_intent_id": payment.payment_intent_id,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "created_at": payment.created_at,
                "updated_at": payment.updated_at,
            }
            for payment in payments
        ]
    except Exception as e:
        logger.error(f"Error retrieving booking payments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config")
async def get_config():
    """
    Get payment service configuration including Stripe publishable key.
    This endpoint is intended for frontend integration.
    """
    try:
        return {
            "publishableKey": stripe_publishable_key,
            "currency": currency,
            "platformFeePercent": platform_fee_percent
        }
    except Exception as e:
        logger.error(f"Error retrieving payment config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))