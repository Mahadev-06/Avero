from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, HttpUrl, Field, field_validator
from typing import List, Optional
from datetime import datetime
import re

class JobStatus(str, Enum):
    WAITING = "WAITING"
    ANALYZING = "ANALYZING"
    READY = "READY"
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    DOWNLOADING = "DOWNLOADING"
    CONVERTING = "CONVERTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class JobFormat(str, Enum):
    MP4 = "MP4"
    WEBM = "WEBM"
    MP3 = "MP3"
    WAV = "WAV"
    PNG = "PNG"
    JPG = "JPG"
    GIF = "GIF"
    WEBP = "WEBP"
    ORIGINAL = "ORIGINAL"

class JobCreate(BaseModel):
    url: HttpUrl
    preferred_format: Optional[JobFormat] = None

class BatchJobCreate(BaseModel):
    urls: List[HttpUrl] = Field(..., min_length=1, max_length=20)

class JobResponse(BaseModel):
    id: str
    url: str
    platform: str
    status: JobStatus
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    formats: List[str] = []
    selected_format: Optional[str] = None
    progress: int = 0
    file_size: Optional[int | float] = None
    media_type: Optional[str] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    completed: int
    failed: int
    active: int

# --- Download Engine Schemas ---

class DownloadRequest(BaseModel):
    url: str = Field(..., min_length=7, max_length=2048)
    format: str = Field("mp4", max_length=50)
    quality: str = Field("best", max_length=50)

    @field_validator("url")
    @classmethod
    def validate_url_scheme(cls, v: str) -> str:
        v_stripped = v.strip()
        if not (v_stripped.startswith("http://") or v_stripped.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        if re.search(r"[\r\n\x00-\x1f]", v_stripped):
            raise ValueError("URL contains invalid control characters")
        return v_stripped

    @field_validator("format", "quality")
    @classmethod
    def sanitize_strings(cls, v: str) -> str:
        # Strip all unsafe chars, allow alphanumeric, spaces, and hyphens/underscores
        return re.sub(r"[^a-zA-Z0-9 _\-+]", "", v).strip()

class DownloadProgress(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.PENDING
    percent: float = 0.0
    speed: str = ""
    eta: str = ""
    file_size: Optional[int | float] = None
    filename: Optional[str] = None
    error: Optional[str] = None

class DownloadStartResponse(BaseModel):
    job_id: str
    status: JobStatus
    message: str
