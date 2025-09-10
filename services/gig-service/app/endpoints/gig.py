from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.db import schemas
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import crud, session

router = APIRouter()

@router.post("/", response_model=schemas.GigPrivateResponse, status_code=status.HTTP_201_CREATED)
def create_expert_gig(
    gig: schemas.GigCreate,
    db: Session = Depends(session.get_db),
    current_user_id: str = Depends(session.get_current_user_id)  # Firebase UID
):
    """
    Create a new expert gig/profile from application.
    This corresponds to the ApplyExpert form submission.
    """
    try:
        print(f"Creating gig for expert: {current_user_id}")
        db_gig = crud.create_gig(db=db, gig=gig, expert_id=current_user_id)
        print(f"Gig creation completed: {db_gig.id}")
        return db_gig
        
    except Exception as e:
        print(f"Error in create_expert_gig: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create gig: {str(e)}")

@router.get("/public", response_model=schemas.GigListResponse)
def get_public_gigs(
    category: Optional[schemas.ExpertCategoryEnum] = None,
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
        category=category,
        min_rate=min_rate,
        max_rate=max_rate,
        min_rating=min_rating,
        search_query=search_query,
        status=schemas.GigStatusEnum.ACTIVE  # Only show active gigs
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
    Get detailed gig information for expert profile page.
    This feeds the Expert.tsx component.
    """
    db_gig = crud.get_gig(db=db, gig_id=gig_id)
    if not db_gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    
    # Only show approved/active gigs to public
    if db_gig.status not in [schemas.GigStatusEnum.APPROVED.value, schemas.GigStatusEnum.ACTIVE.value]:
        raise HTTPException(status_code=404, detail="Gig not available")
    
    return db_gig

@router.get("/expert/{expert_id}", response_model=schemas.GigDetailResponse)
def get_gig_by_expert_id(
    expert_id: str,
    db: Session = Depends(session.get_db)
):
    """
    Get gig by expert Firebase UID.
    Used for expert profile lookups.
    """
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        raise HTTPException(status_code=404, detail="Expert gig not found")
    
    if db_gig.status not in [schemas.GigStatusEnum.APPROVED.value, schemas.GigStatusEnum.ACTIVE.value]:
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
    current_user_id: str = Depends(session.get_current_user_id)
):
    """
    Update expert's own gig.
    Used in expert dashboard for profile management.
    """
    # First find the expert's gig
    db_gig = crud.get_gig_by_expert(db=db, expert_id=current_user_id)
    if not db_gig:
        raise HTTPException(status_code=404, detail="No gig found for this expert")
    
    updated_gig = crud.update_gig(db=db, gig_id=db_gig.id, gig_update=gig_update)
    if not updated_gig:
        raise HTTPException(status_code=404, detail="Failed to update gig")
    
    return updated_gig

@router.delete("/my/gig", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_gig(
    db: Session = Depends(session.get_db),
    current_user_id: str = Depends(session.get_current_user_id)
):
    """
    Delete expert's own gig.
    """
    db_gig = crud.get_gig_by_expert(db=db, expert_id=current_user_id)
    if not db_gig:
        raise HTTPException(status_code=404, detail="No gig found for this expert")
    
    success = crud.delete_gig(db=db, gig_id=db_gig.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete gig")

# Admin endpoints
@router.get("/admin/pending", response_model=List[schemas.GigPrivateResponse])
def get_pending_gigs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(session.get_db),
    # Add admin authentication here
):
    """
    Get gigs pending approval (admin only).
    """
    skip = (page - 1) * size
    return crud.get_pending_gigs(db=db, skip=skip, limit=size)

@router.patch("/admin/{gig_id}/status", response_model=schemas.GigDetailResponse)
def update_gig_status(
    gig_id: str,
    status_update: schemas.GigStatusUpdate,
    db: Session = Depends(session.get_db),
    # Add admin authentication here
):
    """
    Update gig status (admin only).
    Used for approving/rejecting expert applications.
    """
    updated_gig = crud.update_gig_status(db=db, gig_id=gig_id, status_update=status_update)
    if not updated_gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    
    return updated_gig

@router.patch("/{gig_id}/metrics", response_model=schemas.GigDetailResponse)
def update_gig_metrics(
    gig_id: str,
    rating: Optional[float] = Query(None, ge=0, le=5),
    add_consultation: bool = Query(False),
    db: Session = Depends(session.get_db)
):
    """
    Update gig metrics (rating, consultation count).
    Called from booking/review services.
    """
    updated_gig = crud.update_gig_metrics(
        db=db, 
        gig_id=gig_id, 
        rating=rating, 
        add_consultation=add_consultation
    )
    if not updated_gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    
    return updated_gig