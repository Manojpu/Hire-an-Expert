import uuid
from datetime import datetime
from typing import List, Optional, Any
from sqlalchemy.orm import Session , joinedload
from sqlalchemy import or_

# Import the correct models and schemas for your new structure
from .models import Gig, Category, GigStatus, Certification
from .schemas import GigCreate, GigUpdate, GigFilters, CategoryCreate
from app.utils.logger import get_logger

# Get logger for this module
logger = get_logger(__name__)




def create_category(db: Session, category: CategoryCreate) -> Category:
    """Creates a new category in the database."""
    logger.info(f"Creating new category: {category.name}")
    db_category = Category(name=category.name, slug=category.slug)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    logger.info(f"Category created with ID: {db_category.id}")
    return db_category

def get_all_categories(db: Session, skip: int = 0, limit: int = 100) -> list[type[Category]]:
    """Retrieves a list of all categories."""
    logger.info(f"Retrieving all categories with skip={skip}, limit={limit}")
    categories = db.query(Category).offset(skip).limit(limit).all()
    logger.info(f"Retrieved {len(categories)} categories")
    return categories

def get_category(db: Session, category_id: str) -> Optional[Category]:
    """
    Retrieves a single category by its ID or slug.
    If category_id is a UUID, search by ID.
    If category_id is a string that's not a valid UUID, search by slug.
    """
    logger.info(f"Retrieving category with ID or slug: {category_id}")
    
    # Try to parse as UUID first
    try:
        # If it's a valid UUID, search by ID
        uuid_obj = uuid.UUID(category_id)
        category = db.query(Category).filter(Category.id == uuid_obj).first()
    except (ValueError, TypeError):
        # If it's not a valid UUID, search by slug
        logger.info(f"Category ID {category_id} is not a valid UUID, searching by slug instead")
        category = db.query(Category).filter(Category.slug == category_id).first()
    
    if category:
        logger.info(f"Category found: {category.name}")
    else:
        logger.warning(f"Category with ID/slug {category_id} not found")
    
    return category




def create_gig(db: Session, gig: GigCreate, expert_id: str) -> Gig:
    """Creates a new gig for a specific expert."""
    logger.info(f"Creating new gig for expert ID: {expert_id}")
    logger.debug(f"Gig data: {gig.dict()}")
    
    # Convert Pydantic model to dict, excluding any None values
    gig_data = {k: v for k, v in gig.dict().items() if v is not None and k != 'category_id'}
    
    # Get category by ID or slug
    category = get_category(db, str(gig.category_id))
    if not category:
        logger.error(f"Category with ID/slug {gig.category_id} not found")
        raise ValueError(f"Category with ID/slug {gig.category_id} not found")
    
    gig_id = str(uuid.uuid4())
    db_gig = Gig(
        id=gig_id,
        expert_id=expert_id,
        category_id=category.id,  # Use the actual UUID from the retrieved category
        status=GigStatus.DRAFT,  # Gigs start as drafts by default
        currency="LKR",
        response_time="< 24 hours",
        **gig_data
    )
    db.add(db_gig)
    db.commit()
    db.refresh(db_gig)
    logger.info(f"Gig created successfully with ID: {gig_id}")
    return db_gig

def get_gig(db: Session, gig_id: str) -> Optional[Gig]:
    """Retrieves a single gig by its ID."""
    logger.info(f"Retrieving gig with ID: {gig_id}")
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if gig:
        logger.info(f"Gig found with ID: {gig_id}")
    else:
        logger.warning(f"Gig with ID {gig_id} not found")
    return gig

def get_gigs_by_expert(db: Session, expert_id: str, skip: int = 0, limit: int = 100) -> list[type[Gig]]:
    """Retrieves all gigs created by a specific expert."""
    logger.info(f"Retrieving gigs for expert ID: {expert_id} with skip={skip}, limit={limit}")
    gigs = (db.query(Gig)
            .options(joinedload(Gig.category))
            .filter(Gig.expert_id == expert_id)
            .offset(skip)
            .limit(limit)
            .all())
    logger.info(f"Found {len(gigs)} gigs for expert ID: {expert_id}")
    return gigs

def get_gig_by_expert(db: Session, expert_id: str) -> Optional[Gig]:
    """Retrieves a single gig by expert ID (since one expert can have only one gig)."""
    logger.info(f"Retrieving gig for expert ID: {expert_id}")
    gig = (db.query(Gig)
           .options(joinedload(Gig.category))
           .filter(Gig.expert_id == expert_id)
           .first())
    if gig:
        logger.info(f"Found gig ID: {gig.id} for expert ID: {expert_id}")
    else:
        logger.info(f"No gig found for expert ID: {expert_id}")
    return gig

def update_gig(db: Session, gig_id: str, gig_update: GigUpdate) -> Optional[Gig]:
    """Updates an existing gig."""
    logger.info(f"Updating gig with ID: {gig_id}")
    logger.debug(f"Update data: {gig_update.dict(exclude_unset=True)}")
    
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        logger.warning(f"Cannot update - gig with ID {gig_id} not found")
        return None

    update_data = gig_update.dict(exclude_unset=True)
    
    # Handle category_id separately if provided
    if 'category_id' in update_data:
        category_id_or_slug = update_data.pop('category_id')
        if category_id_or_slug:
            category = get_category(db, str(category_id_or_slug))
            if category:
                db_gig.category_id = category.id
            else:
                logger.warning(f"Category with ID/slug {category_id_or_slug} not found, skipping category update")
    
    # Update other fields
    for field, value in update_data.items():
        setattr(db_gig, field, value)
    
    db_gig.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_gig)
    logger.info(f"Gig ID: {gig_id} updated successfully")
    return db_gig

def update_gig_status(db: Session, gig_id: str, status_update) -> Optional[Gig]:
    """Updates the status of a specific gig."""
    logger.info(f"Updating status for gig ID: {gig_id} to {status_update.status}")
    
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        logger.warning(f"Cannot update status - gig with ID {gig_id} not found")
        return None
    
    old_status = db_gig.status
    db_gig.status = status_update.status
    
    # If the gig is being approved, update the approved_at timestamp
    if status_update.status == GigStatus.APPROVED:
        logger.info(f"Gig ID: {gig_id} is being approved, updating approved_at timestamp")
        db_gig.approved_at = datetime.utcnow()
        
    db.commit()
    db.refresh(db_gig)
    logger.info(f"Gig ID: {gig_id} status updated from {old_status} to {db_gig.status}")
    return db_gig

def update_gig_metrics(db: Session, gig_id: str, rating: Optional[float] = None, add_consultation: bool = False) -> Optional[Gig]:
    """Updates the metrics for a gig (ratings, consultation count)."""
    logger.info(f"Updating metrics for gig ID: {gig_id}")
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        logger.warning(f"Cannot update metrics - gig with ID {gig_id} not found")
        return None
    # Placeholder for future metrics logic
    db.commit()
    db.refresh(db_gig)
    logger.info(f"Metrics updated for gig ID: {gig_id}")
    return db_gig

def delete_gig(db: Session, gig_id: str) -> bool:
    """Deletes a gig from the database."""
    logger.info(f"Deleting gig with ID: {gig_id}")
    db_gig = get_gig(db, gig_id)
    if not db_gig:
        logger.warning(f"Cannot delete - gig with ID {gig_id} not found")
        return False
    db.delete(db_gig)
    db.commit()
    logger.info(f"Gig with ID: {gig_id} deleted successfully")
    return True

def get_gigs_filtered(
    db: Session, filters: GigFilters, skip: int = 0, limit: int = 100
) -> List[Gig]:
    """Retrieves a list of gigs based on filter criteria."""
    query = db.query(Gig).options(joinedload(Gig.category))

    if filters.category_id:
        # Get category by ID or slug
        category = get_category(db, filters.category_id)
        if category:
            query = query.filter(Gig.category_id == category.id)
        else:
            # If category is not found, return empty list
            logger.warning(f"Category with ID/slug {filters.category_id} not found, returning empty result")
            return []
    
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
    
    logger.info(f"Filtering gigs with filters: {filters.dict() if hasattr(filters, 'dict') else filters}, skip={skip}, limit={limit}")
    gigs = query.offset(skip).limit(limit).all()
    logger.info(f"Filtered gigs count: {len(gigs)}")
    return gigs

def get_gigs_count(db: Session, filters: GigFilters) -> int:
    """Gets the total count of gigs that match the filter criteria."""
    query = db.query(Gig)

    if filters.category_id:
        # Get category by ID or slug
        category = get_category(db, filters.category_id)
        if category:
            query = query.filter(Gig.category_id == category.id)
        else:
            # If category is not found, return 0
            logger.warning(f"Category with ID/slug {filters.category_id} not found, count is 0")
            return 0
    
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
        
    count = query.count()
    logger.info(f"Counted {count} gigs matching filters: {filters.dict() if hasattr(filters, 'dict') else filters}")
    return count

def get_pending_gigs(db: Session, skip: int = 0, limit: int = 100) -> List[Gig]:
    """Get all gigs with pending status (awaiting admin approval)"""
    logger.info(f"Retrieving pending gigs with skip={skip}, limit={limit}")
    gigs = db.query(Gig).filter(Gig.status == GigStatus.PENDING).offset(skip).limit(limit).all()
    logger.info(f"Found {len(gigs)} pending gigs")
    return gigs

def get_all_gigs(db: Session, skip: int = 0, limit: int = 100) -> list[type[Gig]]:
    """Retrieves all gigs with pagination, regardless of status.

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of Gig objects
    """
    logger.info(f"Retrieving all gigs with skip={skip}, limit={limit}")
    gigs = db.query(Gig).options(joinedload(Gig.category)).offset(skip).limit(limit).all()
    logger.info(f"Retrieved {len(gigs)} gigs")
    return gigs


def get_total_gigs_count(db: Session) -> int:
    """Get total count of all gigs."""
    logger.info("Getting total gigs count")
    count = db.query(Gig).count()
    logger.info(f"Total gigs count: {count}")
    return count


def get_gigs_analytics(db: Session, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[dict]:
    """Get cumulative gigs analytics data."""
    from sqlalchemy import func, text
    from datetime import datetime, timedelta
    
    logger.info(f"Getting cumulative gig analytics from {start_date} to {end_date}")
    
    # First, get all gigs data (not filtered by date range for cumulative calculation)
    base_query = """
    WITH daily_counts AS (
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as daily_count
        FROM gigs
        GROUP BY DATE(created_at)
    )
    SELECT 
        date,
        SUM(daily_count) OVER (ORDER BY date) as count
    FROM daily_counts
    ORDER BY date
    """
    
    result = db.execute(text(base_query))
    all_data = [{"date": row.date.isoformat(), "count": row.count} for row in result]
    
    # If no data, return empty
    if not all_data:
        logger.info("No analytics data found")
        return []
    
    # If no date filters, return all data
    if not start_date and not end_date:
        logger.info(f"Retrieved {len(all_data)} cumulative analytics data points")
        return all_data
    
    # Filter and fill the requested date range
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end_dt = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        # Create a dictionary for quick lookup
        data_dict = {datetime.strptime(dp["date"], '%Y-%m-%d').date(): dp["count"] for dp in all_data}
        
        # Get date range bounds
        all_dates = sorted(data_dict.keys())
        first_data_date = all_dates[0]
        last_data_date = all_dates[-1]
        
        # Determine the actual range to show
        range_start = start_dt if start_dt and start_dt >= first_data_date else first_data_date
        range_end = end_dt if end_dt else last_data_date
        
        # If start date is before any data, start from first data date
        if start_dt and start_dt < first_data_date:
            range_start = first_data_date
        
        # Get the cumulative count at the start of our range
        start_count = 0
        if range_start in data_dict:
            start_count = data_dict[range_start]
        else:
            # Find the cumulative count just before our start date
            for date in sorted(data_dict.keys()):
                if date < range_start:
                    start_count = data_dict[date]
                else:
                    break
        
        analytics_data = []
        current_date = range_start
        
        while current_date <= range_end:
            if current_date in data_dict:
                # Use actual data point
                count = data_dict[current_date]
            elif current_date <= last_data_date:
                # Use cumulative count from previous date
                prev_date = current_date - timedelta(days=1)
                count = analytics_data[-1]["count"] if analytics_data else start_count
            else:
                # After last data date, maintain the final count
                count = data_dict[last_data_date]
            
            analytics_data.append({
                "date": current_date.isoformat(),
                "count": count
            })
            
            current_date += timedelta(days=1)
        
        logger.info(f"Retrieved {len(analytics_data)} cumulative analytics data points (filtered range)")
        return analytics_data
        
    except ValueError as e:
        logger.error(f"Date parsing error: {e}")
        # Return filtered data if date parsing fails
        filtered_data = []
        for dp in all_data:
            dp_date = datetime.strptime(dp["date"], '%Y-%m-%d').date()
            if (not start_date or dp_date >= datetime.strptime(start_date, '%Y-%m-%d').date()) and \
               (not end_date or dp_date <= datetime.strptime(end_date, '%Y-%m-%d').date()):
                filtered_data.append(dp)
        
        logger.info(f"Retrieved {len(filtered_data)} cumulative analytics data points (fallback)")
        return filtered_data


    logger.info(f"Retrieved {len(analytics_data)} daily analytics data points")
    return analytics_data


def get_gig_certifications(db: Session, gig_id: str) -> List[Certification]:
    """Get all certifications for a specific gig."""
    logger.info(f"Retrieving certifications for gig: {gig_id}")
    certifications = db.query(Certification).filter(Certification.gig_id == gig_id).all()
    logger.info(f"Found {len(certifications)} certifications for gig: {gig_id}")
    return certifications
