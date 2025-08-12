from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import os
from dotenv import load_dotenv
from typing import List
from app.db.database import get_db
from app.schemas.review import ReviewCreate, ReviewOut
from app.crud import review as review_crud
from app.core.auth import get_current_user, TokenData
load_dotenv()

router = APIRouter()
BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8003")