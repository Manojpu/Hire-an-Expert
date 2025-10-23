from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Review Service"
    API_PREFIX: str = "/api"
    
    # JWT settings
    ALGORITHM: str = "HS256"
    INTERNAL_JWT_SECRET_KEY: str = os.environ.get("INTERNAL_JWT_SECRET_KEY", "insecure-secret-key-for-dev-only")
    
    # Database settings
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/review_service")
    
    # Service URLs
    GIG_SERVICE_URL: str
    BOOKING_SERVICE_URL: str
    USER_SERVICE_URL: str

    # CORS settings
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
