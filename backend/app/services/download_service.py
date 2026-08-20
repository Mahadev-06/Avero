from __future__ import annotations
from pathlib import Path
from app.core.security.ssrf import ssrf_safe_download

class DownloadService:
    @staticmethod
    async def download_media(url: str, format: str, dest_dir: Path, progress_callback) -> Path:
        dest_path = dest_dir / "temp_file"
        await ssrf_safe_download(url, str(dest_path), 500 * 1024 * 1024, progress_callback)
        return dest_path
