from __future__ import annotations
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo
from app.platforms.universal_extractor import extract_media_info

class PinterestAdapter(PlatformAdapter):
    name = "pinterest"
    url_patterns = ["pinterest.com", "pin.it", "pinimg.com"]
    capabilities = PLATFORM_CAPABILITIES["pinterest"]

    async def validate_url(self, url: str) -> bool:
        return any(p in url for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        return await extract_media_info(url, self.name)
