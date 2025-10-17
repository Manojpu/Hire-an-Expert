from app.db import session
from app.db import crud
from app.db.schemas import BookingCreate, BookingUpdate, BookingResponse
from app.db.models import Booking  # Import the Booking model
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi import status
from app.core.logging import logger
import httpx
import asyncio
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.firebase_auth import get_current_user_id
from app.utils.gig_service import get_gig_details
from typing import List, Optional
import uuid
from app.core.config import settings

# Create router with explicit prefix to avoid path parameter conflicts
router = APIRouter()

async def get_user_from_service(user_id: str):
    """Fetch user details from the user service."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.USER_SERVICE_URL}/users/{user_id}")
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "id": user_data.get("id", user_id),
                    "firebase_uid": user_data.get("firebase_uid"),  # Include Firebase UID
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
    """Transform a booking object with calculated amount from gig service."""
    # Get gig details to calculate amount
    gig_details = get_gig_details(str(booking.gig_id))
    amount = None
    if gig_details and gig_details.get("hourly_rate"):
        amount = float(gig_details["hourly_rate"])
    
    return {
        "id": booking.id,
        "user_id": booking.user_id,
        "gig_id": booking.gig_id,
        "status": booking.status.value if hasattr(booking.status, 'value') else booking.status,
        "scheduled_time": booking.scheduled_time,  # Include scheduled_time from DB
        "created_at": booking.created_at,
        "amount": amount
    }
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
@router.get("/by-current-user", response_model=List[BookingResponse])
def get_bookings_by_user_new_endpoint(
    db: Session = Depends(session.get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Retrieve all bookings made by the current user with calculated amounts from gig prices."""
    try:
        logger.info(f"Getting bookings for user: {current_user_id}")
        
        # Validate user ID format
        try:
            uuid_user_id = str(uuid.UUID(current_user_id))
        except ValueError:
            logger.warning(f"User ID {current_user_id} is not in UUID format, using as-is")
            uuid_user_id = current_user_id
            
        # Query bookings by user_id
        bookings = crud.get_bookings_by_user(db=db, user_id=uuid_user_id)
        logger.info(f"Found {len(bookings)} bookings for user {uuid_user_id}")
        
        # Enrich bookings with calculated amount from gig service
        enhanced_bookings = []
        for booking in bookings:
            # Create response dict with core fields from database
            booking_dict = {
                "id": booking.id,
                "user_id": booking.user_id,
                "gig_id": booking.gig_id,
                "status": booking.status.value if hasattr(booking.status, 'value') else booking.status,
                "scheduled_time": booking.scheduled_time,  # Include scheduled_time from DB
                "created_at": booking.created_at,
                "amount": None  # Will be calculated from gig price
            }
            
            # Fetch gig details to get price/hourly_rate
            gig_details = get_gig_details(str(booking.gig_id))
            if gig_details:
                # Use hourly_rate from gig as the booking amount
                hourly_rate = gig_details.get("hourly_rate")
                if hourly_rate is not None:
                    booking_dict["amount"] = float(hourly_rate)
                    logger.debug(f"Booking {booking.id}: amount={hourly_rate} from gig {booking.gig_id}")
                else:
                    logger.warning(f"No hourly_rate found for gig {booking.gig_id}")
            else:
                logger.warning(f"Could not fetch gig details for gig_id {booking.gig_id}")
                
            enhanced_bookings.append(booking_dict)
        
        logger.info(f"Returning {len(enhanced_bookings)} enriched bookings")
        return enhanced_bookings
        
    except HTTPException:
        raise
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
@router.get("/gigs/{gig_id}/available-slots")
def get_available_slots(
    gig_id: str,
    date: str,
    db: Session = Depends(session.get_db)
):
    """Get available time slots for a gig on a specific date."""
    try:
        # Validate UUID format for gig_id
        try:
            uuid_obj = uuid.UUID(gig_id)
        except ValueError:
            logger.warning(f"Invalid UUID format for gig_id: {gig_id}")
            raise HTTPException(
                status_code=400, 
                detail="Invalid gig ID format. Must be a valid UUID."
            )
            
        # Validate date format
        try:
            from datetime import datetime
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            logger.warning(f"Invalid date format: {date}")
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Must be in YYYY-MM-DD format."
            )
        
        # Get booked slots for the date
        booked_slots = crud.get_booked_slots_for_date(db=db, gig_id=uuid_obj, date_str=date)
        
        # Return the booked times as ISO strings
        booked_times = [b.scheduled_time.isoformat() for b in booked_slots]
        return booked_times
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting available slots: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get available slots: {str(e)}"
        )

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
            raise HTTPException(status_code=400, detail="Time slot is already booked")
        return db_booking
    except HTTPException:
        raise
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

@router.get("/verify/{booking_id}")
def verify_booking_for_review(
    booking_id: str = Path(..., description="The ID of the booking to verify"), 
    db: Session = Depends(session.get_db)
):
    """
    Verify booking status for review service.
    Returns minimal booking data needed for creating a review.
    """
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
        
        logger.info(f"Verifying booking {booking_id} for review")
        db_booking = crud.get_booking(db=db, booking_id=str(uuid_obj))
        
        if not db_booking:
            logger.warning(f"Booking with ID {booking_id} not found")
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get gig details to find the expert (seller)
        try:
            gig_data = get_gig_details(str(db_booking.gig_id))
            seller_id = gig_data.get("expert_id") if gig_data else None
            print(f"🔍 GIG DATA: {gig_data}")
            print(f"🔍 SELLER ID (expert_id): {seller_id}")
        except Exception as e:
            logger.error(f"Error fetching gig details: {str(e)}")
            seller_id = None
        
        # Get Firebase UID of the buyer from user service
        buyer_firebase_uid = None
        try:
            user_data = asyncio.run(get_user_from_service(str(db_booking.user_id)))
            print(f"🔍 USER DATA from user service: {user_data}")
            print(f"🔍 user_data.get('firebase_uid'): {user_data.get('firebase_uid')}")
            print(f"🔍 user_data.get('id'): {user_data.get('id')}")
            # Try to get firebase_uid or fallback to id
            buyer_firebase_uid = user_data.get("firebase_uid") or user_data.get("id")
            print(f"🔍 Final buyer_firebase_uid: {buyer_firebase_uid}")
            logger.info(f"Buyer Firebase UID: {buyer_firebase_uid} for user_id: {db_booking.user_id}")
        except Exception as e:
            logger.error(f"Error fetching user Firebase UID: {str(e)}")
            buyer_firebase_uid = str(db_booking.user_id)  # Fallback to database ID
        
        # Return minimal data needed for review
        return {
            "booking_id": str(db_booking.id),
            "buyer_id": buyer_firebase_uid,  # Firebase UID of the buyer
            "seller_id": seller_id,  # expert_id from gig
            "status": db_booking.status.value if hasattr(db_booking.status, 'value') else db_booking.status,
            "gig_id": str(db_booking.gig_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying booking {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to verify booking: {str(e)}"
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

@router.get("/gig/{gig_id}", response_model=List[BookingResponse])
def get_bookings_by_gig(gig_id: str, db: Session = Depends(session.get_db)):
    """Retrieve all bookings for a specific gig with calculated amounts."""
    try:
        logger.info(f"Getting bookings for gig: {gig_id}")
        bookings = crud.get_bookings_by_gig(db=db, gig_id=gig_id)
        
        logger.info(f"Found {len(bookings)} bookings for gig {gig_id}")
        
        # Get gig details once for all bookings (same gig) - with quick timeout
        logger.info(f"Fetching gig details for gig_id: {gig_id}")
        amount = None
        
        try:
            gig_details = get_gig_details(gig_id)
            if gig_details:
                logger.info(f"Gig details fetched successfully")
                if gig_details.get("hourly_rate"):
                    amount = float(gig_details["hourly_rate"])
                    logger.info(f"Amount set to: {amount}")
            else:
                logger.warning(f"Gig details returned None for gig_id: {gig_id}")
        except Exception as gig_error:
            # Don't fail the entire request if gig service is down
            logger.error(f"Failed to fetch gig details: {str(gig_error)}")
            logger.info("Continuing without amount calculation")
        
        # Transform bookings with calculated amount
        detailed_bookings = []
        for booking in bookings:
            detailed_booking = {
                "id": str(booking.id),  # Convert UUID to string for JSON serialization
                "user_id": str(booking.user_id),
                "gig_id": str(booking.gig_id),
                "status": booking.status.value if hasattr(booking.status, 'value') else booking.status,
                "scheduled_time": booking.scheduled_time,  # Include scheduled_time from DB
                "created_at": booking.created_at,
                "amount": amount
            }
            detailed_bookings.append(detailed_bookings)
        
        logger.info(f"Returning {len(detailed_bookings)} bookings")
        return detailed_bookings
    except Exception as e:
        logger.error(f"Error getting bookings for gig {gig_id}: {str(e)}", exc_info=True)
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

