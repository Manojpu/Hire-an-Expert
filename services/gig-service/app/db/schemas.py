from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field
import enum


class UserRole(str, enum.Enum):
    CLIENT = "client"
    EXPERT = "expert"
    ADMIN = "admin"

class UserDTO(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    firebase_uid: str
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CLIENT
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_expert: bool = True

    class Config:
        from_attributes = True
        json_encoders = {
            uuid.UUID: str
        }
