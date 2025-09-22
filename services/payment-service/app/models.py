"""
SQLAlchemy models for the Payment Service.
Handles payments, experts, and transaction tracking.
"""
from sqlalchemy import Column, Integer, String, Decimal, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
import uuid

Base = declarative_base()

class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"           # Payment initiated, awaiting client payment
    AUTHORIZED = "authorized"     # Funds authorized/held in escrow
    CAPTURED = "captured"         # Funds captured and released to expert
    FAILED = "failed"            # Payment failed
    REFUNDED = "refunded"        # Payment refunded to client
    PARTIALLY_REFUNDED = "partially_refunded"
    DISPUTED = "disputed"        # Payment disputed/chargeback

class Expert(Base):
    """Expert model with Stripe Connect account information"""
    __tablename__ = "experts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)  # Reference to User service
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    
    # Stripe Connect fields
    stripe_account_id = Column(String, unique=True, index=True)  # Stripe Express/Custom account ID
    stripe_onboarding_complete = Column(Boolean, default=False)
    stripe_charges_enabled = Column(Boolean, default=False)
    stripe_payouts_enabled = Column(Boolean, default=False)
    
    # Payout preferences
    payout_details = Column(Text)  # JSON string with bank/PayPal details
    commission_rate = Column(Decimal(5, 4), default=0.10)  # Platform commission (10%)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    payments_as_expert = relationship("Payment", foreign_keys="Payment.expert_id", back_populates="expert")

class Payment(Base):
    """Payment model with escrow and commission tracking"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_uuid = Column(String, unique=True, default=lambda: str(uuid.uuid4()), index=True)
    
    # Transaction parties
    client_id = Column(String, nullable=False, index=True)  # Reference to User service
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False, index=True)
    gig_id = Column(String, index=True)  # Reference to Gig service
    
    # Financial details
    amount = Column(Decimal(10, 2), nullable=False)  # Total amount in cents
    commission = Column(Decimal(10, 2), nullable=False)  # Platform commission
    expert_amount = Column(Decimal(10, 2), nullable=False)  # Amount expert receives
    currency = Column(String(3), default="USD")
    
    # Payment status and tracking
    status = Column(String, default=PaymentStatus.PENDING, index=True)
    
    # Stripe integration
    stripe_payment_intent_id = Column(String, unique=True, index=True)
    stripe_charge_id = Column(String, unique=True, index=True)
    stripe_refund_id = Column(String, index=True)
    
    # Payment methods and metadata
    payment_method_id = Column(String)  # Stripe payment method ID
    client_secret = Column(String)  # For frontend payment confirmation
    
    # Escrow and timing
    authorized_at = Column(DateTime(timezone=True))
    captured_at = Column(DateTime(timezone=True))
    refunded_at = Column(DateTime(timezone=True))
    
    # Additional info
    description = Column(Text)
    failure_reason = Column(Text)
    refund_reason = Column(Text)
    
    # Idempotency
    idempotency_key = Column(String, unique=True, index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    expert = relationship("Expert", foreign_keys=[expert_id], back_populates="payments_as_expert")

class PaymentTransaction(Base):
    """Detailed transaction log for audit trail"""
    __tablename__ = "payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False, index=True)
    
    # Transaction details
    transaction_type = Column(String, nullable=False)  # authorize, capture, refund, etc.
    amount = Column(Decimal(10, 2), nullable=False)
    status = Column(String, nullable=False)
    
    # Stripe details
    stripe_transaction_id = Column(String, index=True)
    stripe_response = Column(Text)  # JSON response from Stripe
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    
    # Relationships
    payment = relationship("Payment", foreign_keys=[payment_id])

class WebhookEvent(Base):
    """Stripe webhook events log"""
    __tablename__ = "webhook_events"
    
    id = Column(Integer, primary_key=True, index=True)
    stripe_event_id = Column(String, unique=True, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    processed = Column(Boolean, default=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), index=True)
    
    # Event data
    event_data = Column(Text)  # JSON data from Stripe
    processing_result = Column(Text)
    error_message = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))