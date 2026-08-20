from __future__ import annotations
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo
from app.platforms.universal_extractor import extract_media_info

class RedditAdapter(PlatformAdapter):
    name = 'reddit'
    url_patterns = ['reddit.com', 'redd.it', 'v.redd.it', 'i.redd.it']
    capabilities = PLATFORM_CAPABILITIES['reddit']

    async def validate_url(self, url: str) -> bool:
        return any(p in url.lower() for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        return await extract_media_info(url, self.name)
