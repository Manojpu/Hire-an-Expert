import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.db.database import Base

class ReviewHelpful(Base):
    __tablename__ = "review_helpful"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id = Column(String, ForeignKey("reviews.id"), nullable=False)
    user_id = Column(String, nullable=False)  # Reference to user (external service)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Ensure a user can only mark a review as helpful once
    __table_args__ = (
        UniqueConstraint('review_id', 'user_id', name='unique_user_review_helpful'),
    )
