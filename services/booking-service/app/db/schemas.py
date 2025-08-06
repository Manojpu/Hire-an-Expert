from pydantic import BaseModel
from datetime import datetime

class BookingCreate(BaseModel):
    gig_id: int

class BookingResponse(BaseModel):
    id: int
    gig_id: int
    buyer_id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True