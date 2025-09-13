from fastapi import APIRouter, Depends, status, HTTPException, Query
from app.db import schemas
from sqlalchemy.orm import Session

from typing import List, Optional
from app.db import crud, session
from app.utils.logger import get_logger

# Get logger for this module
logger = get_logger(__name__)

router = APIRouter()

@router.post("/", response_model=schemas.GigResponse,status_code=status.HTTP_201_CREATED)
def create_new_gig(
    gig: schemas.GigCreate,
    db: Session = Depends(session.get_db),
    current_user_id: int = Depends(session.get_current_user_id)
):
    """
    Create a new gig.
    """
    try:
        logger.info(f"Creating new gig for expert: {current_user_id}")
        logger.debug(f"Gig data received: {gig.dict()}")
        
        # Check if category exists before creating gig
        category = crud.get_category(db, gig.category_id)
        if not category:
            logger.warning(f"Category with ID {gig.category_id} not found when creating gig for user {current_user_id}")
            raise HTTPException(status_code=404, detail=f"Category with ID {gig.category_id} not found")
            
        db_gig = crud.create_gig(db=db, gig=gig, expert_id=current_user_id)
        print(f"Gig creation completed: {db_gig.id}")
        
        # We need to fetch the complete gig with relationship data for the response
        # Because the crud.create_gig doesn't populate the relationship
        complete_gig = crud.get_gig(db=db, gig_id=db_gig.id)
        return complete_gig
        
    except Exception as e:
        logger.error(f"Error in create_expert_gig for user {current_user_id}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create gig: {str(e)}")

@router.get("/public", response_model=schemas.GigListResponse)
def get_public_gigs(
    category_id: str = Query(None),
    min_rate: Optional[float] = Query(None, ge=0),
    max_rate: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    search_query: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(session.get_db)
):
    """
    Get public gigs for category/search pages.
    This feeds the Category.tsx component.
    """
    filters = schemas.GigFilters(
        category_id=category_id,
        min_rate=min_rate,
        max_rate=max_rate,
        search_query=search_query,
        status=schemas.GigStatus.ACTIVE  # Only show active gigs
    )
    
    skip = (page - 1) * size
    gigs = crud.get_gigs_filtered(db=db, filters=filters, skip=skip, limit=size)
    total = crud.get_gigs_count(db=db, filters=filters)
    pages = (total + size - 1) // size
    
    return schemas.GigListResponse(
        gigs=gigs,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{gig_id}", response_model=schemas.GigDetailResponse)
def get_gig_detail(
    gig_id: str,
    db: Session = Depends(session.get_db)
):
    """
    Get a gig by ID.
    """
    logger.info(f"Fetching gig details for gig ID: {gig_id}")
    db_gig = crud.get_gig(db=db, gig_id=gig_id)
    if not db_gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    
    # Only show approved/active gigs to public
    if db_gig.status not in [schemas.GigStatus.APPROVED, schemas.GigStatus.ACTIVE]:
        raise HTTPException(status_code=404, detail="Gig not available")
    
    return db_gig

# Endpoint to get a list of all gigs (Public)
@router.get("/", response_model=List[schemas.GigResponse])
def get_all_gigs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(session.get_db)
):
    """
    Get gig by expert Firebase UID.
    Used for expert profile lookups.
    """
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        raise HTTPException(status_code=404, detail="Expert gig not found")
    
    if db_gig.status not in [schemas.GigStatus.APPROVED, schemas.GigStatus.ACTIVE]:
        raise HTTPException(status_code=404, detail="Expert profile not available")
    
    return db_gig

@router.get("/my/gig", response_model=schemas.GigPrivateResponse)
def get_my_gig(
    db: Session = Depends(session.get_db),
    current_user_id: str = Depends(session.get_current_user_id)
):
    """
    Get expert's own gig for dashboard management.
    This feeds the ExpertDashboard components.
    """
    db_gig = crud.get_gig_by_expert(db=db, expert_id=current_user_id)
    if not db_gig:
        raise HTTPException(status_code=404, detail="No gig found for this expert")
    
    return db_gig

@router.put("/my/gig", response_model=schemas.GigPrivateResponse)
def update_my_gig(
    gig_update: schemas.GigUpdate,
    db: Session = Depends(session.get_db),
    current_user_id: int = Depends(session.get_current_user_id)
):
    """
    Update a gig by ID.
    """
    db_gig = crud.update_gig(db=db, gig_id=gig_id, gig_update=gig_update)
    if not db_gig:
        return {"error": "Gig not found"}, status.HTTP_404_NOT_FOUND
    return db_gig

@router.delete("/{gig_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gig(
    gig_id: str,
    db: Session = Depends(session.get_db),
    current_user_id: int = Depends(session.get_current_user_id)
):
    """
    Delete a gig by ID.
    """
    success = crud.delete_gig(db=db, gig_id=gig_id)
    if not success:
        return {"error": "Gig not found"}, status.HTTP_404_NOT_FOUND
    return {"message": "Gig deleted successfully"}