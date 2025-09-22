"""
Stripe integration service for Payment Service.
Handles PaymentIntents, escrow, Connect accounts, and commissions.
"""
import os
from typing import Optional, Dict, Any
from decimal import Decimal
import logging
from sqlalchemy.orm import Session
from models import Expert, Payment, PaymentTransaction, PaymentStatus
from schemas import CreateExpertAccountRequest

# Try to import Stripe, fallback to mock if not available
try:
    import stripe
    # Configure Stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_AVAILABLE = True
    print("✅ Using real Stripe service")
except ImportError:
    STRIPE_AVAILABLE = False
    print("⚠️ Stripe not available, using mock service")

STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_mock_key")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_mock_secret")

logger = logging.getLogger(__name__)

class StripeService:
    """Service class for Stripe operations"""
    
    def __init__(self):
        if STRIPE_AVAILABLE:
            self.api_key = stripe.api_key
            self.publishable_key = STRIPE_PUBLISHABLE_KEY
            self.webhook_secret = STRIPE_WEBHOOK_SECRET
            self._using_mock = False
        else:
            # Use mock service
            from mock_stripe_service import mock_stripe_service
            self.mock_service = mock_stripe_service
            self.publishable_key = "pk_test_mock_key"
            self.webhook_secret = "whsec_mock_secret"
            self._using_mock = True
    
    async def create_payment_intent_with_escrow(
        self,
        amount: Decimal,
        currency: str,
        expert_stripe_account_id: str,
        commission: Decimal,
        description: str = None,
        metadata: Dict[str, Any] = None
    ):
        """
        Create a PaymentIntent with manual capture for escrow functionality.
        Uses application_fee_amount for platform commission.
        """
        if self._using_mock:
            return await self.mock_service.create_payment_intent_with_escrow(
                amount, currency, expert_stripe_account_id, commission, description, metadata
            )
        
        try:
            # Convert to cents (Stripe uses smallest currency unit)
            amount_cents = int(amount * 100)
            commission_cents = int(commission * 100)
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                capture_method='manual',  # Enable escrow - authorize but don't capture
                payment_method_types=['card'],
                description=description,
                metadata=metadata or {},
                
                # Stripe Connect - transfer to expert with commission
                transfer_data={
                    'destination': expert_stripe_account_id,
                },
                application_fee_amount=commission_cents,  # Platform commission
                
                # Additional settings
                confirmation_method='automatic',
                setup_future_usage='off_session'  # Save payment method for future use
            )
            
            logger.info(f"Created PaymentIntent {payment_intent.id} with escrow")
            return payment_intent
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating PaymentIntent: {str(e)}")
            raise
    
    async def capture_payment_intent(
        self,
        payment_intent_id: str,
        amount_to_capture: Optional[Decimal] = None
    ) -> stripe.PaymentIntent:
        """
        Capture a PaymentIntent (release funds from escrow).
        If amount_to_capture is provided, does a partial capture.
        """
        try:
            capture_params = {}
            if amount_to_capture:
                capture_params['amount_to_capture'] = int(amount_to_capture * 100)
            
            payment_intent = stripe.PaymentIntent.capture(
                payment_intent_id,
                **capture_params
            )
            
            logger.info(f"Captured PaymentIntent {payment_intent_id}")
            return payment_intent
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error capturing PaymentIntent: {str(e)}")
            raise
    
    async def refund_payment(
        self,
        payment_intent_id: str,
        amount: Optional[Decimal] = None,
        reason: str = "requested_by_customer"
    ) -> stripe.Refund:
        """
        Refund a payment (full or partial).
        Works with both captured and uncaptured payments.
        """
        try:
            refund_params = {
                'payment_intent': payment_intent_id,
                'reason': reason
            }
            
            if amount:
                refund_params['amount'] = int(amount * 100)
            
            refund = stripe.Refund.create(**refund_params)
            
            logger.info(f"Created refund {refund.id} for PaymentIntent {payment_intent_id}")
            return refund
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {str(e)}")
            raise
    
    async def create_express_account(
        self,
        expert_data: CreateExpertAccountRequest,
        return_url: str,
        refresh_url: str
    ) -> Dict[str, Any]:
        """
        Create a Stripe Express Connect account for an expert.
        Returns account info and onboarding link.
        """
        try:
            # Create Express account
            account = stripe.Account.create(
                type='express',
                country=expert_data.country,
                email=expert_data.email,
                business_type=expert_data.business_type,
                capabilities={
                    'card_payments': {'requested': True},
                    'transfers': {'requested': True},
                }
            )
            
            # Create account link for onboarding
            account_link = stripe.AccountLink.create(
                account=account.id,
                return_url=return_url,
                refresh_url=refresh_url,
                type='account_onboarding',
            )
            
            logger.info(f"Created Express account {account.id} for expert {expert_data.user_id}")
            
            return {
                'account': account,
                'onboarding_link': account_link.url
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating Express account: {str(e)}")
            raise
    
    async def get_account_status(self, stripe_account_id: str) -> Dict[str, Any]:
        """Get the status of a Stripe Connect account"""
        try:
            account = stripe.Account.retrieve(stripe_account_id)
            
            return {
                'charges_enabled': account.charges_enabled,
                'payouts_enabled': account.payouts_enabled,
                'details_submitted': account.details_submitted,
                'requirements': account.requirements
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving account status: {str(e)}")
            raise
    
    async def create_login_link(self, stripe_account_id: str) -> str:
        """Create Express dashboard login link for expert"""
        try:
            login_link = stripe.Account.create_login_link(stripe_account_id)
            return login_link.url
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating login link: {str(e)}")
            raise
    
    def construct_webhook_event(self, payload: bytes, sig_header: str) -> stripe.Event:
        """
        Construct and verify webhook event from Stripe.
        Ensures the webhook is authentic.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return event
            
        except ValueError as e:
            logger.error(f"Invalid payload in webhook: {str(e)}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature in webhook: {str(e)}")
            raise

# Global instance
stripe_service = StripeService()