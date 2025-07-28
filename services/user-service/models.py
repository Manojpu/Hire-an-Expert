# models.py
from sqlalchemy import Boolean, Column, Integer, String
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # We replace the 'role' column with 'is_expert'
    is_expert = Column(Boolean, default=False, nullable=False)
