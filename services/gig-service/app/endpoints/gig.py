from fastapi import APIRouter, Depends, status, HTTPException, Query
from app.db import schemas
from sqlalchemy.orm import Session

from typing import List, Optional
from app.db import crud, session
from app.utils.logger import get_logger

# Get logger for this module
logger = get_logger(__name__)

router = APIRouter()


@router.post("/", response_model=schemas.Gig, status_code=status.HTTP_201_CREATED)
def create_new_gig(
        gig: schemas.GigCreate,
        db: Session = Depends(session.get_db),
        current_user_id: str = Depends(session.get_current_user_id)  # Changed to str
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
        logger.info(f"Gig creation completed: {db_gig.id}")  # Changed from print to logger

        # We need to fetch the complete gig with relationship data for the response
        # Because the crud.create_gig doesn't populate the relationship
        complete_gig = crud.get_gig(db=db, gig_id=db_gig.id)
        return complete_gig

    except Exception as e:
        logger.error(f"Error in create_new_gig for user {current_user_id}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create gig: {str(e)}")


@router.get("/public", response_model=schemas.GigListResponse)
def get_public_gigs(
        category_id: Optional[str] = Query(None),  # Added Optional
        min_rate: Optional[float] = Query(None, ge=0),
        max_rate: Optional[float] = Query(None, ge=0),
        search_query: Optional[str] = Query(None, max_length=100),
        min_experience_years: Optional[int] = Query(None, ge=0),
        page: int = Query(1, ge=1),
        size: int = Query(10, ge=1, le=100),
        db: Session = Depends(session.get_db)
):
    """
    Get public gigs for category/search pages.
    This feeds the Category.tsx component.
    """
    logger.info(f"Fetching public gigs: category_id={category_id}, min_rate={min_rate}, max_rate={max_rate}, search_query={search_query}, min_experience_years={min_experience_years}, page={page}, size={size}")
    filters = schemas.GigFilters(
        category_id=category_id,
        min_rate=min_rate,
        max_rate=max_rate,
        search_query=search_query,
        status=schemas.GigStatus.ACTIVE,  # Only show active gigs
        min_experience_years=min_experience_years
    )

    skip = (page - 1) * size
    gigs = crud.get_gigs_filtered(db=db, filters=filters, skip=skip, limit=size)
    total = crud.get_gigs_count(db=db, filters=filters)
    pages = (total + size - 1) // size
    logger.info(f"Public gigs fetched: count={len(gigs)}, total={total}, pages={pages}")
    return schemas.GigListResponse(
        gigs=gigs,
        total=total,
        page=page,
        size=size,
        pages=pages  # Added missing pages field
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
        logger.warning(f"Gig not found for gig ID: {gig_id}")
        raise HTTPException(status_code=404, detail="Gig not found")

    # Only show approved/active gigs to public
    if db_gig.status not in [schemas.GigStatus.APPROVED, schemas.GigStatus.ACTIVE]:
        logger.warning(f"Gig with ID {gig_id} is not available (status: {db_gig.status})")
        raise HTTPException(status_code=404, detail="Gig not available")

    logger.info(f"Gig details returned for gig ID: {gig_id}")
    return db_gig


@router.get("/", response_model=List[schemas.Gig])  # Fixed response model
def get_all_gigs(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        db: Session = Depends(session.get_db)
):
    """
    Get all gigs with pagination.
    """
    logger.info(f"Fetching all gigs with skip={skip}, limit={limit}")
    gigs = crud.get_all_gigs(db=db, skip=skip, limit=limit)

    def enrich_gig(gig):
        gig_dict = gig.__dict__.copy() if hasattr(gig, '__dict__') else dict(gig)
        gig_dict["bio"] = "Experienced expert in the field. Contact for more info."
        gig_dict["banner_image_url"] = "/logo.png"
        gig_dict["profile_image_url"] = "/favicon.png"
        gig_dict["name"] = "Expert Name"
        gig_dict["title"] = "Professional Consultant"
        gig_dict["rating"] = "4.8"
        gig_dict["total_reviews"] = "12"
        gig_dict["total_consultations"] = "25"
        return gig_dict

    enriched_gigs = [enrich_gig(g) for g in gigs]
    logger.info(f"All gigs fetched: count={len(enriched_gigs)}")
    return enriched_gigs


@router.get("/expert/{expert_id}", response_model=schemas.Gig)  # New endpoint for expert gigs
def get_gig_by_expert(
        expert_id: str,
        db: Session = Depends(session.get_db)
):
    """
    Get gig by expert Firebase UID.
    Used for expert profile lookups.
    """
    logger.info(f"Fetching gig for expert ID: {expert_id}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        logger.warning(f"Expert gig not found for expert ID: {expert_id}")
        raise HTTPException(status_code=404, detail="Expert gig not found")

    if db_gig.status not in [schemas.GigStatus.APPROVED, schemas.GigStatus.ACTIVE]:
        logger.warning(f"Expert profile not available for expert ID: {expert_id} (status: {db_gig.status})")
        raise HTTPException(status_code=404, detail="Expert profile not available")

    logger.info(f"Expert gig returned for expert ID: {expert_id}")
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
    logger.info(f"Fetching gig for current user ID: {current_user_id}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=current_user_id)
    if not db_gig:
        logger.warning(f"No gig found for current user ID: {current_user_id}")
        raise HTTPException(status_code=404, detail="No gig found for this expert")
    logger.info(f"Gig returned for current user ID: {current_user_id}")
    return db_gig


@router.put("/my/gig", response_model=schemas.GigPrivateResponse)
def update_my_gig(
        gig_update: schemas.GigUpdate,
        db: Session = Depends(session.get_db),
        current_user_id: str = Depends(session.get_current_user_id)  # Changed to str
):
    """
    Update expert's own gig.
    """
    # First get the gig to ensure it belongs to the current user
    logger.info(f"Updating gig for current user ID: {current_user_id}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=current_user_id)
    if not db_gig:
        logger.warning(f"No gig found for current user ID: {current_user_id}")
        raise HTTPException(status_code=404, detail="No gig found for this expert")

    updated_gig = crud.update_gig(db=db, gig_id=db_gig.id, gig_update=gig_update)
    if not updated_gig:
        logger.error(f"Failed to update gig for current user ID: {current_user_id}")
        raise HTTPException(status_code=404, detail="Failed to update gig")

    logger.info(f"Gig updated for current user ID: {current_user_id}")
    return updated_gig


@router.delete("/my/gig", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_gig(
        db: Session = Depends(session.get_db),
        current_user_id: str = Depends(session.get_current_user_id)  # Changed to str
):
    """
    Delete expert's own gig.
    """
    # First get the gig to ensure it belongs to the current user
    logger.info(f"Deleting gig for current user ID: {current_user_id}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=current_user_id)
    if not db_gig:
        logger.warning(f"No gig found for current user ID: {current_user_id}")
        raise HTTPException(status_code=404, detail="No gig found for this expert")

    success = crud.delete_gig(db=db, gig_id=db_gig.id)
    if not success:
        logger.error(f"Failed to delete gig for current user ID: {current_user_id}")
        raise HTTPException(status_code=500, detail="Failed to delete gig")

    logger.info(f"Gig deleted for current user ID: {current_user_id}")
    return None  # 204 No Content response
