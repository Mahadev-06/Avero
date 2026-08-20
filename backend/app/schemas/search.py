from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SearchRequest(BaseModel):
    query: str
    platform: str
    page: int = 1
    per_page: int = 20

class SearchResult(BaseModel):
    id: str
    title: str
    thumbnail_url: Optional[str] = None
    channel: Optional[str] = None
    view_count: Optional[int] = None
    duration: Optional[int] = None
    published_at: Optional[datetime] = None
    url: str
    platform: str

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    page: int
    has_more: bool
