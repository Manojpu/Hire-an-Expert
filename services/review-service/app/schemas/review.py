from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List

# Base Review schema
class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Review comment")

    @validator('comment')
    def validate_comment(cls, v):
        if v is not None and len(v.strip()) == 0:
            return None
        return v

# Schema for creating a review
class ReviewCreate(ReviewBase):
    gig_id: str = Field(..., description="ID of the gig being reviewed")
    booking_id: str = Field(..., description="ID of the booking this review is for")

# Schema for updating a review
class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5, description="Updated rating")
    comment: Optional[str] = Field(None, max_length=1000, description="Updated comment")

    @validator('comment')
    def validate_comment(cls, v):
        if v is not None and len(v.strip()) == 0:
            return None
        return v

# Schema for review output
class ReviewOut(ReviewBase):
    id: str
    gig_id: str
    booking_id: str
    buyer_id: str
    seller_id: str
    is_active: bool
    is_verified: bool
    helpful_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema for review summary/statistics
class ReviewStats(BaseModel):
    total_reviews: int
    average_rating: float
    rating_distribution: dict  # {1: count, 2: count, ...}
    verified_reviews_count: int

# Schema for helpful vote
class ReviewHelpfulCreate(BaseModel):
    review_id: str

class ReviewHelpfulOut(BaseModel):
    id: str
    review_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Schema for paginated reviews
class ReviewList(BaseModel):
    reviews: List[ReviewOut]
    total: int
    page: int
    size: int
    pages: int