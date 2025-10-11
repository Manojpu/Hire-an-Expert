from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional, List, Tuple
from app.models.review import Review
from app.models.review_helpful import ReviewHelpful
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewStats

# Create operations
def create_review(db: Session, review: ReviewCreate, buyer_id: str, seller_id: str) -> Review:
    db_review = Review(
        gig_id=review.gig_id,
        booking_id=review.booking_id,
        buyer_id=buyer_id,
        seller_id=seller_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

# Read operations
def get_review_by_id(db: Session, review_id: str) -> Optional[Review]:
    return db.query(Review).filter(
        and_(Review.id == review_id, Review.is_active == True)
    ).first()

def get_review_by_booking_id(db: Session, booking_id: str) -> Optional[Review]:
    return db.query(Review).filter(
        and_(Review.booking_id == booking_id, Review.is_active == True)
    ).first()

def get_reviews_for_gig(
    db: Session, 
    gig_id: str, 
    skip: int = 0, 
    limit: int = 10,
    verified_only: bool = False,
    sort_by: str = "created_at"
) -> Tuple[List[Review], int]:
    query = db.query(Review).filter(
        and_(Review.gig_id == gig_id, Review.is_active == True)
    )
    
    if verified_only:
        query = query.filter(Review.is_verified == True)
    
    # Sorting options
    if sort_by == "rating_desc":
        query = query.order_by(desc(Review.rating))
    elif sort_by == "rating_asc":
        query = query.order_by(Review.rating)
    elif sort_by == "helpful":
        query = query.order_by(desc(Review.helpful_count))
    else:  # default: created_at desc
        query = query.order_by(desc(Review.created_at))
    
    total = query.count()
    reviews = query.offset(skip).limit(limit).all()
    return reviews, total

def get_reviews_by_buyer(
    db: Session, 
    buyer_id: str, 
    skip: int = 0, 
    limit: int = 10
) -> Tuple[List[Review], int]:
    query = db.query(Review).filter(
        and_(Review.buyer_id == buyer_id, Review.is_active == True)
    ).order_by(desc(Review.created_at))
    
    total = query.count()
    reviews = query.offset(skip).limit(limit).all()
    return reviews, total

def get_reviews_by_seller(
    db: Session, 
    seller_id: str, 
    skip: int = 0, 
    limit: int = 10
) -> Tuple[List[Review], int]:
    query = db.query(Review).filter(
        and_(Review.seller_id == seller_id, Review.is_active == True)
    ).order_by(desc(Review.created_at))
    
    total = query.count()
    reviews = query.offset(skip).limit(limit).all()
    return reviews, total

def get_review_stats_for_gig(db: Session, gig_id: str) -> ReviewStats:
    # Get basic stats
    query = db.query(Review).filter(
        and_(Review.gig_id == gig_id, Review.is_active == True)
    )
    
    total_reviews = query.count()
    
    if total_reviews == 0:
        return ReviewStats(
            total_reviews=0,
            average_rating=0.0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            verified_reviews_count=0
        )
    
    # Calculate average rating
    avg_rating = db.query(func.avg(Review.rating)).filter(
        and_(Review.gig_id == gig_id, Review.is_active == True)
    ).scalar() or 0.0
    
    # Get rating distribution
    rating_dist = db.query(
        Review.rating, 
        func.count(Review.rating)
    ).filter(
        and_(Review.gig_id == gig_id, Review.is_active == True)
    ).group_by(Review.rating).all()
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in rating_dist:
        rating_distribution[rating] = count
    
    # Count verified reviews
    verified_count = query.filter(Review.is_verified == True).count()
    
    return ReviewStats(
        total_reviews=total_reviews,
        average_rating=round(avg_rating, 2),
        rating_distribution=rating_distribution,
        verified_reviews_count=verified_count
    )

def get_review_stats_for_seller(db: Session, seller_id: str) -> ReviewStats:
    # Similar to gig stats but for all seller's reviews
    query = db.query(Review).filter(
        and_(Review.seller_id == seller_id, Review.is_active == True)
    )
    
    total_reviews = query.count()
    
    if total_reviews == 0:
        return ReviewStats(
            total_reviews=0,
            average_rating=0.0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            verified_reviews_count=0
        )
    
    avg_rating = db.query(func.avg(Review.rating)).filter(
        and_(Review.seller_id == seller_id, Review.is_active == True)
    ).scalar() or 0.0
    
    rating_dist = db.query(
        Review.rating, 
        func.count(Review.rating)
    ).filter(
        and_(Review.seller_id == seller_id, Review.is_active == True)
    ).group_by(Review.rating).all()
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in rating_dist:
        rating_distribution[rating] = count
    
    verified_count = query.filter(Review.is_verified == True).count()
    
    return ReviewStats(
        total_reviews=total_reviews,
        average_rating=round(avg_rating, 2),
        rating_distribution=rating_distribution,
        verified_reviews_count=verified_count
    )

# Update operations
def update_review(db: Session, review_id: str, review_update: ReviewUpdate) -> Optional[Review]:
    db_review = get_review_by_id(db, review_id)
    if not db_review:
        return None
    
    update_data = review_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_review, field, value)
    
    db.commit()
    db.refresh(db_review)
    return db_review

def mark_review_as_verified(db: Session, review_id: str) -> Optional[Review]:
    db_review = get_review_by_id(db, review_id)
    if db_review:
        db_review.is_verified = True
        db.commit()
        db.refresh(db_review)
    return db_review

# Delete operations (soft delete)
def delete_review(db: Session, review_id: str) -> bool:
    db_review = get_review_by_id(db, review_id)
    if db_review:
        db_review.is_active = False
        db.commit()
        return True
    return False

# Helpful votes operations
def add_helpful_vote(db: Session, review_id: str, user_id: str) -> Optional[ReviewHelpful]:
    # Check if user already voted
    existing_vote = db.query(ReviewHelpful).filter(
        and_(ReviewHelpful.review_id == review_id, ReviewHelpful.user_id == user_id)
    ).first()
    
    if existing_vote:
        return None  # Already voted
    
    # Add vote
    helpful_vote = ReviewHelpful(review_id=review_id, user_id=user_id)
    db.add(helpful_vote)
    
    # Update helpful count
    review = get_review_by_id(db, review_id)
    if review:
        review.helpful_count += 1
        db.commit()
        db.refresh(helpful_vote)
        return helpful_vote
    
    return None

def remove_helpful_vote(db: Session, review_id: str, user_id: str) -> bool:
    helpful_vote = db.query(ReviewHelpful).filter(
        and_(ReviewHelpful.review_id == review_id, ReviewHelpful.user_id == user_id)
    ).first()
    
    if helpful_vote:
        db.delete(helpful_vote)
        
        # Update helpful count
        review = get_review_by_id(db, review_id)
        if review and review.helpful_count > 0:
            review.helpful_count -= 1
        
        db.commit()
        return True
    
    return False

def check_user_helpful_vote(db: Session, review_id: str, user_id: str) -> bool:
    """Check if user has already marked this review as helpful"""
    return db.query(ReviewHelpful).filter(
        and_(ReviewHelpful.review_id == review_id, ReviewHelpful.user_id == user_id)
    ).first() is not None