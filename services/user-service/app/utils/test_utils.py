"""
Utility functions for generating test JWT tokens.
"""

from jose import jwt
import datetime
from ..core.auth import JWT_SECRET_KEY, ALGORITHM
from ..core.test_config import TEST_USER

def create_test_token(user_id: str = TEST_USER["sub"], 
                     email: str = TEST_USER["email"],
                     roles: list = None,
                     expires_minutes: int = 30) -> str:
    """
    Create a test JWT token with custom claims.
    
    Args:
        user_id: Firebase UID or test user ID
        email: User email
        roles: List of user roles
        expires_minutes: Token expiration time in minutes
        
    Returns:
        JWT token string
    """
    if roles is None:
        roles = TEST_USER["roles"]
        
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_minutes)
    
    to_encode = {
        "sub": user_id,
        "email": email,
        "roles": roles,
        "exp": expires
    }
    
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
