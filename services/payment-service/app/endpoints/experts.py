"""
Expert API endpoints for Stripe Connect account management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from database import get_db
from schemas import (
    CreateExpertAccountRequest, ExpertResponse, StripeAccountResponse
)
from payment_service import PaymentService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/create-account", response_model=StripeAccountResponse)
async def create_expert_account(
    request: CreateExpertAccountRequest,
    db: Session = Depends(get_db)
):
    """
    Create a Stripe Connect Express account for an expert.
    
    This creates a Stripe Express account that allows the expert to receive
    payments without needing to interact with Stripe directly. The expert
    will need to complete onboarding through the provided link.
    """
    try:
        payment_service = PaymentService(db)
        result = await payment_service.create_expert_account(request)
        
        return StripeAccountResponse(
            expert=result['expert'],
            account_link=result['account_link'],
            dashboard_link=result['dashboard_link']
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating expert account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create expert account"
        )

@router.get("/{user_id}", response_model=ExpertResponse)
async def get_expert_details(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get expert details and account status.
    """
    try:
        from models import Expert
        
        expert = db.query(Expert).filter(Expert.user_id == user_id).first()
        
        if not expert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expert with user_id {user_id} not found"
            )
        
        return expert
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting expert details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get expert details"
        )

@router.get("/{user_id}/dashboard-link")
async def get_expert_dashboard_link(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get Stripe Express dashboard link for expert.
    
    This allows the expert to access their Stripe dashboard to view
    payouts, update account information, etc.
    """
    try:
        from models import Expert
        from stripe_service import stripe_service
        
        expert = db.query(Expert).filter(Expert.user_id == user_id).first()
        
        if not expert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expert with user_id {user_id} not found"
            )
        
        if not expert.stripe_account_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expert doesn't have a Stripe account"
            )
        
        if not expert.stripe_onboarding_complete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expert hasn't completed onboarding"
            )
        
        dashboard_link = await stripe_service.create_login_link(expert.stripe_account_id)
        
        return {
            "dashboard_link": dashboard_link,
            "expires_in": 3600  # Stripe dashboard links expire in 1 hour
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard link: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get dashboard link"
        )

@router.post("/{user_id}/refresh-onboarding")
async def refresh_expert_onboarding(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Refresh onboarding link for an expert who hasn't completed setup.
    """
    try:
        from models import Expert
        from stripe_service import stripe_service
        import os
        
        expert = db.query(Expert).filter(Expert.user_id == user_id).first()
        
        if not expert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expert with user_id {user_id} not found"
            )
        
        if not expert.stripe_account_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expert doesn't have a Stripe account"
            )
        
        if expert.stripe_onboarding_complete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expert has already completed onboarding"
            )
        
        # Create new account link
        return_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/expert/payment-setup/success"
        refresh_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/expert/payment-setup/refresh"
        
        import stripe
        account_link = stripe.AccountLink.create(
            account=expert.stripe_account_id,
            return_url=return_url,
            refresh_url=refresh_url,
            type='account_onboarding',
        )
        
        return {
            "onboarding_link": account_link.url,
            "expires_at": account_link.expires_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh onboarding link"
        )