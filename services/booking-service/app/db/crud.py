from sqlalchemy.orm import Session
from app.db.schemas import BookingCreate, BookingUpdate
from app.db.models import Booking
import uuid

def create_booking(db: Session, booking: BookingCreate, user_id: str) -> Booking:
    """Create a new booking."""
    db_booking = Booking(
        gig_id=booking.gig_id,
        user_id=user_id,
        scheduled_time=booking.scheduled_time
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def get_booking(db: Session, booking_id: str) -> Booking:
    """Retrieve a booking by its ID."""
    try:
        # Ensure booking_id is a valid UUID
        try:
            uuid_obj = uuid.UUID(booking_id)
        except ValueError:
            # Let the caller handle this - we'll validate at the API level
            raise ValueError(f"Invalid booking ID format: {booking_id}")
            
        return db.query(Booking).filter(Booking.id == uuid_obj).first()
    except Exception as e:
        # Log and re-raise
        import logging
        logging.error(f"Error in get_booking: {str(e)}")
        raise

def update_booking(db: Session, booking_id: str, booking_update: BookingUpdate) -> Booking:
    """Update an existing booking."""
    try:
        # Ensure booking_id is a valid UUID
        try:
            uuid_obj = uuid.UUID(booking_id)
        except ValueError:
            # Let the caller handle this - we'll validate at the API level
            raise ValueError(f"Invalid booking ID format: {booking_id}")
            
        db_booking = db.query(Booking).filter(Booking.id == uuid_obj).first()
        if not db_booking:
            return None

        # Update fields if provided
        if booking_update.status is not None:
            db_booking.status = booking_update.status
        if booking_update.scheduled_time is not None:
            db_booking.scheduled_time = booking_update.scheduled_time

        db.commit()
        db.refresh(db_booking)
        return db_booking
    except Exception as e:
        # Log and re-raise
        import logging
        logging.error(f"Error in update_booking: {str(e)}")
        raise

def delete_booking(db: Session, booking_id: str) -> bool:
    """Delete a booking by its ID."""
    try:
        # Ensure booking_id is a valid UUID
        try:
            uuid_obj = uuid.UUID(booking_id)
        except ValueError:
            # Let the caller handle this - we'll validate at the API level
            raise ValueError(f"Invalid booking ID format: {booking_id}")
            
        db_booking = db.query(Booking).filter(Booking.id == uuid_obj).first()
        if not db_booking:
            return False

        db.delete(db_booking)
        db.commit()
        return True
    except Exception as e:
        # Log and re-raise
        import logging
        logging.error(f"Error in delete_booking: {str(e)}")
        raise

def get_bookings_by_user(db: Session, user_id: str):
    """Retrieve all bookings made by a specific user."""
    try:
        # First try to convert to UUID to ensure proper format
        import uuid
        if not isinstance(user_id, uuid.UUID):
            try:
                # Try to convert to UUID
                user_id = uuid.UUID(user_id)
            except ValueError:
                # If conversion fails, leave as is (in case it's stored as string)
                pass
        
        return db.query(Booking).filter(Booking.user_id == user_id).all()
    except Exception as e:
        raise Exception(f"Error retrieving bookings by user: {str(e)}")

def get_bookings(db: Session, skip: int = 0, limit: int = 100) -> list[Booking]:
    """Fetch a list of bookings, with pagination."""
    return db.query(Booking).offset(skip).limit(limit).all()

def get_bookings_by_gig(db: Session, gig_id: str):
    """Retrieve all bookings for a specific gig."""
    return db.query(Booking).filter(Booking.gig_id == gig_id).all()

def get_booking_by_gig_and_user(db: Session, gig_id: str, user_id: str) -> Booking:
    """Retrieve a booking by gig ID and user ID."""
    return db.query(Booking).filter(
        Booking.gig_id == gig_id,
        Booking.user_id == user_id
    ).first()

def get_booking_by_status(db: Session, status: str):
    """Retrieve all bookings with a specific status."""
    return db.query(Booking).filter(Booking.status == status).all()

