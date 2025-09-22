"""
Webhook endpoints for processing Stripe events.
"""
from fastapi import APIRouter, Request, HTTPException, status
import logging
import stripe

from webhook_handler import webhook_handler
from stripe_service import stripe_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/stripe")
async def handle_stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    
    This endpoint processes Stripe webhook events to keep payment
    statuses synchronized and handle payment state changes.
    
    Webhook events are verified using the Stripe webhook secret
    to ensure they're authentic.
    """
    try:
        # Get the raw payload and signature
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe signature header"
            )
        
        # Verify and construct the event
        try:
            event = stripe_service.construct_webhook_event(payload, sig_header)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload"
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
        
        # Process the event
        result = await webhook_handler.process_webhook(event)
        
        if result['success']:
            logger.info(f"Successfully processed webhook event {event.id}")
            return {"status": "success", "message": result['message']}
        else:
            logger.error(f"Failed to process webhook event {event.id}: {result['message']}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result['message']
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook"
        )

@router.get("/test")
async def test_webhook_endpoint():
    """
    Test endpoint to verify webhook endpoint is accessible.
    
    This can be used by Stripe's webhook testing tools or for
    health checks of the webhook endpoint.
    """
    return {
        "status": "healthy",
        "message": "Webhook endpoint is accessible",
        "service": "payment-service"
    }