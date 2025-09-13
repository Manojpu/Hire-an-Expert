import uuid
from datetime import datetime
from typing import List, Optional, Any
from sqlalchemy.orm import Session , joinedload
from sqlalchemy import or_

# Import the correct models and schemas for your new structure
from .models import Gig, Category, GigStatus
from .schemas import GigCreate, GigUpdate, GigFilters, CategoryCreate




def create_category(db: Session, category: CategoryCreate) -> Category:
    """Creates a new category in the database."""
    db_category = Category(name=category.name, slug=category.slug)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_all_categories(db: Session, skip: int = 0, limit: int = 100) -> list[type[Category]]:
    """Retrieves a list of all categories."""
    return db.query(Category).offset(skip).limit(limit).all()

def get_category(db: Session, category_id: uuid.UUID) -> Optional[Category]:
    """Retrieves a single category by its ID."""
    return db.query(Category).filter(Category.id == category_id).first()




def create_gig(db: Session, gig: GigCreate, expert_id: str) -> Gig:
    """Creates a new gig for a specific expert."""
    # Convert Pydantic model to dict, excluding any None values
    gig_data = {k: v for k, v in gig.dict().items() if v is not None}
    
    db_gig = Gig(
        id=str(uuid.uuid4()),
        expert_id=expert_id,
        status=GigStatus.DRAFT,  # Gigs start as drafts by default
        currency="LKR",
        response_time="< 24 hours",
        **gig_data
    )
    db.add(db_gig)
    db.commit()
    db.refresh(db_gig)
    return db_gig

def get_gig(db: Session, gig_id: str) -> Optional[Gig]:
    """Retrieves a single gig by its ID."""
    return db.query(Gig).filter(Gig.id == gig_id).first()

def get_gigs_by_expert(db: Session, expert_id: str, skip: int = 0, limit: int = 100) -> list[type[Gig]]:
    """Retrieves all gigs created by a specific expert."""
    return db.query(Gig).filter(Gig.expert_id == expert_id).offset(skip).limit(limit).all()

def get_gig_by_expert(db: Session, expert_id: str) -> Optional[Gig]:
    """Retrieves a single gig by expert ID (since one expert can have only one gig)."""
    return db.query(Gig).filter(Gig.expert_id == expert_id).first()

def update_gig(db: Session, gig_id: str, gig_update: GigUpdate) -> Optional[Gig]:
    """Updates an existing gig."""
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        return None

    update_data = gig_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_gig, field, value)
    
    db_gig.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_gig)
    return db_gig

def update_gig_status(db: Session, gig_id: str, status_update) -> Optional[Gig]:
    """Updates the status of a specific gig."""
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        return None
    
    db_gig.status = status_update.status
    
    # If the gig is being approved, update the approved_at timestamp
    if status_update.status == GigStatus.APPROVED:
        db_gig.approved_at = datetime.utcnow()
        
    db.commit()
    db.refresh(db_gig)
    return db_gig

def update_gig_metrics(db: Session, gig_id: str, rating: Optional[float] = None, add_consultation: bool = False) -> Optional[Gig]:
    """Updates the metrics for a gig (ratings, consultation count)."""
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        return None
    
    # Currently this is a placeholder - if we want to add metrics in the future
    # We would add fields like total_ratings, rating_sum, consultation_count, etc.
    # to the Gig model and update them here.
    
    db.commit()
    db.refresh(db_gig)
    return db_gig

def delete_gig(db: Session, gig_id: str) -> bool:
    """Deletes a gig from the database."""
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        return False

    db.delete(db_gig)
    db.commit()
    return True

def get_gigs_filtered(
    db: Session, filters: GigFilters, skip: int = 0, limit: int = 100
) -> List[Gig]:
    """Retrieves a list of gigs based on filter criteria."""
    query = db.query(Gig).options(joinedload(Gig.category))

    if filters.category_id:
        query = query.filter(Gig.category_id == filters.category_id)
    
    if filters.min_rate is not None:
        query = query.filter(Gig.hourly_rate >= filters.min_rate)
    
    if filters.max_rate is not None:
        query = query.filter(Gig.hourly_rate <= filters.max_rate)
        
    if filters.min_experience_years is not None:
        query = query.filter(Gig.experience_years >= filters.min_experience_years)

    if filters.search_query:
        search_term = f"%{filters.search_query}%"
        query = query.filter(Gig.service_description.ilike(search_term))
    
    if filters.status:
        query = query.filter(Gig.status == filters.status)
    
    return query.offset(skip).limit(limit).all()

def get_gigs_count(db: Session, filters: GigFilters) -> int:
    """Gets the total count of gigs that match the filter criteria."""
    query = db.query(Gig)

    if filters.category_id:
        query = query.filter(Gig.category_id == filters.category_id)
    
    if filters.min_rate is not None:
        query = query.filter(Gig.hourly_rate >= filters.min_rate)
    
    if filters.max_rate is not None:
        query = query.filter(Gig.hourly_rate <= filters.max_rate)
        
    if filters.min_experience_years is not None:
        query = query.filter(Gig.experience_years >= filters.min_experience_years)

    if filters.search_query:
        search_term = f"%{filters.search_query}%"
        query = query.filter(Gig.service_description.ilike(search_term))
    
    if filters.status:
        query = query.filter(Gig.status == filters.status)
        
    return query.count()

def get_pending_gigs(db: Session, skip: int = 0, limit: int = 100) -> List[Gig]:
    """Get all gigs with pending status (awaiting admin approval)"""
    return db.query(Gig).filter(Gig.status == GigStatus.PENDING).offset(skip).limit(limit).all()