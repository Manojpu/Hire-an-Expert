"""
Payment API endpoints for the Payment Service.
Handles payment initiation, capture, refund, and history.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
import stripe
from pydantic import BaseModel
import os
import re

from dotenv import load_dotenv
from database import get_db
from schemas import (
    InitiatePaymentRequest, InitiatePaymentResponse,
    CapturePaymentRequest, RefundPaymentRequest,
    PaymentResponse, PaymentHistoryResponse, ErrorResponse
)
from payment_service import PaymentService
from models import PaymentStatus

load_dotenv()
# Initialize Stripe with the secret key from environment variables

def ensure_url_has_scheme(url):
    """
    Ensure that a URL has a scheme (http:// or https://).
    If no scheme is present, https:// is added as default.
    """
    if not re.match(r'^https?://', url):
        return f"https://{url}"
    return url

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
router = APIRouter()
logger = logging.getLogger(__name__)

class CheckoutRequest(BaseModel):
    booking_id: str
    booking_price: float
    gig_title: str

@router.post("/create-checkout-session")
def create_checkout_session(request: CheckoutRequest):
    try:
        session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price_data': {
                        'currency': 'LKR',
                        'product_data': {
                            'name': request.gig_title,
                        },
                        'unit_amount': int(request.booking_price * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }
            ],
            mode='payment',
            success_url=ensure_url_has_scheme(f"{os.getenv('BOOKING_SERVICE_URL', 'https://localhost:8000')}/booking/success?booking_id={request.booking_id}"),
            cancel_url=ensure_url_has_scheme(f"{os.getenv('BOOKING_SERVICE_URL', 'https://localhost:8000')}/booking/cancel?booking_id={request.booking_id}"),
        )
        return {"sessionId": session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/initiate", response_model=InitiatePaymentResponse)
async def initiate_payment(
    request: InitiatePaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Initiate a payment with escrow functionality.
    
    Creates a PaymentIntent with manual capture, holding funds in escrow
    until the service is completed and payment is captured.
    
    The platform commission is automatically calculated and will be
    deducted when the payment is captured and transferred to the expert.
    """
    try:
        payment_service = PaymentService(db)
        result = await payment_service.initiate_payment(request)
        
        return InitiatePaymentResponse(
            payment=result['payment'],
            client_secret=result['client_secret'],
            publishable_key=result['publishable_key'],
            application_fee_amount=result['application_fee_amount']
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error initiating payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate payment"
        )

@router.post("/capture", response_model=PaymentResponse)
async def capture_payment(
    request: CapturePaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Capture an escrowed payment and release funds to the expert.
    
    This should be called when the service is completed and confirmed.
    The platform commission will be automatically deducted and the
    remaining amount will be transferred to the expert's account.
    """
    try:
        payment_service = PaymentService(db)
        payment = await payment_service.capture_payment(request)
        
        return payment
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error capturing payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to capture payment"
        )

@router.post("/refund", response_model=PaymentResponse)
async def refund_payment(
    request: RefundPaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Refund a payment (full or partial).
    
    Can be used to refund payments that are either in escrow (authorized)
    or already captured. For captured payments, the refund will be processed
    and funds returned to the client's original payment method.
    """
    try:
        payment_service = PaymentService(db)
        payment = await payment_service.refund_payment(request)
        
        return payment
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error refunding payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refund payment"
        )

@router.get("/history/{user_id}", response_model=PaymentHistoryResponse)
async def get_payment_history(
    user_id: str,
    user_type: str = "client",  # "client" or "expert"
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get payment history for a user.
    
    Args:
        user_id: User ID from the user service
        user_type: Either "client" or "expert"
        page: Page number (starts at 1)
        per_page: Number of results per page (max 100)
    
    Returns:
        Paginated list of payments for the user
    """
    try:
        if per_page > 100:
            per_page = 100
        
        if user_type not in ["client", "expert"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_type must be 'client' or 'expert'"
            )
        
        payment_service = PaymentService(db)
        result = payment_service.get_payment_history(user_id, user_type, page, per_page)
        
        return PaymentHistoryResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting payment history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment history"
        )

@router.get("/{payment_uuid}", response_model=PaymentResponse)
async def get_payment_details(
    payment_uuid: str,
    db: Session = Depends(get_db)
):
    """
    Get details of a specific payment.
    """
    try:
        from app.models import Payment
        
        payment = db.query(Payment).filter(
            Payment.payment_uuid == payment_uuid
        ).first()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_uuid} not found"
            )
        
        return payment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment details"
        )

@router.get("/status/{payment_uuid}")
async def get_payment_status(
    payment_uuid: str,
    db: Session = Depends(get_db)
):
    """
    Get the current status of a payment.
    
    Returns simplified status information for quick checks.
    """
    try:
        from app.models import Payment
        
        payment = db.query(Payment).filter(
            Payment.payment_uuid == payment_uuid
        ).first()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_uuid} not found"
            )
        
        return {
            "payment_uuid": payment.payment_uuid,
            "status": payment.status,
            "amount": payment.amount,
            "currency": payment.currency,
            "created_at": payment.created_at,
            "can_capture": payment.status == PaymentStatus.AUTHORIZED,
            "can_refund": payment.status in [PaymentStatus.AUTHORIZED, PaymentStatus.CAPTURED]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment status"
        )