from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class Review(BaseModel):
    rating: int = Field(..., gt=0, le=5) # Rating must be between 1 and 5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewCreate(Review):
    gig_id: str
    booking_id: str

class ReviewOut(Review):
    id: str
    gig_id: str
    buyer_id: str
    created_at: datetime

    class Config:
        orm_mode = True