from __future__ import annotations
from typing import List
from pathlib import Path
from app.schemas.analyze import MediaInfo
from app.schemas.search import SearchResponse
from app.schemas.platform import PlatformCapability
from app.core.exceptions import PlatformDownloadNotSupportedError

class PlatformAdapter:
    name: str
    url_patterns: List[str]
    capabilities: PlatformCapability

    async def validate_url(self, url: str) -> bool:
        raise NotImplementedError

    async def analyze(self, url: str) -> MediaInfo:
        raise NotImplementedError

    async def get_available_formats(self, url: str) -> List[str]:
        raise NotImplementedError

    async def search(self, query: str, page: int, per_page: int) -> SearchResponse:
        raise NotImplementedError

    async def download(self, url: str, format: str, dest_dir: Path, progress_callback) -> Path:
        raise PlatformDownloadNotSupportedError()

    def get_limitations(self) -> List[str]:
        return self.capabilities.limitations
