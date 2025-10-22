"""Configuration management for the Notification Service."""
from functools import lru_cache
from typing import Optional

from pydantic import AnyHttpUrl, EmailStr, Field, PositiveInt
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    rabbitmq_host: str = "localhost"
    rabbitmq_port: PositiveInt = Field(..., alias="RABBITMQ_PORT")
    rabbitmq_user: str = "guest"
    rabbitmq_pass: str = "guest"

    user_service_url: AnyHttpUrl = Field(..., alias="USER_SERVICE_URL")

    request_timeout_seconds: int = 10

    email_enabled: bool = False
    email_host: str = "smtp.gmail.com"
    email_port: PositiveInt = Field(..., alias="EMAIL_PORT")
    email_username: Optional[str] = None
    email_password: Optional[str] = None
    email_from: Optional[EmailStr] = None
    email_sender_name: str = "Hire an Expert Notifications"

    frontend_base_url: Optional[str] = None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()


settings = get_settings()
