from sqlalchemy.orm import Session
from app.models.review import Review
from app.schemas.review import ReviewCreate

def create_review(db: Session, review: ReviewCreate, buyer_id: str) -> Review:
    db_review = Review(
        gig_id=review.gig_id,
        booking_id=review.booking_id,
        buyer_id=buyer_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_reviews_for_gig(db: Session, gig_id: str) -> list[Review]:
    return db.query(Review).filter(Review.gig_id == gig_id).all()