from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from .config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token") # Points to the auth service endpoint

class TokenData(BaseModel):
    sub: str | None = None # This will be the Firebase UID
    email: str | None = None

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Dependency to verify the INTERNAL JWT and get user data (UID).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.INTERNAL_JWT_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_uid: str = payload.get("sub")
        user_email: str = payload.get("email")
        if user_uid is None:
            raise credentials_exception
        token_data = TokenData(sub=user_uid, email=user_email)
    except JWTError:
        raise credentials_exception
    return token_data