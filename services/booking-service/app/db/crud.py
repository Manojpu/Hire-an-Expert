from sqlalchemy.orm import Session
from app.db.schemas import BookingCreate, BookingUpdate
from app.db.models import Booking, BookingStatus
import uuid
from datetime import timedelta
import logging
from app.utils.event_publisher import (
    publish_booking_created_event,
    publish_booking_accepted_event,
    publish_booking_cancelled_event
)

# Setup logging
logger = logging.getLogger(__name__)
import logging
from app.utils.event_publisher import publish_booking_created_event, publish_booking_accepted_event, publish_booking_cancelled_event

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def is_slot_available(db: Session, gig_id: uuid.UUID, scheduled_time) -> bool:
    """Check if a time slot is available (not already booked)."""
    # Define the time slot duration (1 hour)
    slot_end_time = scheduled_time + timedelta(hours=1)
    
    # Check for any overlapping bookings
    existing_booking = db.query(Booking).filter(
        Booking.gig_id == gig_id,
        Booking.scheduled_time < slot_end_time,
        scheduled_time < (Booking.scheduled_time + timedelta(hours=1)),
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
    ).first()
    
    return existing_booking is None

def create_booking(db: Session, booking: BookingCreate, user_id: str) -> Booking:
    """Create a new booking."""
    # First check if the slot is available
    if not is_slot_available(db, booking.gig_id, booking.scheduled_time):
        return None
        
    db_booking = Booking(
        gig_id=booking.gig_id,
        user_id=user_id,
        scheduled_time=booking.scheduled_time
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Publish booking.created event
    try:
        # Get expert details from gig service
        from app.utils.gig_service import get_expert_details_for_booking
        expert_details = get_expert_details_for_booking(str(booking.gig_id))
        
        if expert_details:
            expert_id = expert_details.get("expert_id")
            service_name = expert_details.get("service_name", "Expert Service")
        else:
            # Fallback if we can't get expert details
            expert_id = str(booking.gig_id)  # Use gig_id as fallback
            service_name = "Expert Service"  # Use generic name as fallback
            logger.warning(f"Could not fetch expert details for gig {booking.gig_id}")
        
        success = publish_booking_created_event(
            booking_id=str(db_booking.id),
            user_id=str(db_booking.user_id),
            expert_id=expert_id,
            scheduled_time=db_booking.scheduled_time.isoformat(),
            service_name=service_name
        )
        
        if success:
            logger.info(f"Published booking.created event for booking {db_booking.id}")
        else:
            logger.error(f"Failed to publish booking.created event for booking {db_booking.id}")
    except Exception as e:
        logger.error(f"Error publishing booking.created event: {str(e)}")
        # Note: We don't re-raise the exception to avoid disrupting the booking process
        # The booking has been created successfully, even if the event publishing failed
    
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

        # Store the previous status to check if it changed
        previous_status = db_booking.status

        # Update fields if provided
        if booking_update.status is not None:
            db_booking.status = booking_update.status
        if booking_update.scheduled_time is not None:
            db_booking.scheduled_time = booking_update.scheduled_time
        if booking_update.meeting_link is not None:
            db_booking.meeting_link = booking_update.meeting_link

        db.commit()
        db.refresh(db_booking)
        
        # Publish events based on status changes
        try:
            # Get expert details from gig service
            from app.utils.gig_service import get_expert_details_for_booking
            expert_details = get_expert_details_for_booking(str(db_booking.gig_id))
            
            if expert_details:
                expert_id = expert_details.get("expert_id")
                service_name = expert_details.get("service_name", "Expert Service")
            else:
                # Fallback if we can't get expert details
                expert_id = str(db_booking.gig_id)  # Use gig_id as fallback
                service_name = "Expert Service"  # Use generic name as fallback
                logger.warning(f"Could not fetch expert details for gig {db_booking.gig_id}")
            
            # If status changed to CONFIRMED, publish booking.accepted event
            if previous_status != BookingStatus.CONFIRMED and db_booking.status == BookingStatus.CONFIRMED:
                success = publish_booking_accepted_event(
                    booking_id=str(db_booking.id),
                    user_id=str(db_booking.user_id),
                    expert_id=expert_id,
                    scheduled_time=db_booking.scheduled_time.isoformat(),
                    service_name=service_name
                )
                
                if success:
                    logger.info(f"Published booking.accepted event for booking {db_booking.id}")
                else:
                    logger.error(f"Failed to publish booking.accepted event for booking {db_booking.id}")
            
            # If status changed to CANCELLED, publish booking.cancelled event
            elif previous_status != BookingStatus.CANCELLED and db_booking.status == BookingStatus.CANCELLED:
                reason = booking_update.cancellation_reason if hasattr(booking_update, 'cancellation_reason') else None
                
                success = publish_booking_cancelled_event(
                    booking_id=str(db_booking.id),
                    user_id=str(db_booking.user_id),
                    expert_id=expert_id,
                    reason=reason
                )
                
                if success:
                    logger.info(f"Published booking.cancelled event for booking {db_booking.id}")
                else:
                    logger.error(f"Failed to publish booking.cancelled event for booking {db_booking.id}")
                    
        except Exception as e:
            logger.error(f"Error publishing booking event: {str(e)}")
            # Note: We don't re-raise the exception to avoid disrupting the booking update process
        
        return db_booking
    except Exception as e:
        # Log and re-raise
        logger.error(f"Error in update_booking: {str(e)}")
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

        # Store booking details before deletion for event publishing
        booking_details = {
            "booking_id": str(db_booking.id),
            "user_id": str(db_booking.user_id),
            "gig_id": str(db_booking.gig_id)
        }
        
        # Delete the booking
        db.delete(db_booking)
        db.commit()
        
        # Publish booking.cancelled event
        try:
            # Get expert details from gig service
            from app.utils.gig_service import get_expert_details_for_booking
            expert_details = get_expert_details_for_booking(booking_details["gig_id"])
            
            if expert_details:
                expert_id = expert_details.get("expert_id")
            else:
                # Fallback if we can't get expert details
                expert_id = booking_details["gig_id"]  # Use gig_id as fallback
                logger.warning(f"Could not fetch expert details for gig {booking_details['gig_id']}")
                
            success = publish_booking_cancelled_event(
                booking_id=booking_details["booking_id"],
                user_id=booking_details["user_id"],
                expert_id=expert_id,
                reason="Booking deleted"
            )
            
            if success:
                logger.info(f"Published booking.cancelled event for deleted booking {booking_details['booking_id']}")
            else:
                logger.error(f"Failed to publish booking.cancelled event for deleted booking {booking_details['booking_id']}")
        except Exception as e:
            logger.error(f"Error publishing booking.cancelled event: {str(e)}")
            # Note: We don't re-raise the exception to avoid disrupting the booking deletion process
        
        return True
    except Exception as e:
        # Log and re-raise
        logger.error(f"Error in delete_booking: {str(e)}")
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

def get_booked_slots_for_date(db: Session, gig_id: uuid.UUID, date_str: str):
    """Get booked slots for a specific date."""
    from datetime import datetime
    from sqlalchemy import cast, Date, func
    
    try:
        # Parse the date string into a date object
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        # Query bookings for this gig on the specified date that are pending or confirmed
        bookings = db.query(Booking).filter(
            Booking.gig_id == gig_id,
            cast(Booking.scheduled_time, Date) == target_date,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
        ).all()
        
        return bookings
    except Exception as e:
        import logging
        logging.error(f"Error getting booked slots: {str(e)}")
        raise
