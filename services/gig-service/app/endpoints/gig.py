from fastapi import APIRouter, Depends, status
from app.db import schemas
from sqlalchemy.orm import Session

from typing import List
from app.db import crud, session


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
    return crud.create_gig(db=db, gig=gig, expert_id=current_user_id)

@router.get("/{gig_id}", response_model=schemas.GigResponse)
def get_gig(
    gig_id: str,
    db: Session = Depends(session.get_db)
):
    """
    Get a gig by ID.
    """
    db_gig = crud.get_gig(db=db, gig_id=gig_id)
    if not db_gig:
        return {"error": "Gig not found"}, status.HTTP_404_NOT_FOUND
    return db_gig

# Endpoint to get a list of all gigs (Public)
@router.get("/", response_model=List[schemas.GigResponse])
def get_all_gigs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(session.get_db)
):
    """
    Get a list of all gigs with pagination.
    """
    return crud.get_gigs(db=db, skip=skip, limit=limit)


@router.put("/{gig_id}", response_model=schemas.GigResponse)
def update_gig(
    gig_id: str,
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