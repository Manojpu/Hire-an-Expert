from app.db import session
from app.db import crud
from app.db.schemas import BookingCreate, BookingUpdate, BookingResponse, BookingResponseWithGigDetails, GigDetails
from app.db.models import Booking  # Import the Booking model
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi import status
from app.core.logging import logger
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.firebase_auth import get_current_user_id
from app.utils.gig_service import get_gig_details
from typing import List
import uuid
import uuid

# Create router with explicit prefix to avoid path parameter conflicts
router = APIRouter()

# Define routes in order - fixed paths before path parameters

# 1. Root endpoint - list all bookings
@router.get("/", response_model=List[BookingResponse])
def get_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(session.get_db)):
    """Fetch a list of bookings, with pagination."""
    try:
        # Validate pagination parameters
        if skip < 0:
            raise HTTPException(status_code=400, detail="Skip parameter must be non-negative")
        if limit <= 0 or limit > 1000:
            raise HTTPException(status_code=400, detail="Limit parameter must be between 1 and 1000")
            
        logger.info(f"Getting all bookings with skip={skip}, limit={limit}")
        bookings = crud.get_bookings(db=db, skip=skip, limit=limit)
        return bookings
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bookings: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get bookings: {str(e)}"
        )

# 2. User-specific endpoints - important that these come before path parameters
@router.get("/by-current-user", response_model=List[BookingResponseWithGigDetails])
def get_bookings_by_user_new_endpoint(
    db: Session = Depends(session.get_db),
    current_user_id: str = Depends(get_current_user_id),
    include_gig_details: bool = True
):
    """Retrieve all bookings made by the current user with gig details (new endpoint)."""
    try:
        logger.info(f"Getting bookings for user: {current_user_id}")
        
        # Get bookings using the current_user_id
        try:
            # Validate user ID if possible
            try:
                # Try to validate UUID format
                uuid_user_id = str(uuid.UUID(current_user_id))
            except ValueError:
                # If not a valid UUID, use as is (logging a warning)
                logger.warning(f"User ID {current_user_id} is not in UUID format, using as-is")
                uuid_user_id = current_user_id
                
            # Query bookings by user_id
            bookings = crud.get_bookings_by_user(db=db, user_id=uuid_user_id)
            logger.info(f"Found {len(bookings)} bookings for user {uuid_user_id}")
            
            # If gig details are requested, fetch them for each booking
            if include_gig_details:
                enhanced_bookings = []
                for booking in bookings:
                    # Create a copy of the booking as a dict for modification
                    booking_dict = {
                        "id": booking.id,
                        "user_id": booking.user_id,
                        "gig_id": booking.gig_id,
                        "status": booking.status,
                        "scheduled_time": booking.scheduled_time,
                        "created_at": booking.created_at
                    }
                    
                    # Fetch gig details from gig service
                    gig_details = get_gig_details(str(booking.gig_id))
                    if gig_details:
                        booking_dict["gig_details"] = gig_details
                    else:
                        booking_dict["gig_details"] = None
                        
                    enhanced_bookings.append(booking_dict)
                return enhanced_bookings
            
            return bookings
        except Exception as inner_e:
            logger.error(f"Error retrieving bookings for user {current_user_id}: {str(inner_e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error retrieving bookings: {str(inner_e)}"
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting bookings for user {current_user_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get user bookings: {str(e)}"
        )

# Also provide the original /user endpoint for backward compatibility
@router.get("/user", response_model=List[BookingResponse])
def get_bookings_by_user(
    db: Session = Depends(session.get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Retrieve all bookings made by the current user (legacy endpoint)."""
    try:
        logger.info(f"Getting bookings for user (via legacy endpoint): {current_user_id}")
        
        # Get bookings using the current_user_id
        try:
            # Validate user ID if possible
            try:
                # Try to validate UUID format
                uuid_user_id = str(uuid.UUID(current_user_id))
            except ValueError:
                # If not a valid UUID, use as is (logging a warning)
                logger.warning(f"User ID {current_user_id} is not in UUID format, using as-is")
                uuid_user_id = current_user_id
                
            # Query bookings by user_id
            bookings = crud.get_bookings_by_user(db=db, user_id=uuid_user_id)
            logger.info(f"Found {len(bookings)} bookings for user {uuid_user_id}")
            return bookings
        except Exception as inner_e:
            logger.error(f"Error retrieving bookings for user {current_user_id}: {str(inner_e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error retrieving bookings: {str(inner_e)}"
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting bookings for user {current_user_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get user bookings: {str(e)}"
        )

# 3. Create booking endpoint
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking: BookingCreate, 
    db: Session = Depends(session.get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a new booking."""
    try:
        logger.info(f"Creating booking for user {current_user_id}, gig {booking.gig_id}")
        db_booking = crud.create_booking(db=db, booking=booking, user_id=current_user_id)
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

# 4. Path parameter routes come AFTER all fixed path routes
@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str = Path(..., description="The ID of the booking to retrieve"), 
    db: Session = Depends(session.get_db)
):
    """Retrieve a booking by its ID."""
    try:
        # Validate UUID format
        try:
            uuid_obj = uuid.UUID(booking_id)
        except ValueError:
            logger.warning(f"Invalid UUID format for booking_id: {booking_id}")
            raise HTTPException(
                status_code=400, 
                detail="Invalid booking ID format. Must be a valid UUID."
            )
        
        logger.info(f"Getting booking with ID: {booking_id}")
        db_booking = crud.get_booking(db=db, booking_id=str(uuid_obj))
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
def update_booking(
    booking_id: str = Path(..., description="The ID of the booking to update"),
    booking_update: BookingUpdate = None, 
    db: Session = Depends(session.get_db)
):
    """Update an existing booking."""
    try:
        # Validate UUID format
        try:
            uuid_obj = uuid.UUID(booking_id)
        except ValueError:
            logger.warning(f"Invalid UUID format for booking_id: {booking_id}")
            raise HTTPException(
                status_code=400, 
                detail="Invalid booking ID format. Must be a valid UUID."
            )
            
        logger.info(f"Updating booking with ID: {booking_id}")
        db_booking = crud.update_booking(db=db, booking_id=str(uuid_obj), booking_update=booking_update)
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
def delete_booking(
    booking_id: str = Path(..., description="The ID of the booking to delete"),
    db: Session = Depends(session.get_db)
):
    """Delete a booking by its ID."""
    try:
        # Validate UUID format
        try:
            uuid_obj = uuid.UUID(booking_id)
        except ValueError:
            logger.warning(f"Invalid UUID format for booking_id: {booking_id}")
            raise HTTPException(
                status_code=400, 
                detail="Invalid booking ID format. Must be a valid UUID."
            )
            
        logger.info(f"Deleting booking with ID: {booking_id}")
        success = crud.delete_booking(db=db, booking_id=str(uuid_obj))
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

# All endpoints have been organized in proper order

