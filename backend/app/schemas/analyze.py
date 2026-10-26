from __future__ import annotations
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    urls: List[HttpUrl] = Field(..., min_length=1, max_length=20)

class FormatOption(BaseModel):
    format_id: str
    ext: str
    quality: str
    file_size_formatted: Optional[str] = None
    media_category: str  # "video", "audio", or "image"
    download_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    codec: Optional[str] = None
    is_preferred: Optional[bool] = False
    compatibility_note: Optional[str] = None

class SlideItem(BaseModel):
    id: str
    slide_index: int  # 1-based index (1, 2, 3...)
    media_type: str   # "image" or "video"
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    download_url: Optional[str] = None
    formats: List[str] = []
    format_options: List[FormatOption] = []

class MediaInfo(BaseModel):
    url: str
    platform: str
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    media_type: Optional[str] = None
    formats: List[str] = []
    format_options: List[FormatOption] = []
    file_size: Optional[int | float] = None
    duration: Optional[int | float] = None
    download_url: Optional[str] = None
    download_supported: bool
    embed_html: Optional[str] = None
    embed_supported: bool
    limitations: List[str] = []
    muted: Optional[bool] = False
    is_carousel: Optional[bool] = False
    slide_count: Optional[int] = 1
    slides: Optional[List[SlideItem]] = None
    error: Optional[str] = None
    error_message: Optional[str] = None

class AnalyzeResponse(BaseModel):
    results: List[MediaInfo]
