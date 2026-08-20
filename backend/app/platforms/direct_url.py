from __future__ import annotations
from pathlib import Path
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo
from app.core.security.ssrf import ssrf_safe_request, ssrf_safe_download

class DirectURLAdapter(PlatformAdapter):
    name = "direct_url"
    url_patterns = []  # Fallback adapter
    capabilities = PLATFORM_CAPABILITIES["direct_url"]

    async def validate_url(self, url: str) -> bool:
        return True

    async def analyze(self, url: str) -> MediaInfo:
        resp = await ssrf_safe_request(url, "HEAD")
        return MediaInfo(
            url=url, platform=self.name,
            media_type=resp.headers.get("content-type"),
            file_size=int(resp.headers.get("content-length", 0)),
            download_supported=True, embed_supported=False
        )

    async def get_available_formats(self, url: str) -> list[str]:
        return ["ORIGINAL"]

    async def download(self, url: str, format: str, dest_dir: Path, progress_callback) -> Path:
        dest = dest_dir / "downloaded_file"
        await ssrf_safe_download(url, str(dest), 500 * 1024 * 1024, progress_callback)
        return dest
