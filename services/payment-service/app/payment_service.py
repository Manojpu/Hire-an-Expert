"""
Payment Service business logic layer.
Handles payment workflows, escrow management, and database operations.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import Optional, List, Dict, Any, Tuple
from decimal import Decimal
from datetime import datetime
import uuid
import logging

from models import (
    Payment, Expert, PaymentTransaction, WebhookEvent, 
    PaymentStatus
)
from schemas import (
    InitiatePaymentRequest, CapturePaymentRequest, RefundPaymentRequest,
    CreateExpertAccountRequest, PaymentResponse, ExpertResponse
)
from stripe_service import stripe_service
import stripe

logger = logging.getLogger(__name__)

class PaymentService:
    """Service class for payment business logic"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_commission(self, amount: Decimal, commission_rate: Decimal = Decimal('0.10')) -> Tuple[Decimal, Decimal]:
        """
        Calculate platform commission and expert amount.
        
        Args:
            amount: Total payment amount
            commission_rate: Commission rate (default 10%)
            
        Returns:
            Tuple of (commission_amount, expert_amount)
        """
        commission = amount * commission_rate
        expert_amount = amount - commission
        return commission, expert_amount
    
    async def initiate_payment(self, request: InitiatePaymentRequest) -> Dict[str, Any]:
        """
        Initiate a payment with escrow functionality.
        Creates PaymentIntent with manual capture and stores in database.
        """
        try:
            # Get expert and validate
            expert = self.db.query(Expert).filter(Expert.id == request.expert_id).first()
            if not expert:
                raise ValueError(f"Expert with ID {request.expert_id} not found")
            
            if not expert.stripe_account_id:
                raise ValueError(f"Expert {request.expert_id} doesn't have a Stripe Connect account")
            
            if not expert.stripe_charges_enabled:
                raise ValueError(f"Expert {request.expert_id} is not enabled to receive payments")
            
            # Calculate commission
            commission, expert_amount = self.calculate_commission(request.amount, expert.commission_rate)
            
            # Create database record
            payment = Payment(
                client_id=request.client_id,
                expert_id=request.expert_id,
                gig_id=request.gig_id,
                amount=request.amount,
                commission=commission,
                expert_amount=expert_amount,
                currency=request.currency,
                status=PaymentStatus.PENDING,
                description=request.description,
                idempotency_key=request.idempotency_key or str(uuid.uuid4())
            )
            
            # Check for duplicate idempotency key
            if request.idempotency_key:
                existing = self.db.query(Payment).filter(
                    Payment.idempotency_key == request.idempotency_key
                ).first()
                if existing:
                    return {
                        'payment': existing,
                        'client_secret': existing.client_secret,
                        'publishable_key': stripe_service.publishable_key,
                        'application_fee_amount': int(existing.commission * 100)
                    }
            
            self.db.add(payment)
            self.db.flush()  # Get the ID without committing
            
            # Create Stripe PaymentIntent with escrow
            payment_intent = await stripe_service.create_payment_intent_with_escrow(
                amount=request.amount,
                currency=request.currency,
                expert_stripe_account_id=expert.stripe_account_id,
                commission=commission,
                description=request.description,
                metadata={
                    'payment_id': str(payment.id),
                    'client_id': request.client_id,
                    'expert_id': str(request.expert_id),
                    'gig_id': request.gig_id or ''
                }
            )
            
            # Update payment with Stripe data
            payment.stripe_payment_intent_id = payment_intent.id
            payment.client_secret = payment_intent.client_secret
            
            # Log transaction
            transaction = PaymentTransaction(
                payment_id=payment.id,
                transaction_type='initiate',
                amount=request.amount,
                status='created',
                stripe_transaction_id=payment_intent.id,
                notes=f"Payment initiated for gig {request.gig_id}"
            )
            self.db.add(transaction)
            
            self.db.commit()
            
            logger.info(f"Payment {payment.payment_uuid} initiated successfully")
            
            return {
                'payment': payment,
                'client_secret': payment_intent.client_secret,
                'publishable_key': stripe_service.publishable_key,
                'application_fee_amount': int(commission * 100)
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error initiating payment: {str(e)}")
            raise
    
    async def capture_payment(self, request: CapturePaymentRequest) -> PaymentResponse:
        """
        Capture an escrowed payment (release funds to expert).
        """
        try:
            # Get payment
            payment = self.db.query(Payment).filter(
                Payment.payment_uuid == request.payment_uuid
            ).first()
            
            if not payment:
                raise ValueError(f"Payment {request.payment_uuid} not found")
            
            if payment.status != PaymentStatus.AUTHORIZED:
                raise ValueError(f"Payment {request.payment_uuid} is not in authorized status")
            
            # Determine capture amount
            capture_amount = request.amount or payment.amount
            if capture_amount > payment.amount:
                raise ValueError("Capture amount cannot exceed original payment amount")
            
            # Capture via Stripe
            payment_intent = await stripe_service.capture_payment_intent(
                payment.stripe_payment_intent_id,
                capture_amount
            )
            
            # Update payment status
            payment.status = PaymentStatus.CAPTURED
            payment.captured_at = datetime.utcnow()
            
            # If partial capture, update amounts
            if capture_amount < payment.amount:
                old_commission = payment.commission
                payment.amount = capture_amount
                payment.commission = payment.amount * (old_commission / (payment.amount + old_commission))
                payment.expert_amount = payment.amount - payment.commission
            
            # Log transaction
            transaction = PaymentTransaction(
                payment_id=payment.id,
                transaction_type='capture',
                amount=capture_amount,
                status='completed',
                stripe_transaction_id=payment_intent.id,
                notes=request.notes or f"Payment captured for {capture_amount}"
            )
            self.db.add(transaction)
            
            self.db.commit()
            
            logger.info(f"Payment {payment.payment_uuid} captured successfully")
            return payment
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error capturing payment: {str(e)}")
            raise
    
    async def refund_payment(self, request: RefundPaymentRequest) -> PaymentResponse:
        """
        Refund a payment (full or partial).
        """
        try:
            # Get payment
            payment = self.db.query(Payment).filter(
                Payment.payment_uuid == request.payment_uuid
            ).first()
            
            if not payment:
                raise ValueError(f"Payment {request.payment_uuid} not found")
            
            if payment.status not in [PaymentStatus.AUTHORIZED, PaymentStatus.CAPTURED]:
                raise ValueError(f"Payment {request.payment_uuid} cannot be refunded")
            
            # Determine refund amount
            refund_amount = request.amount or payment.amount
            
            # Create Stripe refund
            refund = await stripe_service.refund_payment(
                payment.stripe_payment_intent_id,
                refund_amount,
                request.reason or "requested_by_customer"
            )
            
            # Update payment status
            if refund_amount >= payment.amount:
                payment.status = PaymentStatus.REFUNDED
            else:
                payment.status = PaymentStatus.PARTIALLY_REFUNDED
            
            payment.refunded_at = datetime.utcnow()
            payment.refund_reason = request.reason
            payment.stripe_refund_id = refund.id
            
            # Log transaction
            transaction = PaymentTransaction(
                payment_id=payment.id,
                transaction_type='refund',
                amount=refund_amount,
                status='completed',
                stripe_transaction_id=refund.id,
                notes=f"Refund: {request.reason}"
            )
            self.db.add(transaction)
            
            self.db.commit()
            
            logger.info(f"Payment {payment.payment_uuid} refunded successfully")
            return payment
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error refunding payment: {str(e)}")
            raise
    
    def get_payment_history(
        self, 
        user_id: str, 
        user_type: str = 'client',
        page: int = 1, 
        per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Get payment history for a user (client or expert).
        """
        try:
            query = self.db.query(Payment)
            
            if user_type == 'client':
                query = query.filter(Payment.client_id == user_id)
            elif user_type == 'expert':
                # Get expert ID from user_id
                expert = self.db.query(Expert).filter(Expert.user_id == user_id).first()
                if not expert:
                    return {'payments': [], 'total_count': 0, 'page': page, 'per_page': per_page, 'total_pages': 0}
                query = query.filter(Payment.expert_id == expert.id)
            else:
                raise ValueError("user_type must be 'client' or 'expert'")
            
            # Count total
            total_count = query.count()
            total_pages = (total_count + per_page - 1) // per_page
            
            # Get paginated results
            payments = query.order_by(desc(Payment.created_at)).offset(
                (page - 1) * per_page
            ).limit(per_page).all()
            
            return {
                'payments': payments,
                'total_count': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': total_pages
            }
            
        except Exception as e:
            logger.error(f"Error getting payment history: {str(e)}")
            raise
    
    async def create_expert_account(self, request: CreateExpertAccountRequest) -> Dict[str, Any]:
        """
        Create or update expert with Stripe Connect account.
        """
        try:
            # Check if expert already exists
            expert = self.db.query(Expert).filter(Expert.user_id == request.user_id).first()
            
            if expert and expert.stripe_account_id:
                # Get account status
                account_status = await stripe_service.get_account_status(expert.stripe_account_id)
                expert.stripe_charges_enabled = account_status['charges_enabled']
                expert.stripe_payouts_enabled = account_status['payouts_enabled']
                expert.stripe_onboarding_complete = account_status['details_submitted']
                
                self.db.commit()
                
                # Create dashboard link if onboarding complete
                dashboard_link = None
                if expert.stripe_onboarding_complete:
                    dashboard_link = await stripe_service.create_login_link(expert.stripe_account_id)
                
                return {
                    'expert': expert,
                    'account_link': None,
                    'dashboard_link': dashboard_link
                }
            
            # Create new expert or update existing
            if not expert:
                expert = Expert(
                    user_id=request.user_id,
                    name=request.name,
                    email=request.email
                )
                self.db.add(expert)
                self.db.flush()
            
            # Create Stripe Connect account
            return_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/expert/payment-setup/success"
            refresh_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/expert/payment-setup/refresh"
            
            stripe_result = await stripe_service.create_express_account(
                request, return_url, refresh_url
            )
            
            # Update expert with Stripe account ID
            expert.stripe_account_id = stripe_result['account'].id
            expert.stripe_onboarding_complete = False
            expert.stripe_charges_enabled = False
            expert.stripe_payouts_enabled = False
            
            self.db.commit()
            
            logger.info(f"Expert account created for user {request.user_id}")
            
            return {
                'expert': expert,
                'account_link': stripe_result['onboarding_link'],
                'dashboard_link': None
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating expert account: {str(e)}")
            raise