from pydantic import BaseModel
from datetime import datetime

# Base properties shared by all Booking schemas
class BookingBase(BaseModel):
    user_id: int
    gig_id: int

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: int
    buyer_id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True