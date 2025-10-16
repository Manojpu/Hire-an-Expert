from app.db import session
from app.db import crud
from app.db.schemas import BookingCreate, BookingUpdate, BookingResponse, BookingWithDetails
from app.db.models import User, Gig
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException   
from fastapi import status
from app.core.logging import logger
import httpx
import asyncio

router = APIRouter()

USER_SERVICE_URL = "http://localhost:8001"

async def get_user_from_service(user_id: str):
    """Fetch user details from the user service."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{USER_SERVICE_URL}/users/{user_id}")
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "id": user_data.get("id", user_id),
                    "name": user_data.get("full_name") or user_data.get("name") or f"User {user_id}",
                    "email": user_data.get("email")
                }
            else:
                logger.warning(f"User service returned {response.status_code} for user {user_id}")
                return {"id": user_id, "name": f"User {user_id}", "email": None}
    except Exception as e:
        logger.error(f"Error fetching user {user_id} from user service: {e}")
        return {"id": user_id, "name": f"User {user_id}", "email": None}

def transform_booking_with_details(db: Session, booking):
    """Transform a booking object to include user and gig details."""
    # Skip database lookups to avoid type mismatch issues for now
    # Just return booking data with mock user/gig info
    return {
        "id": booking.id,
        "user_id": booking.user_id,
        "gig_id": booking.gig_id,
        "status": booking.status.value if hasattr(booking.status, 'value') else booking.status,
        "scheduled_time": booking.scheduled_time,
        "duration": booking.duration,
        "service": booking.service,
        "type": booking.type,
        "notes": booking.notes,
        "created_at": booking.created_at,
        "user": {
            "id": booking.user_id,
            "name": f"User {booking.user_id}",
            "email": None
        },
        "gig": {
            "id": booking.gig_id,
            "title": f"Gig {booking.gig_id}",
            "hourly_rate": 100.0  # Default rate
        }
    }

@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(booking: BookingCreate, db: Session = Depends(session.get_db)):
    """Create a new booking."""
    try:
        user_id = session.get_current_user_id()
        logger.info(f"Creating booking for user {user_id}, gig {booking.gig_id}")
        db_booking = crud.create_booking(db=db, booking=booking, user_id=user_id)
        if not db_booking:
            raise HTTPException(status_code=400, detail="Booking creation failed")
        return db_booking
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        logger.error(f"Booking data: {booking}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create booking: {str(e)}"
        )

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: str, db: Session = Depends(session.get_db)):
    """Retrieve a booking by its ID."""
    try:
        logger.info(f"Getting booking with ID: {booking_id}")
        db_booking = crud.get_booking(db=db, booking_id=booking_id)
        if not db_booking:
            logger.warning(f"Booking with ID {booking_id} not found")
            raise HTTPException(status_code=404, detail="Booking not found")
        return db_booking
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting booking {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get booking: {str(e)}"
        )

@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: str, booking_update: BookingUpdate, db: Session = Depends(session.get_db)):
    """Update an existing booking."""
    try:
        logger.info(f"Updating booking with ID: {booking_id}")
        db_booking = crud.update_booking(db=db, booking_id=booking_id, booking_update=booking_update)
        if not db_booking:
            logger.warning(f"Booking with ID {booking_id} not found for update")
            raise HTTPException(status_code=404, detail="Booking not found")
        return db_booking
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating booking {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to update booking: {str(e)}"
        )

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(booking_id: str, db: Session = Depends(session.get_db)):
    """Delete a booking by its ID."""
    try:
        logger.info(f"Deleting booking with ID: {booking_id}")
        success = crud.delete_booking(db=db, booking_id=booking_id)
        if not success:
            logger.warning(f"Booking with ID {booking_id} not found for deletion")
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"detail": "Booking deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting booking {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete booking: {str(e)}"
        )

@router.get("/user", response_model=list[BookingResponse])
def get_bookings_by_user(db: Session = Depends(session.get_db)):
    """Retrieve all bookings made by the current user."""
    try:
        user_id = session.get_current_user_id()
        logger.info(f"Getting bookings for user: {user_id}")
        bookings = crud.get_bookings_by_user(db=db, user_id=user_id)
        return bookings
    except Exception as e:
        logger.error(f"Error getting bookings for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get user bookings: {str(e)}"
        )

@router.get("/gig/{gig_id}")
async def get_bookings_by_gig(gig_id: str, db: Session = Depends(session.get_db)):
    """Retrieve all bookings for a specific gig with user and gig details."""
    try:
        logger.info(f"Getting bookings for gig: {gig_id}")
        bookings = crud.get_bookings_by_gig(db=db, gig_id=gig_id)
        
        # Transform bookings with user and gig details
        detailed_bookings = []
        for booking in bookings:
            # Get real user data from user service
            user_data = await get_user_from_service(str(booking.user_id))
            
            detailed_booking = {
                "id": booking.id,
                "user_id": booking.user_id,
                "gig_id": booking.gig_id,
                "status": booking.status.value if hasattr(booking.status, 'value') else booking.status,
                "scheduled_time": booking.scheduled_time,
                "duration": booking.duration,
                "service": booking.service,
                "type": booking.type,
                "notes": booking.notes,
                "created_at": booking.created_at,
                "user": user_data,
                "gig": {
                    "id": booking.gig_id,
                    "title": f"Gig {booking.gig_id}",
                    "hourly_rate": 100.0  # Default rate
                }
            }
            detailed_bookings.append(detailed_booking)
        
        return detailed_bookings
    except Exception as e:
        logger.error(f"Error getting bookings for gig {gig_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get gig bookings: {str(e)}"
        )

@router.get("/", response_model=list[BookingResponse])
def get_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(session.get_db)):
    """Fetch a list of bookings, with pagination."""
    try:
        logger.info(f"Getting all bookings with skip={skip}, limit={limit}")
        bookings = crud.get_bookings(db=db, skip=skip, limit=limit)
        return bookings
    except Exception as e:
        logger.error(f"Error getting bookings: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get bookings: {str(e)}"
        )

