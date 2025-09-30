
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.db import schemas
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import crud, session

router = APIRouter()

# create category
@router.post("/", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(session.get_db),
):
    """
    Create a new category.
    """
    try:
        db_category = crud.create_category(db=db, category=category)
        return db_category
    except Exception as e:
        print(f"Error in create_category: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")
    

# get all categories
@router.get("/categories", response_model=List[schemas.Category])
def get_all_categories(db: Session = Depends(session.get_db)):
    """
    Get all categories.
    """
    categories = crud.get_all_categories(db=db)
    return categories   