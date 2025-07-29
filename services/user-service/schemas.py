
from pydantic import BaseModel, EmailStr
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_expert: bool

    class Config:
        orm_mode = True # Use 'from_attributes = True' for Pydantic v2+
