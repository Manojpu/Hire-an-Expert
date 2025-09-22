"""
Webhook handlers for Stripe events.
Processes payment status updates and maintains data consistency.
"""
from sqlalchemy.orm import Session
from typing import Dict, Any
import json
import logging
from datetime import datetime

from models import Payment, PaymentTransaction, WebhookEvent, PaymentStatus
from database import SessionLocal
import stripe

logger = logging.getLogger(__name__)

class WebhookHandler:
    """Handler for Stripe webhook events"""
    
    def __init__(self):
        self.event_handlers = {
            'payment_intent.succeeded': self.handle_payment_intent_succeeded,
            'payment_intent.payment_failed': self.handle_payment_intent_failed,
            'payment_intent.canceled': self.handle_payment_intent_canceled,
            'charge.succeeded': self.handle_charge_succeeded,
            'charge.failed': self.handle_charge_failed,
            'account.updated': self.handle_account_updated,
            'account.application.deauthorized': self.handle_account_deauthorized,
        }
    
    async def process_webhook(self, event: stripe.Event) -> Dict[str, Any]:
        """
        Process a Stripe webhook event.
        
        Args:
            event: Verified Stripe event
            
        Returns:
            Processing result
        """
        db = SessionLocal()
        try:
            # Check if event already processed
            existing_event = db.query(WebhookEvent).filter(
                WebhookEvent.stripe_event_id == event.id
            ).first()
            
            if existing_event and existing_event.processed:
                logger.info(f"Event {event.id} already processed")
                return {'success': True, 'message': 'Event already processed'}
            
            # Create or update webhook event record
            if not existing_event:
                webhook_event = WebhookEvent(
                    stripe_event_id=event.id,
                    event_type=event.type,
                    event_data=json.dumps(event.data.to_dict()),
                    processed=False
                )
                db.add(webhook_event)
            else:
                webhook_event = existing_event
            
            db.flush()
            
            # Process the event
            handler = self.event_handlers.get(event.type)
            if handler:
                result = await handler(event, db)
                
                # Update webhook event
                webhook_event.processed = True
                webhook_event.processed_at = datetime.utcnow()
                webhook_event.processing_result = json.dumps(result)
                
                if result.get('payment_id'):
                    webhook_event.payment_id = result['payment_id']
                
                db.commit()
                
                logger.info(f"Successfully processed webhook event {event.id}")
                return {'success': True, 'message': 'Event processed successfully', **result}
            else:
                # Unhandled event type
                webhook_event.processed = True
                webhook_event.processed_at = datetime.utcnow()
                webhook_event.processing_result = json.dumps({'message': 'Unhandled event type'})
                
                db.commit()
                
                logger.info(f"Unhandled webhook event type: {event.type}")
                return {'success': True, 'message': f'Unhandled event type: {event.type}'}
                
        except Exception as e:
            db.rollback()
            
            # Update webhook event with error
            if 'webhook_event' in locals():
                webhook_event.error_message = str(e)
                webhook_event.processed_at = datetime.utcnow()
                db.commit()
            
            logger.error(f"Error processing webhook event {event.id}: {str(e)}")
            return {'success': False, 'message': f'Error processing event: {str(e)}'}
        finally:
            db.close()
    
    async def handle_payment_intent_succeeded(self, event: stripe.Event, db: Session) -> Dict[str, Any]:
        """
        Handle successful payment authorization.
        Updates payment status to AUTHORIZED (funds held in escrow).
        """
        payment_intent = event.data.object
        
        # Find payment by Stripe PaymentIntent ID
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == payment_intent.id
        ).first()
        
        if not payment:
            logger.warning(f"Payment not found for PaymentIntent {payment_intent.id}")
            return {'message': 'Payment not found'}
        
        # Update payment status to authorized (funds in escrow)
        payment.status = PaymentStatus.AUTHORIZED
        payment.authorized_at = datetime.utcnow()
        
        # Get charge ID if available
        if payment_intent.charges and payment_intent.charges.data:
            payment.stripe_charge_id = payment_intent.charges.data[0].id
        
        # Log transaction
        transaction = PaymentTransaction(
            payment_id=payment.id,
            transaction_type='authorize',
            amount=payment.amount,
            status='completed',
            stripe_transaction_id=payment_intent.id,
            notes='Payment authorized via webhook'
        )
        db.add(transaction)
        
        logger.info(f"Payment {payment.payment_uuid} authorized successfully")
        return {'payment_id': payment.id, 'status': 'authorized'}
    
    async def handle_payment_intent_payment_failed(self, event: stripe.Event, db: Session) -> Dict[str, Any]:
        """Handle failed payment authorization."""
        payment_intent = event.data.object
        
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == payment_intent.id
        ).first()
        
        if not payment:
            return {'message': 'Payment not found'}
        
        # Update payment status
        payment.status = PaymentStatus.FAILED
        payment.failure_reason = payment_intent.last_payment_error.message if payment_intent.last_payment_error else 'Unknown error'
        
        # Log transaction
        transaction = PaymentTransaction(
            payment_id=payment.id,
            transaction_type='authorize',
            amount=payment.amount,
            status='failed',
            stripe_transaction_id=payment_intent.id,
            notes=f'Payment failed: {payment.failure_reason}'
        )
        db.add(transaction)
        
        logger.info(f"Payment {payment.payment_uuid} failed")
        return {'payment_id': payment.id, 'status': 'failed'}
    
    async def handle_payment_intent_canceled(self, event: stripe.Event, db: Session) -> Dict[str, Any]:
        """Handle canceled payment."""
        payment_intent = event.data.object
        
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == payment_intent.id
        ).first()
        
        if not payment:
            return {'message': 'Payment not found'}
        
        # Update payment status
        payment.status = PaymentStatus.FAILED
        payment.failure_reason = 'Payment canceled'
        
        # Log transaction
        transaction = PaymentTransaction(
            payment_id=payment.id,
            transaction_type='cancel',
            amount=payment.amount,
            status='canceled',
            stripe_transaction_id=payment_intent.id,
            notes='Payment canceled'
        )
        db.add(transaction)
        
        logger.info(f"Payment {payment.payment_uuid} canceled")
        return {'payment_id': payment.id, 'status': 'canceled'}
    
    async def handle_charge_succeeded(self, event: stripe.Event, db: Session) -> Dict[str, Any]:
        """
        Handle successful charge (funds captured).
        Updates payment status to CAPTURED.
        """
        charge = event.data.object
        
        # Find payment by charge ID or PaymentIntent ID
        payment = db.query(Payment).filter(
            (Payment.stripe_charge_id == charge.id) |
            (Payment.stripe_payment_intent_id == charge.payment_intent)
        ).first()
        
        if not payment:
            return {'message': 'Payment not found'}
        
        # Only update if not already captured
        if payment.status != PaymentStatus.CAPTURED:
            payment.status = PaymentStatus.CAPTURED
            payment.captured_at = datetime.utcnow()
            payment.stripe_charge_id = charge.id
            
            # Log transaction
            transaction = PaymentTransaction(
                payment_id=payment.id,
                transaction_type='capture',
                amount=payment.amount,
                status='completed',
                stripe_transaction_id=charge.id,
                notes='Payment captured via webhook'
            )
            db.add(transaction)
            
            logger.info(f"Payment {payment.payment_uuid} captured via webhook")
        
        return {'payment_id': payment.id, 'status': 'captured'}
    
    async def handle_charge_failed(self, event: stripe.Event, db: Session) -> Dict[str, Any]:
        """Handle failed charge."""
        charge = event.data.object
        
        payment = db.query(Payment).filter(
            (Payment.stripe_charge_id == charge.id) |
            (Payment.stripe_payment_intent_id == charge.payment_intent)
        ).first()
        
        if not payment:
            return {'message': 'Payment not found'}
        
        payment.status = PaymentStatus.FAILED
        payment.failure_reason = charge.failure_message or 'Charge failed'
        
        # Log transaction
        transaction = PaymentTransaction(
            payment_id=payment.id,
            transaction_type='capture',
            amount=payment.amount,
            status='failed',
            stripe_transaction_id=charge.id,
            notes=f'Charge failed: {payment.failure_reason}'
        )
        db.add(transaction)
        
        logger.info(f"Charge failed for payment {payment.payment_uuid}")
        return {'payment_id': payment.id, 'status': 'failed'}
    
    async def handle_account_updated(self, event: stripe.Event, db: Session) -> Dict[str, Any]:
        """Handle Stripe Connect account updates."""
        from models import Expert
        
        account = event.data.object
        
        # Find expert by Stripe account ID
        expert = db.query(Expert).filter(
            Expert.stripe_account_id == account.id
        ).first()
        
        if not expert:
            return {'message': 'Expert not found'}
        
        # Update expert account status
        expert.stripe_charges_enabled = account.charges_enabled
        expert.stripe_payouts_enabled = account.payouts_enabled
        expert.stripe_onboarding_complete = account.details_submitted
        
        logger.info(f"Updated expert {expert.user_id} account status")
        return {'expert_id': expert.id, 'status': 'updated'}
    
    async def handle_account_deauthorized(self, event: stripe.Event, db: Session) -> Dict[str, Any]:
        """Handle Connect account deauthorization."""
        from models import Expert
        
        account = event.data.object
        
        expert = db.query(Expert).filter(
            Expert.stripe_account_id == account.id
        ).first()
        
        if not expert:
            return {'message': 'Expert not found'}
        
        # Disable expert account
        expert.stripe_charges_enabled = False
        expert.stripe_payouts_enabled = False
        expert.stripe_onboarding_complete = False
        
        logger.info(f"Expert {expert.user_id} account deauthorized")
        return {'expert_id': expert.id, 'status': 'deauthorized'}

# Global instance
webhook_handler = WebhookHandler()