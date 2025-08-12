from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import os
from dotenv import load_dotenv
from typing import List
from app.db.database import get_db
from app.schemas.review import ReviewCreate, ReviewOut
from app.crud import review as review_crud
from app.core.auth import get_current_user, TokenData
load_dotenv()

router = APIRouter()
BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8003")

@router.post("/",response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_new_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    buyer_id = current_user.sub
    # Validate booking exists
    try:
        async with httpx.AsyncClient() as client:
            # We need an endpoint in booking-service to verify this
            response = await client.get(
                f"{BOOKING_SERVICE_URL}/api/bookings/verify/{review_in.booking_id}",
                headers={"Authorization": f"Bearer {current_user.token}"} # Pass the token along
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=403, detail="Could not verify booking status.")
            
        booking_data = response.json()
        if booking_data.get("buyer_id") != buyer_id or booking_data.get("status") != "completed":
            raise HTTPException(status_code=403, detail="You are not allowed to review this booking.")

    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Booking service is unavailable.")

    # If all checks pass, create the review
    return review_crud.create_review(db=db, review=review_in, buyer_id=buyer_id)

@router.get("/gig/{gig_id}", response_model=List[ReviewOut])
def get_all_reviews_for_gig(gig_id: str, db: Session = Depends(get_db)):
    return review_crud.get_reviews_for_gig(db=db, gig_id=gig_id)