"""
Unit tests for the Payment service models.
"""
import pytest
import uuid
from datetime import datetime
from app.db.models import Payment, PaymentStatus

def test_payment_model_creation():
    """Test that a Payment model can be created with required fields."""
    # Arrange
    booking_id = uuid.uuid4()
    payment_intent_id = "pi_" + str(uuid.uuid4())
    amount = 100.50
    
    # Act
    payment = Payment(
        booking_id=booking_id,
        payment_intent_id=payment_intent_id,
        amount=amount,
        currency="USD",
        status=PaymentStatus.PENDING
    )
    
    # Assert
    assert payment.booking_id == booking_id
    assert payment.payment_intent_id == payment_intent_id
    assert payment.amount == amount
    assert payment.currency == "USD"
    assert payment.status == PaymentStatus.PENDING

def test_payment_default_values():
    """Test that default values are set correctly."""
    # Arrange
    booking_id = uuid.uuid4()
    payment_intent_id = "pi_" + str(uuid.uuid4())
    amount = 100.50
    
    # Act
    payment = Payment(
        booking_id=booking_id,
        payment_intent_id=payment_intent_id,
        amount=amount
    )
    
    # Assert
    assert payment.currency == "LKR"  # Default currency
    assert payment.status == PaymentStatus.PENDING.value  # Default status

def test_payment_representation():
    """Test the string representation of a Payment."""
    # Arrange
    payment_id = uuid.uuid4()
    booking_id = uuid.uuid4()
    payment_intent_id = "pi_" + str(uuid.uuid4())
    amount = 100.50
    
    # Act
    payment = Payment(
        id=payment_id,
        booking_id=booking_id,
        payment_intent_id=payment_intent_id,
        amount=amount,
        status=PaymentStatus.SUCCEEDED
    )
    
    # Assert
    expected_repr = f"<Payment(id={payment_id}, booking_id={booking_id}, status={PaymentStatus.SUCCEEDED}, amount={amount})>"
    assert repr(payment) == expected_repr

def test_payment_status_enum():
    """Test that PaymentStatus enum contains all expected statuses."""
    # Assert
    assert PaymentStatus.PENDING == "pending"
    assert PaymentStatus.SUCCEEDED == "succeeded"
    assert PaymentStatus.FAILED == "failed"
    assert PaymentStatus.REFUNDED == "refunded"
    assert PaymentStatus.CANCELED == "canceled"
    
    # Check all possible values
    expected_values = {"pending", "succeeded", "failed", "refunded", "canceled"}
    actual_values = {status.value for status in PaymentStatus}
    assert actual_values == expected_values