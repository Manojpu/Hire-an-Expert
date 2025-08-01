
from sqlalchemy import Boolean, Column, String, DateTime, func
from ..db.database import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    # Use Firebase UID as the primary key
    id = Column(String, primary_key=True, index=True)
    display_name = Column(String, nullable=False)
    bio = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    is_expert = Column(Boolean, default=False, nullable=False)
    profile_pic = Column(String, nullable=True)
    location = Column(String, nullable=True)
    social_links = Column(String, nullable=True)  # Store as JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
