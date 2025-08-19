import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text,  DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    gig_id = Column(String, index=True, nullable=False)  # Reference to gig in gig-service
    booking_id = Column(String, unique=True, nullable=False)  # Reference to booking in booking-service
    buyer_id = Column(String, nullable=False)  # Reference to profile in user-service
    rating = Column(Integer, nullable=False) 
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
