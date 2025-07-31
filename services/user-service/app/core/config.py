from pydantic import BaseSettings

class Settings(BaseSettings):
    # This MUST BE THE SAME KEY as in the Auth Service
    INTERNAL_JWT_SECRET_KEY: str = "b62a7a049fac33fe724a6e35f00624a012fa5980"
    ALGORITHM: str = "HS256"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()