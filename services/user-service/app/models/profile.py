
from sqlalchemy import Boolean, Column, Integer, String
from ..db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String, nullable=False)
    bio = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    is_expert = Column(Boolean, default=False, nullable=False)
    profile_pic = Column(String, nullable=True)  # Use 'profile_pic' to match the schema
    location = Column(String, nullable=True)
    social_links = Column(String, nullable=True)  # Store as JSON string or use a separate table for complex structures

