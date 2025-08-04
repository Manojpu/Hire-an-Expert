from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str 
    JWT_SECRET_KEY: str 
    ALGORITHM: str 

    class Config:
        env_file = ".env"
      