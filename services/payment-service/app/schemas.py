"""
Pydantic schemas for Payment Service API requests and responses.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime
from enum import Enum

class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    DISPUTED = "disputed"

# Request schemas
class InitiatePaymentRequest(BaseModel):
    """Request to initiate a payment with escrow"""
    client_id: str = Field(..., description="Client user ID")
    expert_id: int = Field(..., description="Expert ID")
    gig_id: str = Field(..., description="Gig ID from gig service")
    amount: Decimal = Field(..., gt=0, description="Total amount in dollars")
    currency: str = Field(default="USD", description="Payment currency")
    description: Optional[str] = Field(None, description="Payment description")
    idempotency_key: Optional[str] = Field(None, description="Idempotency key for safe retries")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

class CapturePaymentRequest(BaseModel):
    """Request to capture escrowed payment"""
    payment_uuid: str = Field(..., description="Payment UUID")
    amount: Optional[Decimal] = Field(None, description="Amount to capture (defaults to full amount)")
    notes: Optional[str] = Field(None, description="Notes for the capture")

class RefundPaymentRequest(BaseModel):
    """Request to refund a payment"""
    payment_uuid: str = Field(..., description="Payment UUID")
    amount: Optional[Decimal] = Field(None, description="Amount to refund (defaults to full amount)")
    reason: Optional[str] = Field(None, description="Reason for refund")

class CreateExpertAccountRequest(BaseModel):
    """Request to create Stripe Connect account for expert"""
    user_id: str = Field(..., description="Expert user ID")
    name: str = Field(..., description="Expert name")
    email: str = Field(..., description="Expert email")
    country: str = Field(default="US", description="Expert country")
    business_type: str = Field(default="individual", description="Business type")

# Response schemas
class PaymentResponse(BaseModel):
    """Payment response schema"""
    id: int
    payment_uuid: str
    client_id: str
    expert_id: int
    gig_id: Optional[str]
    amount: Decimal
    commission: Decimal
    expert_amount: Decimal
    currency: str
    status: PaymentStatusEnum
    stripe_payment_intent_id: Optional[str]
    client_secret: Optional[str]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InitiatePaymentResponse(BaseModel):
    """Response for payment initiation"""
    payment: PaymentResponse
    client_secret: str = Field(..., description="Client secret for frontend payment confirmation")
    publishable_key: str = Field(..., description="Stripe publishable key")
    application_fee_amount: int = Field(..., description="Platform commission in cents")

class ExpertResponse(BaseModel):
    """Expert response schema"""
    id: int
    user_id: str
    name: str
    email: str
    stripe_account_id: Optional[str]
    stripe_onboarding_complete: bool
    stripe_charges_enabled: bool
    stripe_payouts_enabled: bool
    commission_rate: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaymentHistoryResponse(BaseModel):
    """Payment history response"""
    payments: List[PaymentResponse]
    total_count: int
    page: int
    per_page: int
    total_pages: int

class StripeAccountResponse(BaseModel):
    """Stripe Connect account response"""
    expert: ExpertResponse
    account_link: Optional[str] = Field(None, description="Onboarding link for expert")
    dashboard_link: Optional[str] = Field(None, description="Express dashboard link")

class WebhookResponse(BaseModel):
    """Webhook processing response"""
    success: bool
    message: str
    payment_id: Optional[int] = None

# Transaction schemas
class TransactionResponse(BaseModel):
    """Transaction log response"""
    id: int
    payment_id: int
    transaction_type: str
    amount: Decimal
    status: str
    stripe_transaction_id: Optional[str]
    created_at: datetime
    notes: Optional[str]
    
    class Config:
        from_attributes = True

# Error response schemas
class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

class PaymentError(BaseModel):
    """Payment-specific error response"""
    error_code: str
    message: str
    payment_uuid: Optional[str] = None
    stripe_error: Optional[Dict[str, Any]] = None