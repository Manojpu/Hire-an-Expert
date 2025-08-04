"""
Endpoints for testing the API without requiring real authentication.
These endpoints should not be exposed in production.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.core.test_config import is_testing_mode, TEST_USER
from app.utils.test_utils import create_test_token
from app.core.auth import TokenData

router = APIRouter()

@router.get("/token", summary="Get a test JWT token")
def get_test_token():
    """
    Get a test JWT token for authentication.
    This endpoint is only available when TESTING_MODE is enabled.
    """
    if not is_testing_mode():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test endpoints are disabled. Set TESTING_MODE=True to enable."
        )
    
    token = create_test_token()
    return {
        "access_token": token,
        "token_type": "bearer",
        "test_user": TEST_USER
    }

@router.get("/user", summary="Get test user data")
def get_test_user():
    """
    Returns information about the test user.
    This endpoint is only available when TESTING_MODE is enabled.
    """
    if not is_testing_mode():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test endpoints are disabled. Set TESTING_MODE=True to enable."
        )
    
    return {
        "user": TEST_USER,
        "testing_mode": is_testing_mode(),
        "note": "This endpoint is for testing purposes only."
    }
