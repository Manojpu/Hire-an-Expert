import uuid
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from app.db.schemas import (
    GigCreate, GigUpdate, GigStatusUpdate, GigFilters, 
    GigStatusEnum, ExpertCategoryEnum
)
from app.db.models import Gig, GigStatus, ExpertCategory

def create_gig(db: Session, gig: GigCreate, expert_id: str, user_id: str = None) -> Gig:
    """Create a new gig from expert application"""
    gig_id = str(uuid.uuid4())
    
    db_gig = Gig(
        id=gig_id,
        expert_id=expert_id,
        user_id=user_id or expert_id,
        
        # Basic Information
        name=gig.name,
        title=gig.title,
        bio=gig.bio,
        profile_image_url=gig.profile_image_url,
        banner_image_url=gig.banner_image_url,
        languages=gig.languages,
        
        # Expertise & Services
        category=ExpertCategory(gig.category.value),
        service_description=gig.service_description,
        hourly_rate=gig.hourly_rate,
        currency=gig.currency,
        availability_preferences=gig.availability_preferences,
        
        # Qualifications
        education=gig.education,
        experience=gig.experience,
        certifications=gig.certifications,
        
        # Verification
        government_id_url=gig.government_id_url,
        professional_license_url=gig.professional_license_url,
        references=gig.references,
        background_check_consent=gig.background_check_consent,
        
        # Default system values
        status=GigStatus.PENDING,  # Needs admin approval
        is_verified=False,
        rating=0.0,
        total_reviews=0,
        total_consultations=0
    )

    db.add(db_gig)
    db.commit()
    db.refresh(db_gig)
    return db_gig

def get_gig(db: Session, gig_id: str) -> Optional[Gig]:
    """Get a gig by ID"""
    return db.query(Gig).filter(Gig.id == gig_id).first()

def get_gig_by_expert(db: Session, expert_id: str) -> Optional[Gig]:
    """Get gig by expert ID (assuming one gig per expert)"""
    return db.query(Gig).filter(Gig.expert_id == expert_id).first()

def update_gig(db: Session, gig_id: str, gig_update: GigUpdate) -> Optional[Gig]:
    """Update a gig"""
    db_gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not db_gig:
        return None

    # Update only provided fields
    update_data = gig_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(db_gig, field):
            setattr(db_gig, field, value)

    db.commit()
    db.refresh(db_gig)
    return db_gig

def update_gig_status(db: Session, gig_id: str, status_update: GigStatusUpdate) -> Optional[Gig]:
    """Update gig status (admin function)"""
    db_gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not db_gig:
        return None
    
    db_gig.status = GigStatus(status_update.status.value)
    
    # Set approval timestamp if approved
    if status_update.status == GigStatusEnum.APPROVED:
        from datetime import datetime
        db_gig.approved_at = datetime.utcnow()
        db_gig.is_verified = True
    
    db.commit()
    db.refresh(db_gig)
    return db_gig

def delete_gig(db: Session, gig_id: str) -> bool:
    """Delete a gig"""
    db_gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not db_gig:
        return False

    db.delete(db_gig)
    db.commit()
    return True

def get_gigs_by_expert(db: Session, expert_id: str) -> List[Gig]:
    """Get all gigs by expert ID"""
    return db.query(Gig).filter(Gig.expert_id == expert_id).all()

def get_gigs_filtered(
    db: Session, 
    filters: GigFilters,
    skip: int = 0, 
    limit: int = 100
) -> List[Gig]:
    """Get gigs with filtering and pagination"""
    query = db.query(Gig)
    
    # Apply filters
    if filters.category:
        query = query.filter(Gig.category == ExpertCategory(filters.category.value))
    
    if filters.min_rate is not None:
        query = query.filter(Gig.hourly_rate >= filters.min_rate)
    
    if filters.max_rate is not None:
        query = query.filter(Gig.hourly_rate <= filters.max_rate)
    
    if filters.min_rating is not None:
        query = query.filter(Gig.rating >= filters.min_rating)
    
    if filters.languages:
        # Check if any of the requested languages are in the gig's languages array
        for lang in filters.languages:
            query = query.filter(Gig.languages.contains([lang]))
    
    if filters.search_query:
        search_term = f"%{filters.search_query}%"
        query = query.filter(
            or_(
                Gig.name.ilike(search_term),
                Gig.title.ilike(search_term),
                Gig.bio.ilike(search_term),
                Gig.service_description.ilike(search_term)
            )
        )
    
    if filters.status:
        query = query.filter(Gig.status == GigStatus(filters.status.value))
    
    return query.offset(skip).limit(limit).all()

def get_gigs_count(db: Session, filters: GigFilters = None) -> int:
    """Get total count of gigs matching filters"""
    query = db.query(Gig)
    
    if filters:
        if filters.category:
            query = query.filter(Gig.category == ExpertCategory(filters.category.value))
        if filters.min_rate is not None:
            query = query.filter(Gig.hourly_rate >= filters.min_rate)
        if filters.max_rate is not None:
            query = query.filter(Gig.hourly_rate <= filters.max_rate)
        if filters.min_rating is not None:
            query = query.filter(Gig.rating >= filters.min_rating)
        if filters.status:
            query = query.filter(Gig.status == GigStatus(filters.status.value))
    
    return query.count()

def get_pending_gigs(db: Session, skip: int = 0, limit: int = 100) -> List[Gig]:
    """Get gigs pending approval (admin function)"""
    return db.query(Gig).filter(
        Gig.status == GigStatus.PENDING
    ).offset(skip).limit(limit).all()

def update_gig_metrics(db: Session, gig_id: str, rating: float = None, add_consultation: bool = False) -> Optional[Gig]:
    """Update gig metrics (rating, consultation count)"""
    db_gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not db_gig:
        return None
    
    if rating is not None:
        # Update rating (simplified - should be weighted average in real implementation)
        db_gig.total_reviews += 1
        db_gig.rating = ((db_gig.rating * (db_gig.total_reviews - 1)) + rating) / db_gig.total_reviews
    
    if add_consultation:
        db_gig.total_consultations += 1
    
    db.commit()
    db.refresh(db_gig)
    return db_gig