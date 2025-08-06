from app.db import session
from app.db import crud
from app.db.schemas import BookingCreate, BookingUpdate, BookingResponse
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException   
from fastapi import status
from app.core.logging import logger

router = APIRouter()

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
    """Fetch a list of bookings, with pagination."""
    bookings = session.get_bookings(db=db, skip=skip, limit=limit)
    return bookings

