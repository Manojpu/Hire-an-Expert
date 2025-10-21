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
                        "created_at": booking.created_at,
                        "meeting_link": booking.meeting_link  # Include meeting link
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

# 3. Gig-specific endpoints - get bookings by gig
@router.get("/gig/{gig_id}", response_model=List[BookingResponseWithGigDetails])
def get_bookings_by_gig(
    gig_id: str,
    db: Session = Depends(session.get_db),
    include_user_details: bool = True
):
    """Retrieve all bookings for a specific gig with user details."""
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
        
        logger.info(f"Getting bookings for gig: {gig_id}")
        bookings = crud.get_bookings_by_gig(db=db, gig_id=str(uuid_obj))
        logger.info(f"Found {len(bookings)} bookings for gig {gig_id}")
        
        # If user details are requested, fetch them for each booking
        if include_user_details:
            from app.utils.user_service import get_user_details
            enhanced_bookings = []
            
            for booking in bookings:
                # Create a dict for the booking response
                booking_dict = {
                    "id": booking.id,
                    "user_id": booking.user_id,
                    "gig_id": booking.gig_id,
                    "status": booking.status,
                    "scheduled_time": booking.scheduled_time,
                    "created_at": booking.created_at,
                    "meeting_link": booking.meeting_link  # Include meeting link
                }
                
                # Fetch user details from user service
                try:
                    user_details = get_user_details(str(booking.user_id))
                    if user_details:
                        booking_dict["user"] = user_details
                    else:
                        booking_dict["user"] = None
                except Exception as user_err:
                    logger.warning(f"Could not fetch user details for user {booking.user_id}: {str(user_err)}")
                    booking_dict["user"] = None
                
                # Fetch gig details
                try:
                    gig_details = get_gig_details(str(booking.gig_id))
                    if gig_details:
                        booking_dict["gig_details"] = gig_details
                    else:
                        booking_dict["gig_details"] = None
                except Exception as gig_err:
                    logger.warning(f"Could not fetch gig details for gig {booking.gig_id}: {str(gig_err)}")
                    booking_dict["gig_details"] = None
                
                enhanced_bookings.append(booking_dict)
            
            return enhanced_bookings
        
        return bookings
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bookings for gig {gig_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get bookings for gig: {str(e)}"
        )

# 4. Available slots endpoint
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

@router.put("/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: str = Path(..., description="The ID of the booking to confirm"),
    db: Session = Depends(session.get_db)
):
    """Confirm a booking and generate Agora meeting link."""
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
            
        logger.info(f"Confirming booking with ID: {booking_id}")
        
        # Generate unique channel name for Agora
        channel_name = f"booking-{booking_id}"
        
        # Update booking status to confirmed and add meeting link
        booking_update = BookingUpdate(
            status="confirmed",
            meeting_link=channel_name
        )
        
        db_booking = crud.update_booking(db=db, booking_id=str(uuid_obj), booking_update=booking_update)
        if not db_booking:
            logger.warning(f"Booking with ID {booking_id} not found for confirmation")
            raise HTTPException(status_code=404, detail="Booking not found")
            
        logger.info(f"Booking {booking_id} confirmed with channel: {channel_name}")
        return db_booking
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming booking {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to confirm booking: {str(e)}"
        )

@router.put("/{booking_id}/join", response_model=BookingResponse)
def join_booking(
    booking_id: str = Path(..., description="The ID of the booking to join"),
    db: Session = Depends(session.get_db)
):
    """Mark a booking as joined when user enters the meeting."""
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
            
        logger.info(f"Marking booking as joined with ID: {booking_id}")
        
        # Update booking status to joined
        booking_update = BookingUpdate(status="joined")
        
        db_booking = crud.update_booking(db=db, booking_id=str(uuid_obj), booking_update=booking_update)
        if not db_booking:
            logger.warning(f"Booking with ID {booking_id} not found for join")
            raise HTTPException(status_code=404, detail="Booking not found")
            
        logger.info(f"Booking {booking_id} marked as joined")
        return db_booking
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking booking as joined {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to mark booking as joined: {str(e)}"
        )

@router.put("/{booking_id}/complete", response_model=BookingResponse)
def complete_booking(
    booking_id: str = Path(..., description="The ID of the booking to complete"),
    db: Session = Depends(session.get_db)
):
    """Mark a booking as completed when user clicks done."""
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
            
        logger.info(f"Marking booking as completed with ID: {booking_id}")
        
        # Update booking status to completed
        booking_update = BookingUpdate(status="completed")
        
        db_booking = crud.update_booking(db=db, booking_id=str(uuid_obj), booking_update=booking_update)
        if not db_booking:
            logger.warning(f"Booking with ID {booking_id} not found for completion")
            raise HTTPException(status_code=404, detail="Booking not found")
            
        logger.info(f"Booking {booking_id} marked as completed")
        return db_booking
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking booking as completed {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to mark booking as completed: {str(e)}"
        )

# @router.get("/verify/{booking_id}")
# def verify_booking(
#     booking_id: str = Path(..., description="The ID of the booking to verify"),
#     db: Session = Depends(session.get_db)
# ):
#     """Verify booking exists and return details for review submission."""
#     try:
#         # Validate UUID format
#         try:
#             uuid_obj = uuid.UUID(booking_id)
#         except ValueError:
#             logger.warning(f"Invalid UUID format for booking_id: {booking_id}")
#             raise HTTPException(
#                 status_code=400, 
#                 detail="Invalid booking ID format. Must be a valid UUID."
#             )
            
#         logger.info(f"Verifying booking with ID: {booking_id}")
        
#         db_booking = crud.get_booking(db=db, booking_id=str(uuid_obj))
#         if not db_booking:
#             logger.warning(f"Booking with ID {booking_id} not found")
#             raise HTTPException(status_code=404, detail="Booking not found")
        
#         # Get expert_id from gig service
#         from app.utils.gig_service import get_gig_details
#         gig_details = get_gig_details(str(db_booking.gig_id))
        
#         seller_id = None
#         if gig_details and gig_details.get("expert_id"):
#             seller_id = gig_details.get("expert_id")
#         else:
#             logger.warning(f"Could not fetch expert_id for gig {db_booking.gig_id}")
#             # Fallback to gig_id if expert_id not available
#             seller_id = str(db_booking.gig_id)
        
#         # Get status - return the actual database value
#         booking_status = db_booking.status
#         if hasattr(booking_status, 'value'):
#             status_str = booking_status.value
#         else:
#             status_str = str(booking_status)
        
#         logger.info(f"Booking verification successful: buyer_id={db_booking.user_id}, seller_id={seller_id}, status={status_str}")
        
#         # Return booking details needed for review
#         return {
#             "booking_id": str(db_booking.id),
#             "buyer_id": str(db_booking.user_id),
#             "seller_id": seller_id,
#             "status": status_str
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error verifying booking {booking_id}: {str(e)}")
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Failed to verify booking: {str(e)}"
#         )
    


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

# All endpoints have been organized in proper order

