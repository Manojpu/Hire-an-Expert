from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from typing import Optional, List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get settings from environment variables with defaults
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-for-testing")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Use the auth service token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

class TokenData(BaseModel):
    """User data extracted from JWT token"""
    sub: str  # Firebase UID
    email: Optional[str] = None
    roles: List[str] = Field(default_factory=list)

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Verify the JWT token and extract user data.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token
        payload = jwt.decode(
            token, JWT_SECRET_KEY, algorithms=[ALGORITHM]
        )
        
        # Extract user information
        user_uid: str = payload.get("sub")
        if user_uid is None:
            raise credentials_exception
        
        # Create token data with available information
        token_data = TokenData(
            sub=user_uid,
            email=payload.get("email"),
            roles=payload.get("roles", [])
        )
        return token_data
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise credentials_exception