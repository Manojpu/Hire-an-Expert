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
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
      