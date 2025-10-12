from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "Booking Service"
    API_V1_STR: str = "/api/v1"
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://booking:booking123@localhost:5433/booking_db")
    
    # External services
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")
    USER_SERVICE_URL: str = os.getenv("USER_SERVICE_URL", "http://localhost:8006")  # Alias for backward compatibility
    GIG_SERVICE_URL: str = os.getenv("GIG_SERVICE_URL", "http://localhost:8002")  # Default gig service URL
    
    # CORS settings
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
      