from __future__ import annotations
import unicodedata
import re
import uuid
import zipfile
from pathlib import Path
from app.core.exceptions import FileSecurityError

ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mp3", ".wav", ".png", ".jpg", ".gif", ".webp"}

def sanitize_filename(raw: str) -> str:
    normalized = unicodedata.normalize('NFKC', raw)
    sanitized = re.sub(r'[^a-zA-Z0-9._-]', '_', normalized)
    return sanitized[:100]

def get_secure_storage_path(extension: str, base_dir: Path) -> tuple[str, Path]:
    if extension not in ALLOWED_EXTENSIONS:
        raise FileSecurityError("Extension not allowed")
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{extension}"
    return file_id, base_dir / filename

def validate_path_traversal(target: Path, base_dir: Path) -> bool:
    try:
        target.resolve().relative_to(base_dir.resolve())
        return True
    except ValueError:
        return False

def safe_create_zip(file_paths: list[Path], output_path: Path, max_total_size: int, max_files: int):
    if len(file_paths) > max_files:
        raise FileSecurityError("Too many files for ZIP")
    
    total_size = sum(f.stat().st_size for f in file_paths if f.exists())
    if total_size > max_total_size:
        raise FileSecurityError("Total size exceeds limit for ZIP")
        
    with zipfile.ZipFile(output_path, 'w') as zf:
        for f in file_paths:
            if f.exists():
                zf.write(f, arcname=f.name)
