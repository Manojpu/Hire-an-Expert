from sqlalchemy.orm import Session
from datetime import datetime
import json
from . import models
from typing import Dict, Any, Optional

def create_payment_record(
    db: Session,
    booking_id: str,
    payment_intent_id: str,
    amount: float,
    currency: str = "LKR",
    status: models.PaymentStatus = models.PaymentStatus.PENDING,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Create a new payment record in the database.
    """
    payment = models.Payment(
        booking_id=booking_id,
        payment_intent_id=payment_intent_id,
        amount=amount,
        currency=currency,
        status=status,
        metadata=json.dumps(metadata) if metadata else None
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def get_payment_by_intent_id(db: Session, payment_intent_id: str):
    """
    Get a payment record by its payment intent ID.
    """
    return db.query(models.Payment).filter(models.Payment.payment_intent_id == payment_intent_id).first()

def get_payments_by_booking_id(db: Session, booking_id: str):
    """
    Get all payment records for a booking.
    """
    return db.query(models.Payment).filter(models.Payment.booking_id == booking_id).all()

def update_payment_status(db: Session, payment_intent_id: str, status: models.PaymentStatus):
    """
    Update the status of a payment.
    """
    payment = get_payment_by_intent_id(db, payment_intent_id)
    if payment:
        payment.status = status
        payment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(payment)
    return payment