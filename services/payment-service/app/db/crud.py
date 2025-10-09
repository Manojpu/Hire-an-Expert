from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid
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
    # Convert booking_id string to UUID object
    booking_id_uuid = uuid.UUID(booking_id) if isinstance(booking_id, str) else booking_id
    
    payment = models.Payment(
        booking_id=booking_id_uuid,
        payment_intent_id=payment_intent_id,  # Keep as string since it's a Stripe ID
        amount=amount,
        currency=currency,
        status=status,
        payment_metadata=json.dumps(metadata) if metadata else None
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
    # Convert booking_id string to UUID object
    booking_id_uuid = uuid.UUID(booking_id) if isinstance(booking_id, str) else booking_id
    # Convert booking_id string to UUID object
    booking_id_uuid = uuid.UUID(booking_id) if isinstance(booking_id, str) else booking_id
    return db.query(models.Payment).filter(models.Payment.booking_id == booking_id_uuid_uuid).all()

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