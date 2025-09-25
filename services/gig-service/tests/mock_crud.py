"""
Module that provides mock implementations of the CRUD operations to work with test models
"""
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.schemas import GigCreate, GigUpdate, GigFilters, CategoryCreate
from app.db.models import GigStatus
from tests.conftest import Category, Gig


def create_category(db: Session, category: CategoryCreate) -> Category:
    """Creates a new category in the database."""
    db_category = Category(name=category.name, slug=category.slug)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_all_categories(db: Session, skip: int = 0, limit: int = 100) -> list[Category]:
    """Retrieves a list of all categories."""
    return db.query(Category).offset(skip).limit(limit).all()


def get_category(db: Session, category_id: str) -> Optional[Category]:
    """
    Retrieves a single category by its ID or slug.
    First try by ID, then by slug if nothing is found.
    """
    # Try by ID first
    category = db.query(Category).filter(Category.id == category_id).first()
    
    # If not found, try by slug
    if not category:
        category = db.query(Category).filter(Category.slug == category_id).first()
    
    return category


def create_gig(db: Session, gig: GigCreate, expert_id: str) -> Gig:
    """Creates a new gig for a specific expert."""
    # Convert Pydantic model to dict, excluding any None values
    gig_data = {k: v for k, v in gig.dict().items() if v is not None and k != 'category_id'}
    
    # Get category by ID or slug
    category = get_category(db, str(gig.category_id))
    if not category:
        raise ValueError(f"Category with ID/slug {gig.category_id} not found")
    
    # Create the gig using our test model with the expertise_areas property
    db_gig = Gig(
        expert_id=expert_id,
        category_id=category.id,
        status=GigStatus.DRAFT,
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


def get_gigs_by_expert(db: Session, expert_id: str, skip: int = 0, limit: int = 100) -> List[Gig]:
    """Retrieves gigs for a specific expert."""
    return db.query(Gig).filter(Gig.expert_id == expert_id).offset(skip).limit(limit).all()


def update_gig(db: Session, gig_id: str, gig_update: GigUpdate) -> Optional[Gig]:
    """Updates an existing gig."""
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        return None
    
    # Convert Pydantic model to dict, excluding any None values
    gig_data = {k: v for k, v in gig_update.dict().items() if v is not None}
    
    # Update the gig fields
    for key, value in gig_data.items():
        if key == "category_id":
            category = get_category(db, str(value))
            if not category:
                raise ValueError(f"Category with ID/slug {value} not found")
            setattr(db_gig, key, category.id)
        else:
            setattr(db_gig, key, value)
    
    db.commit()
    db.refresh(db_gig)
    return db_gig


def update_gig_status(db: Session, gig_id: str, status: GigStatus) -> Optional[Gig]:
    """Updates the status of a gig."""
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        return None
    
    db_gig.status = status
    db.commit()
    db.refresh(db_gig)
    return db_gig


def delete_gig(db: Session, gig_id: str) -> bool:
    """Deletes a gig."""
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        return False
    
    db.delete(db_gig)
    db.commit()
    return True


def get_gigs_filtered(db: Session, filters: GigFilters, skip: int = 0, limit: int = 100) -> List[Gig]:
    """Retrieves gigs with the specified filters."""
    query = db.query(Gig)
    
    # Apply filters
    if filters.category_id:
        category = get_category(db, str(filters.category_id))
        if category:
            query = query.filter(Gig.category_id == category.id)
    
    if filters.min_rate is not None:
        query = query.filter(Gig.hourly_rate >= filters.min_rate)
    
    if filters.max_rate is not None:
        query = query.filter(Gig.hourly_rate <= filters.max_rate)
    
    if filters.status:
        query = query.filter(Gig.status == filters.status)
    
    if filters.min_experience_years is not None:
        query = query.filter(Gig.experience_years >= filters.min_experience_years)
    
    if filters.search_query:
        # For the test, we'll just check service_description
        query = query.filter(Gig.service_description.contains(filters.search_query))
    
    return query.offset(skip).limit(limit).all()


def get_gigs_count(db: Session, filters: GigFilters) -> int:
    """Gets the count of gigs with the specified filters."""
    query = db.query(Gig)
    
    # Apply filters (same as get_gigs_filtered)
    if filters.category_id:
        category = get_category(db, str(filters.category_id))
        if category:
            query = query.filter(Gig.category_id == category.id)
    
    if filters.min_rate is not None:
        query = query.filter(Gig.hourly_rate >= filters.min_rate)
    
    if filters.max_rate is not None:
        query = query.filter(Gig.hourly_rate <= filters.max_rate)
    
    if filters.status:
        query = query.filter(Gig.status == filters.status)
    
    if filters.min_experience_years is not None:
        query = query.filter(Gig.experience_years >= filters.min_experience_years)
    
    if filters.search_query:
        # For the test, we'll just check service_description
        query = query.filter(Gig.service_description.contains(filters.search_query))
    
    return query.count()
