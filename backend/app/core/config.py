from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "AVERO API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    API_SECRET_TOKEN: str = "CHANGE_ME_IN_PRODUCTION"
    
    # CORS: Explicit origins for frontend apps; in production, configure via CORS_ORIGINS environment variable
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:3000",
    ]
    
    # Trusted reverse proxy IPs (e.g. Nginx, Cloudflare) for accurate rate limit IP extraction
    TRUSTED_PROXIES: List[str] = ["127.0.0.1", "::1"]
    
    REDIS_URL: str = "redis://localhost:6379/0"
    YOUTUBE_API_KEY: str | None = None
    YOUTUBE_COOKIES_TEXT: str | None = None
    YOUTUBE_COOKIES_FILE: str | None = None
    COBALT_API_URL: str | None = None
    
    MAX_URLS_PER_BATCH: int = 20
    MAX_CONCURRENT_JOBS: int = 2
    MAX_FILE_SIZE_MB: int = 500
    JOB_TIMEOUT_SECONDS: int = 600
    TEMP_FILE_TTL_SECONDS: int = 3600
    RATE_LIMIT_PER_MINUTE: int = 30
    MEDIA_STORAGE_PATH: str = "/tmp/media_storage"
    
    # Download engine settings
    MAX_CONCURRENT_DOWNLOADS: int = 3
    MAX_DOWNLOAD_DURATION_SECONDS: int = 3600  # 1 hour
    MAX_FILE_SIZE_BYTES: int = 2 * 1024 * 1024 * 1024  # 2GB
    DOWNLOAD_TIMEOUT_SECONDS: int = 600  # 10 min per download
    CLEANUP_INTERVAL_SECONDS: int = 600  # 10 minutes

    ENABLE_PLATFORM_YOUTUBE: bool = True
    ENABLE_PLATFORM_INSTAGRAM: bool = True
    ENABLE_PLATFORM_TIKTOK: bool = True
    ENABLE_PLATFORM_FACEBOOK: bool = True
    ENABLE_PLATFORM_X_TWITTER: bool = True
    ENABLE_PLATFORM_PINTEREST: bool = True
    ENABLE_PLATFORM_REDDIT: bool = True
    ENABLE_PLATFORM_THREADS: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
