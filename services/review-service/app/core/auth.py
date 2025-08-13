from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

class TokenData(BaseModel):
    sub: str
    email: str | None = None
    original_token: str = None

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
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
        email: str = payload.get("email")
        
        if user_uid is None:
            # If there's no 'sub' field, the token is invalid.
            raise credentials_exception
            
        # Store the original token so we can pass it to other services
        token_data = TokenData(
            sub=user_uid,
            email=email,
            original_token=token
        )

    except JWTError:
        raise credentials_exception

    return token_data