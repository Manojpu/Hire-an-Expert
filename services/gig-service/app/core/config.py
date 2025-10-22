from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    DATABASE_URL: str
    JWT_SECRET_KEY: str
    ALGORITHM: str

    user_service_base_url: str = Field(default="http://localhost:8006", alias="USER_SERVICE_BASE_URL")
    review_service_base_url: str = Field(default="http://localhost:8004", alias="REVIEW_SERVICE_BASE_URL")

    # Cloudinary configuration is optional to support local setups without uploads
    cloudinary_cloud_name: Optional[str] = Field(default=None, alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: Optional[str] = Field(default=None, alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: Optional[str] = Field(default=None, alias="CLOUDINARY_API_SECRET")
    cloudinary_base_folder: str = Field(default="gig-service", alias="CLOUDINARY_BASE_FOLDER")


settings = Settings()
