from __future__ import annotations
from pydantic import BaseModel
from typing import List

class PlatformCapability(BaseModel):
    name: str
    enabled: bool
    search_supported: bool
    metadata_supported: bool
    download_supported: bool
    embed_supported: bool
    official_api_required: bool
    legal_notes: str
    limitations: List[str]
    max_duration_seconds: int = 0

class PlatformListResponse(BaseModel):
    platforms: List[PlatformCapability]
