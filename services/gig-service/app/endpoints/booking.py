from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db, get_current_user_id
from app.db.schemas import BookingCreate, BookingUpdate, BookingResponse
from app.db.crud import create_booking, get_booking, update_booking, delete_booking, get_bookings_by_user, get_bookings, get_bookings_by_gig


router = APIRouter()

@router.post("/bookings/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_new_booking(booking: BookingCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Create a new booking."""
    db_booking = create_booking(db=db, booking=booking, user_id=user_id)
    if not db_booking:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking creation failed")
    return db_booking

@router.get("/bookings/{boooking_id}", response_model=BookingResponse)
def read_booking(booking_id: str, db: Session = Depends(get_db)):
    """Retrieve a booking by its ID."""
    db_booking = get_booking(db=db, booking_id=booking_id)
    if not db_booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return db_booking

@router.put("/bookings/{booking_id}", response_model=BookingResponse)
def update_existing_booking(booking_id: str, booking_update: BookingUpdate, db: Session = Depends(get_db)):
    """Update an existing booking."""
    db_booking = update_booking(db=db, booking_id=booking_id, booking_update=booking_update)
    if not db_booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return db_booking

@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_booking(booking_id: str, db: Session = Depends(get_db)):
    """Delete a booking by its ID."""
    success = delete_booking(db=db, booking_id=booking_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return {"detail": "Booking deleted successfully"}

@router.get("/users/{user_id}/bookings/", response_model=list[BookingResponse])
def read_user_bookings(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all bookings made by a specific user."""
    bookings = get_bookings_by_user(db=db, user_id=user_id)
    if not bookings:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No bookings found for this user")
    return bookings

@router.get("/bookings/", response_model=list[BookingResponse])
def read_all_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Fetch a list of bookings, with pagination."""
    bookings = get_bookings(db=db, skip=skip, limit=limit)
    return bookings
