"""
Mock Stripe service for development when Stripe package can't be installed.
This simulates Stripe functionality for testing the payment service.
"""
import uuid
from typing import Optional, Dict, Any
from decimal import Decimal
import time

class MockStripeError(Exception):
    """Mock Stripe error"""
    pass

class MockPaymentIntent:
    """Mock Stripe PaymentIntent"""
    def __init__(self, amount, currency, **kwargs):
        self.id = f"pi_mock_{uuid.uuid4().hex[:16]}"
        self.amount = amount
        self.currency = currency
        self.status = "requires_payment_method"
        self.client_secret = f"{self.id}_secret_{uuid.uuid4().hex[:16]}"
        self.capture_method = kwargs.get('capture_method', 'automatic')
        self.charges = MockCharges()
        self.metadata = kwargs.get('metadata', {})
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'client_secret': self.client_secret,
            'capture_method': self.capture_method,
            'charges': self.charges.to_dict(),
            'metadata': self.metadata
        }

class MockCharge:
    """Mock Stripe Charge"""
    def __init__(self, payment_intent_id):
        self.id = f"ch_mock_{uuid.uuid4().hex[:16]}"
        self.payment_intent = payment_intent_id
        self.status = "succeeded"

class MockCharges:
    """Mock Stripe Charges collection"""
    def __init__(self):
        self.data = []
    
    def to_dict(self):
        return {'data': [{'id': charge.id} for charge in self.data]}

class MockAccount:
    """Mock Stripe Account"""
    def __init__(self, **kwargs):
        self.id = f"acct_mock_{uuid.uuid4().hex[:16]}"
        self.charges_enabled = False
        self.payouts_enabled = False
        self.details_submitted = False
        self.country = kwargs.get('country', 'US')
        self.email = kwargs.get('email', '')
        self.type = kwargs.get('type', 'express')

class MockAccountLink:
    """Mock Stripe AccountLink"""
    def __init__(self, account, **kwargs):
        self.account = account
        self.url = f"https://connect.stripe.com/express/mock/{uuid.uuid4().hex}"
        self.expires_at = int(time.time()) + 3600  # 1 hour

class MockRefund:
    """Mock Stripe Refund"""
    def __init__(self, payment_intent, **kwargs):
        self.id = f"re_mock_{uuid.uuid4().hex[:16]}"
        self.payment_intent = payment_intent
        self.amount = kwargs.get('amount')
        self.reason = kwargs.get('reason', 'requested_by_customer')
        self.status = "succeeded"

class MockEvent:
    """Mock Stripe Event"""
    def __init__(self, event_type, data_object):
        self.id = f"evt_mock_{uuid.uuid4().hex[:16]}"
        self.type = event_type
        self.data = MockEventData(data_object)

class MockEventData:
    """Mock Stripe Event Data"""
    def __init__(self, obj):
        self.object = obj
    
    def to_dict(self):
        return {'object': self.object.to_dict() if hasattr(self.object, 'to_dict') else self.object}

class MockStripeService:
    """Mock Stripe service that simulates the real Stripe API"""
    
    def __init__(self):
        self.publishable_key = "pk_test_mock_key"
        self.webhook_secret = "whsec_mock_secret"
        self._payment_intents = {}
        self._accounts = {}
    
    async def create_payment_intent_with_escrow(
        self,
        amount: Decimal,
        currency: str,
        expert_stripe_account_id: str,
        commission: Decimal,
        description: str = None,
        metadata: Dict[str, Any] = None
    ):
        """Mock PaymentIntent creation"""
        payment_intent = MockPaymentIntent(
            amount=int(amount * 100),
            currency=currency.lower(),
            capture_method='manual',
            description=description,
            metadata=metadata or {}
        )
        
        # Simulate successful authorization
        payment_intent.status = "requires_confirmation"
        
        self._payment_intents[payment_intent.id] = payment_intent
        
        print(f"🔧 MOCK: Created PaymentIntent {payment_intent.id}")
        return payment_intent
    
    async def capture_payment_intent(
        self,
        payment_intent_id: str,
        amount_to_capture: Optional[Decimal] = None
    ):
        """Mock PaymentIntent capture"""
        payment_intent = self._payment_intents.get(payment_intent_id)
        if not payment_intent:
            raise MockStripeError(f"PaymentIntent {payment_intent_id} not found")
        
        payment_intent.status = "succeeded"
        charge = MockCharge(payment_intent_id)
        payment_intent.charges.data.append(charge)
        
        print(f"🔧 MOCK: Captured PaymentIntent {payment_intent_id}")
        return payment_intent
    
    async def refund_payment(
        self,
        payment_intent_id: str,
        amount: Optional[Decimal] = None,
        reason: str = "requested_by_customer"
    ):
        """Mock refund creation"""
        refund = MockRefund(
            payment_intent=payment_intent_id,
            amount=int(amount * 100) if amount else None,
            reason=reason
        )
        
        print(f"🔧 MOCK: Created refund {refund.id}")
        return refund
    
    async def create_express_account(
        self,
        expert_data,
        return_url: str,
        refresh_url: str
    ):
        """Mock Express account creation"""
        account = MockAccount(
            country=expert_data.country,
            email=expert_data.email,
            type='express'
        )
        
        account_link = MockAccountLink(
            account=account.id,
            return_url=return_url,
            refresh_url=refresh_url
        )
        
        self._accounts[account.id] = account
        
        print(f"🔧 MOCK: Created Express account {account.id}")
        return {
            'account': account,
            'onboarding_link': account_link.url
        }
    
    async def get_account_status(self, stripe_account_id: str):
        """Mock account status"""
        account = self._accounts.get(stripe_account_id)
        if not account:
            raise MockStripeError(f"Account {stripe_account_id} not found")
        
        return {
            'charges_enabled': account.charges_enabled,
            'payouts_enabled': account.payouts_enabled,
            'details_submitted': account.details_submitted,
            'requirements': {}
        }
    
    async def create_login_link(self, stripe_account_id: str):
        """Mock login link creation"""
        return f"https://dashboard.stripe.com/test/connect/accounts/{stripe_account_id}"
    
    def construct_webhook_event(self, payload: bytes, sig_header: str):
        """Mock webhook event construction"""
        # For testing, just create a mock event
        return MockEvent("payment_intent.succeeded", MockPaymentIntent(10000, "usd"))

# Create mock instance
mock_stripe_service = MockStripeService()

print("⚠️ USING MOCK STRIPE SERVICE - For development only!")
print("🔧 Install the real Stripe package for production use")