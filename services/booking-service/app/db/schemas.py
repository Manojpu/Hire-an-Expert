from pydantic import BaseModel, field_validator
from datetime import datetime
from app.db.models import BookingStatus
from typing import Optional, Union
from decimal import Decimal
import uuid

# Base properties shared by all Booking schemas
class BookingBase(BaseModel):
    gig_id: Union[str, uuid.UUID]  # Accept both string and UUID
    
    @field_validator('gig_id', mode='before')
    @classmethod
    def convert_gig_id_to_uuid(cls, v):
        """Convert string to UUID if needed"""
        if isinstance(v, str):
            try:
                return uuid.UUID(v)
            except ValueError:
                return v
        return v

class BookingCreate(BookingBase):
    """Schema for creating a new booking. user_id will be provided by the auth system."""
    scheduled_time: datetime  # Required field matching database

class BookingResponse(BookingBase):
    id: uuid.UUID
    user_id: uuid.UUID
    gig_id: uuid.UUID
    status: str
    scheduled_time: datetime  # Required field from database
    created_at: datetime
    amount: Optional[float] = None  # Calculated from gig's price (not in DB)

    class Config:
        from_attributes = True

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    scheduled_time: Optional[datetime] = None  # Allow updating scheduled_time

    class Config:
        from_attributes = True