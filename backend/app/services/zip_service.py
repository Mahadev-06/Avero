from __future__ import annotations
from pathlib import Path
from app.core.security.file_security import safe_create_zip

class ZipService:
    @staticmethod
    async def create_zip(file_paths: list[Path], output_path: Path) -> Path:
        safe_create_zip(file_paths, output_path, 1024*1024*1024, 50)
        return output_path
