"""
Configuration settings for Admin Service with RAG
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # Service Configuration
    SERVICE_NAME: str = "admin-service"
    HOST: str = "0.0.0.0"
    PORT: int = 8009
    DEBUG: bool = True
    
    # MongoDB Configuration
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB_NAME: str = "hire_expert_admin"
    
    # Gemini API Configuration
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = "models/gemini-2.5-flash"
    
    # RAG Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Vector Store Configuration
    FAISS_INDEX_PATH: str = "./data/faiss_index"
    VECTOR_DIMENSION: int = 384  # Dimension for all-MiniLM-L6-v2
    
    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".txt", ".docx", ".doc", ".md"]
    UPLOAD_DIR: str = "./uploads"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # External Services
    USER_SERVICE_URL: str = "http://localhost:8006"
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    MESSAGE_SERVICE_URL: str = "http://localhost:8005"
    BOOKING_SERVICE_URL: str = "http://localhost:8003"
    GIG_SERVICE_URL: str = "http://localhost:8004"
    PAYMENT_SERVICE_URL: str = "http://localhost:8008"
    
    # Admin Credentials
    ADMIN_EMAIL: str = "admin@hireexpert.com"
    ADMIN_PASSWORD: str = "admin123"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env

settings = Settings()

# Validate required settings
if not settings.GOOGLE_API_KEY:
    print("⚠️  WARNING: GOOGLE_API_KEY not set in environment variables!")
    print("   Please add it to your .env file:")
    print("   GOOGLE_API_KEY=your-api-key-here")
