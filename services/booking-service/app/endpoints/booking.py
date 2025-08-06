from app.db import  session
from app.db.schemas import BookingCreate, BookingUpdate, BookingResponse
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException   
from fastapi import status

router = APIRouter()

@router.post("/bookings/", response_model=BookingResponse , status_code= status.HTTP_201_CREATED)
def create_booking(booking: BookingCreate, db: Session = Depends(session.get_db)):
    """Create a new booking."""
    user_id = session.get_current_user_id()
    db_booking = session.create_booking(db=db, booking=booking, user_id=user_id)
    if not db_booking:
        raise HTTPException(status_code=400, detail="Booking creation failed")
    return db_booking

@router.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: str, db: Session = Depends(session.get_db)):
    """Retrieve a booking by its ID."""
    db_booking = session.get_booking(db=db, booking_id=booking_id)
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return db_booking

@router.put("/bookings/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: str, booking_update: BookingUpdate, db: Session = Depends(session.get_db)):
    """Update an existing booking."""
    db_booking = session.update_booking(db=db, booking_id=booking_id, booking_update=booking_update)
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return db_booking

@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(booking_id: str, db: Session = Depends(session.get_db)):
    """Delete a booking by its ID."""
    success = session.delete_booking(db=db, booking_id=booking_id)
    if not success:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"detail": "Booking deleted successfully"}

@router.get("/bookings/user", response_model=list[BookingResponse])
def get_bookings_by_user(db: Session = Depends(session.get_db)):
    """Retrieve all bookings made by the current user."""
    user_id = session.get_current_user_id()
    bookings = session.get_bookings_by_user(db=db, user_id=user_id)
    return bookings

@router.get("/bookings/", response_model=list[BookingResponse])
def get_bookings(skip: int = 0, limit: int = 100, db    : Session = Depends(session.get_db)):
    """Fetch a list of bookings, with pagination."""
    bookings = session.get_bookings(db=db, skip=skip, limit=limit)
    return bookings

