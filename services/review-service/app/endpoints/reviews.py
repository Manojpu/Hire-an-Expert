from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import httpx
import os
import math
from dotenv import load_dotenv
from typing import List, Optional
from app.db.database import get_db
from app.schemas.review import (
    ReviewCreate, ReviewOut, ReviewUpdate, ReviewStats, 
    ReviewList, ReviewHelpfulCreate, ReviewHelpfulOut
)
from app.crud import review as review_crud
from app.core.auth import get_current_user, TokenData, get_user_by_id_or_current, User

load_dotenv()

router = APIRouter()
BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8003")
GIG_SERVICE_URL = os.getenv("GIG_SERVICE_URL", "http://gig-service:8004")

# Create Review
@router.post("/", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_by_id_or_current),
):
    """Create a new review for a completed booking"""
    buyer_id = current_user.sub
    
    # Check if review already exists for this booking
    existing_review = review_crud.get_review_by_booking_id(db, review_in.booking_id)
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A review already exists for this booking"
        )
    
    # Validate booking exists and is completed
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BOOKING_SERVICE_URL}/api/bookings/verify/{review_in.booking_id}",
                headers={"Authorization": f"Bearer {current_user.original_token}"}
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not verify booking status"
            )
            
        booking_data = response.json()
        if (booking_data.get("buyer_id") != buyer_id or 
            booking_data.get("status") != "completed"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to review this booking or booking is not completed"
            )
        
        seller_id = booking_data.get("seller_id")
        if not seller_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking data: missing seller_id"
            )

    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Booking service is unavailable"
        )

    # Create the review
    return review_crud.create_review(
        db=db, 
        review=review_in, 
        buyer_id=buyer_id,
        seller_id=seller_id
    )

# Get Review by ID
@router.get("/{review_id}", response_model=ReviewOut)
def get_review(review_id: str, db: Session = Depends(get_db)):
    """Get a specific review by ID"""
    review = review_crud.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return review

# Update Review
@router.put("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: str,
    review_update: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_by_id_or_current),
):
    """Update a review (only by the review author)"""
    review = review_crud.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.buyer_id != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own reviews"
        )
    
    updated_review = review_crud.update_review(db, review_id, review_update)
    if not updated_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update review"
        )
    
    return updated_review

# Delete Review (Soft Delete)
@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_by_id_or_current),
):
    """Delete a review (only by the review author)"""
    review = review_crud.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.buyer_id != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews"
        )
    
    if not review_crud.delete_review(db, review_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete review"
        )

# Get Reviews for Gig (Paginated)
@router.get("/gig/{gig_id}/reviews", response_model=ReviewList)
def get_gig_reviews(
    gig_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=50, description="Page size"),
    verified_only: bool = Query(False, description="Show only verified reviews"),
    sort_by: str = Query("created_at", regex="^(created_at|rating_desc|rating_asc|helpful)$"),
    db: Session = Depends(get_db)
):
    """Get paginated reviews for a specific gig"""
    skip = (page - 1) * size
    reviews, total = review_crud.get_reviews_for_gig(
        db=db, 
        gig_id=gig_id, 
        skip=skip, 
        limit=size,
        verified_only=verified_only,
        sort_by=sort_by
    )
    
    pages = math.ceil(total / size) if total > 0 else 0
    
    return ReviewList(
        reviews=reviews,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

# Get Review Statistics for Gig
@router.get("/gig/{gig_id}/stats", response_model=ReviewStats)
def get_gig_review_stats(gig_id: str, db: Session = Depends(get_db)):
    """Get review statistics for a specific gig"""
    return review_crud.get_review_stats_for_gig(db, gig_id)

# Get Reviews by Buyer (Current User)
@router.get("/buyer/my-reviews", response_model=ReviewList)
def get_my_reviews(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=50, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_by_id_or_current),
):
    """Get current user's reviews"""
    skip = (page - 1) * size
    reviews, total = review_crud.get_reviews_by_buyer(
        db=db,
        buyer_id=current_user.sub,
        skip=skip,
        limit=size
    )
    
    pages = math.ceil(total / size) if total > 0 else 0
    
    return ReviewList(
        reviews=reviews,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

# Get Reviews for Seller
@router.get("/seller/{seller_id}/reviews", response_model=ReviewList)
def get_seller_reviews(
    seller_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=50, description="Page size"),
    db: Session = Depends(get_db)
):
    """Get paginated reviews for a specific seller"""
    skip = (page - 1) * size
    reviews, total = review_crud.get_reviews_by_seller(
        db=db,
        seller_id=seller_id,
        skip=skip,
        limit=size
    )
    
    pages = math.ceil(total / size) if total > 0 else 0
    
    return ReviewList(
        reviews=reviews,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

# Get Review Statistics for Seller
@router.get("/seller/{seller_id}/stats", response_model=ReviewStats)
def get_seller_review_stats(seller_id: str, db: Session = Depends(get_db)):
    """Get review statistics for a specific seller"""
    return review_crud.get_review_stats_for_seller(db, seller_id)

# Mark Review as Helpful
@router.post("/{review_id}/helpful", response_model=ReviewHelpfulOut, status_code=status.HTTP_201_CREATED)
def mark_review_helpful(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_by_id_or_current),
):
    """Mark a review as helpful"""
    # Check if review exists
    review = review_crud.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Check if user already voted
    if review_crud.check_user_helpful_vote(db, review_id, current_user.sub):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already marked this review as helpful"
        )
    
    # Don't allow users to mark their own reviews as helpful
    if review.buyer_id == current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot mark your own review as helpful"
        )
    
    helpful_vote = review_crud.add_helpful_vote(db, review_id, current_user.sub)
    if not helpful_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add helpful vote"
        )
    
    return helpful_vote

# Remove Helpful Mark
@router.delete("/{review_id}/helpful", status_code=status.HTTP_204_NO_CONTENT)
def remove_helpful_mark(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_by_id_or_current)
):
    """Remove helpful mark from a review"""
    if not review_crud.remove_helpful_vote(db, review_id, current_user.sub):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Helpful vote not found"
        )

# Admin Endpoint: Mark Review as Verified
@router.post("/{review_id}/verify", response_model=ReviewOut)
def verify_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_by_id_or_current)
):
    """Mark a review as verified (Admin only - TODO: Add proper admin check)"""
    # TODO: Add proper admin role check
    review = review_crud.mark_review_as_verified(db, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return review

# Health Check for Reviews
@router.get("/health/check")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "review-service",
        "timestamp": "2025-10-11T00:00:00Z"
    }