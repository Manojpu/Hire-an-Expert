"""
Configuration settings for the RAG service.
This file manages all environment variables and application settings.
"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database configuration
    DATABASE_URL: str = "postgresql+asyncpg://rag_user:rag_password@localhost:5433/rag_db"
    
    # OpenAI API settings
    OPENAI_API_KEY: str = "your-openai-api-key-here"
    EMBEDDING_MODEL: str = "text-embedding-3-small"  # OpenAI embedding model
    CHAT_MODEL: str = "gpt-4o-mini"  # OpenAI chat model for RAG answers
    
    # URLs of other microservices
    GIG_SERVICE_URL: str = "http://localhost:8002"
    REVIEW_SERVICE_URL: str = "http://localhost:8003"
    
    # Server settings
    PORT: int = 8004
    DEBUG: bool = True
    
    # RAG-specific settings
    TOP_K_RESULTS: int = 5  # How many similar gigs to return
    SIMILARITY_THRESHOLD: float = 0.7  # Minimum similarity score
    MAX_CONTEXT_LENGTH: int = 4000  # Max characters for RAG context

    class Config:
        env_file = ".env"  # Load from .env file

# Global settings instance
settings = Settings()