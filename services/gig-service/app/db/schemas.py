from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Base properties shared by all Gig schemas
class GigBase(BaseModel):
    title: str
    description: str
    price: float

# Schema for creating a new gig (what the user sends)
class GigCreate(GigBase):
    pass

# Schema for updating a gig (all fields are optional)
class GigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None

# Schema for the response (what the API sends back)
class GigResponse(GigBase):
    id: str  # Changed from int to str to match the UUID string in the model
    expert_id: int
    created_at: datetime

    class Config:
        from_attributes = True # Allows Pydantic to read data from ORM models (renamed from orm_mode)