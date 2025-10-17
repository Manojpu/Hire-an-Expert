"""
Unit tests for the booking service models.
"""
import pytest
from datetime import datetime
import uuid
from app.db.models import Booking, BookingStatus

def test_booking_model_creation():
    """Test that a Booking model can be created with required fields."""
    # Arrange
    user_id = uuid.uuid4()
    gig_id = uuid.uuid4()
    now = datetime.utcnow()
    
    # Act
    booking = Booking(
        user_id=user_id,
        gig_id=gig_id,
        scheduled_time=now,
        status=BookingStatus.PENDING
    )
    
    # Assert
    assert booking.user_id == user_id
    assert booking.gig_id == gig_id
    assert booking.scheduled_time == now
    assert booking.status == BookingStatus.PENDING

def test_booking_default_status():
    """Test that a Booking gets a default PENDING status if not specified."""
    # Arrange
    user_id = uuid.uuid4()
    gig_id = uuid.uuid4()
    now = datetime.utcnow()
    
    # Act
    booking = Booking(
        user_id=user_id,
        gig_id=gig_id,
        scheduled_time=now
    )
    
    # Assert
    assert booking.status == BookingStatus.PENDING

def test_booking_model_representation():
    """Test the string representation of a Booking."""
    # Arrange
    user_id = uuid.uuid4()
    gig_id = uuid.uuid4()
    booking_id = uuid.uuid4()
    now = datetime.utcnow()
    
    # Act
    booking = Booking(
        id=booking_id,
        user_id=user_id,
        gig_id=gig_id,
        scheduled_time=now,
        status=BookingStatus.CONFIRMED
    )
    
    # Assert
    expected_repr = f"<Booking(id={booking_id}, user_id={user_id}, gig_id={gig_id}, status='confirmed')>"
    assert repr(booking) == expected_repr

def test_booking_status_enum():
    """Test that BookingStatus enum contains all expected statuses."""
    # Assert
    assert BookingStatus.PENDING == "pending"
    assert BookingStatus.CONFIRMED == "confirmed"
    assert BookingStatus.COMPLETED == "completed"
    assert BookingStatus.CANCELLED == "cancelled"
    
    # Check all possible values
    expected_values = {"pending", "confirmed", "completed", "cancelled"}
    actual_values = {status.value for status in BookingStatus}
    assert actual_values == expected_values