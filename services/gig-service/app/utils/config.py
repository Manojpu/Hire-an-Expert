from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database Configuration
    database_url: str = "postgresql+asyncpg://username:password@localhost:5432/hire_expert_users"
    sync_database_url: str = "postgresql://username:password@localhost:5432/hire_expert_users"

    # Firebase Configuration
    firebase_project_id: Optional[str] = None
    firebase_private_key_id: Optional[str] = None
    firebase_private_key: Optional[str] = None
    firebase_client_email: Optional[str] = None
    firebase_client_id: Optional[str] = None
    firebase_auth_uri: Optional[str] = None
    firebase_token_uri: Optional[str] = None
    firebase_auth_provider_x509_cert_url: Optional[str] = None
    firebase_client_x509_cert_url: Optional[str] = None

    # Application Configuration
    app_name: str = "Hire Expert User Service"
    app_version: str = "1.0.0"
    debug: bool = True
    host: str = "127.0.0.1"
    port: int = 8006

    # Security
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"
        extra = "allow"
        case_sensitive = False


settings = Settings()