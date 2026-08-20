from __future__ import annotations
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo
from app.platforms.universal_extractor import extract_media_info

class TikTokAdapter(PlatformAdapter):
    name = "tiktok"
    url_patterns = ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"]
    capabilities = PLATFORM_CAPABILITIES["tiktok"]

    async def validate_url(self, url: str) -> bool:
        return any(p in url for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        return await extract_media_info(url, self.name)
