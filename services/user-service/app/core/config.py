from pydantic import BaseSettings
from dotenv import load_dotenv
load_dotenv()

class Settings(BaseSettings):
    INTERNAL_JWT_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()