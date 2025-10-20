"""
Configuration settings for Lightweight Admin Service with RAG
Uses Pinecone for vector storage and Gemini for embeddings and LLM
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
    GEMINI_MODEL: str = "models/gemini-2.0-flash-exp"  # LLM for answer generation
    GEMINI_EMBEDDING_MODEL: str = "models/embedding-001"  # Embedding model
    
    # Pinecone Configuration
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = "hire-expert-rag"
    PINECONE_ENVIRONMENT: str = "us-east-1-aws"
    VECTOR_DIMENSION: int = 768  # Dimension for Gemini embedding-001
    
    # RAG Configuration
    CHUNK_SIZE: int = 500  # Words per chunk
    CHUNK_OVERLAP: int = 50  # Word overlap between chunks
    TOP_K_RESULTS: int = 5  # Top K similar chunks to retrieve
    
    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".txt"]
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

if not settings.PINECONE_API_KEY:
    print("⚠️  WARNING: PINECONE_API_KEY not set in environment variables!")
    print("   Please add it to your .env file:")
    print("   PINECONE_API_KEY=your-api-key-here")
