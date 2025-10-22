from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow",
    )
    # App settings
    APP_NAME: str = "Review Service"
    API_PREFIX: str = "/api"
    
    # JWT settings
    ALGORITHM: str = "HS256"
    INTERNAL_JWT_SECRET_KEY: str = os.environ.get("INTERNAL_JWT_SECRET_KEY", "insecure-secret-key-for-dev-only")
    
    # Database settings
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/review_service")
    
    # CORS settings
    CORS_ORIGINS: list[str] = ["*"]


# Create a global settings object
settings = Settings()
