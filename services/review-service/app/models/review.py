import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, Boolean, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    gig_id = Column(String, nullable=False, index=True)  # Reference to gig (external service)
    booking_id = Column(String, nullable=False, unique=True, index=True)  # A booking can only have one review
    buyer_id = Column(String, nullable=False, index=True)  # Reference to user (external service)
    seller_id = Column(String, nullable=False, index=True)  # Reference to seller (external service)
    rating = Column(Integer, nullable=False)  # Rating between 1-5
    comment = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)  # For soft delete
    is_verified = Column(Boolean, default=False, nullable=False)  # For verified reviews
    helpful_count = Column(Integer, default=0, nullable=False)  # Number of users who found this helpful
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Add constraint to ensure rating is between 1 and 5
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        CheckConstraint('helpful_count >= 0', name='check_helpful_count_positive'),
    )
