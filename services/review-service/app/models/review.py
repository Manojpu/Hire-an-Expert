import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text,  DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    gig_id = Column(String, ForeignKey("gigs.id"), nullable=False, index=True)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False, unique=True) # A booking can only have one review
    buyer_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    rating = Column(Integer, nullable=False) 
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
