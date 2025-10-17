"""
Script to handle booking reminders by publishing events.
This would typically run as a scheduled task.
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import Booking, BookingStatus
from app.db.session import SessionLocal
from app.utils.event_publisher import publish_event

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def send_booking_reminders():
    """
    Send reminder notifications for bookings scheduled in the next 24 hours.
    This function would typically be run once per day as a scheduled task.
    """
    # Get current time
    now = datetime.now()
    
    # Calculate the time window for reminders
    # Bookings in the next 24 hours
    reminder_start_time = now
    reminder_end_time = now + timedelta(hours=24)
    
    # Create a database session
    db = SessionLocal()
    
    try:
        # Find bookings in the next 24 hours that are confirmed
        upcoming_bookings = db.query(Booking).filter(
            Booking.scheduled_time >= reminder_start_time,
            Booking.scheduled_time <= reminder_end_time,
            Booking.status == BookingStatus.CONFIRMED
        ).all()
        
        logger.info(f"Found {len(upcoming_bookings)} upcoming bookings for reminders")
        
        # Send reminder for each booking
        for booking in upcoming_bookings:
            try:
                # Fetch expert details from gig service
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
                
                # Prepare message
                message = {
                    "booking_id": str(booking.id),
                    "client_id": str(booking.user_id),
                    "expert_id": expert_id,
                    "booking_time": booking.scheduled_time.isoformat(),
                    "service_name": service_name
                }
                
                # Publish reminder event
                success = publish_event("booking.reminder.24hr", message)
                
                if success:
                    logger.info(f"Published reminder for booking {booking.id}")
                else:
                    logger.error(f"Failed to publish reminder for booking {booking.id}")
                
            except Exception as e:
                logger.error(f"Error sending reminder for booking {booking.id}: {str(e)}")
                # Continue with other bookings even if one fails
                continue
    
    finally:
        # Close the database session
        db.close()

if __name__ == "__main__":
    try:
        send_booking_reminders()
        logger.info("Booking reminder process completed successfully")
    except Exception as e:
        logger.error(f"Error in booking reminder process: {str(e)}")
        sys.exit(1)