import os
from pathlib import Path

base_dir = Path(r"c:\Users\Lenovo\Desktop\Clientweb\mediaflow\backend")

directories = [
    "app/api/v1/endpoints",
    "app/core/security",
    "app/platforms",
    "app/schemas",
    "app/services",
    "app/worker",
    "app/middleware",
    "tests"
]

for d in directories:
    (base_dir / d).mkdir(parents=True, exist_ok=True)
    
files = {
    "requirements.txt": """fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.10.0
pydantic-settings>=2.7.0
httpx>=0.28.0
redis[hiredis]>=5.2.0
arq>=0.26.0
slowapi>=0.1.9
structlog>=24.4.0
python-multipart>=0.0.18
aiofiles>=24.1.0
orjson>=3.10.0
""",
    "pyproject.toml": """[build-system]
requires = ["setuptools", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "mediaflow-backend"
version = "0.1.0"
description = "MediaFlow FastAPI Backend"
authors = [{name = "Developer"}]
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.7.0",
    "httpx>=0.28.0",
    "redis[hiredis]>=5.2.0",
    "arq>=0.26.0",
    "slowapi>=0.1.9",
    "structlog>=24.4.0",
    "python-multipart>=0.0.18",
    "aiofiles>=24.1.0",
    "orjson>=3.10.0"
]

[tool.pytest.ini_options]
minversion = "6.0"
addopts = "-ra -q"
testpaths = ["tests"]
asyncio_mode = "auto"
""",
    "app/__init__.py": "",
    "app/api/__init__.py": "",
    "app/api/v1/__init__.py": "",
    "app/api/v1/endpoints/__init__.py": "",
    "app/core/__init__.py": "",
    "app/core/security/__init__.py": "",
    "app/platforms/__init__.py": "",
    "app/schemas/__init__.py": "",
    "app/services/__init__.py": "",
    "app/worker/__init__.py": "",
    "app/middleware/__init__.py": "",
    
    "app/core/config.py": """from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediaFlow API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    API_SECRET_TOKEN: str = "CHANGE_ME_IN_PRODUCTION"
    CORS_ORIGINS: List[str] = ["*"]
    
    REDIS_URL: str = "redis://localhost:6379/0"
    
    YOUTUBE_API_KEY: str | None = None
    
    MAX_URLS_PER_BATCH: int = 20
    MAX_CONCURRENT_JOBS: int = 2
    MAX_FILE_SIZE_MB: int = 500
    JOB_TIMEOUT_SECONDS: int = 600
    TEMP_FILE_TTL_SECONDS: int = 3600
    RATE_LIMIT_PER_MINUTE: int = 30
    MEDIA_STORAGE_PATH: str = "/tmp/media_storage"
    
    ENABLE_PLATFORM_YOUTUBE: bool = True
    ENABLE_PLATFORM_INSTAGRAM: bool = True
    ENABLE_PLATFORM_TIKTOK: bool = True
    ENABLE_PLATFORM_FACEBOOK: bool = True
    ENABLE_PLATFORM_X_TWITTER: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
""",
    "app/core/redis.py": """from __future__ import annotations
import redis.asyncio as redis
from app.core.config import settings

redis_pool: redis.Redis | None = None

async def init_redis():
    global redis_pool
    redis_pool = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def close_redis():
    global redis_pool
    if redis_pool:
        await redis_pool.aclose()

def get_redis() -> redis.Redis:
    if redis_pool is None:
        raise RuntimeError("Redis not initialized")
    return redis_pool
""",
    "app/core/exceptions.py": """from __future__ import annotations
import uuid

class MediaFlowError(Exception):
    def __init__(self, message: str, error_code: str = "INTERNAL_ERROR"):
        self.message = message
        self.error_code = error_code
        self.error_id = str(uuid.uuid4())
        super().__init__(self.message)

class PlatformNotSupportedError(MediaFlowError):
    def __init__(self, message: str = "Platform not supported"):
        super().__init__(message, "PLATFORM_NOT_SUPPORTED")

class PlatformDownloadNotSupportedError(MediaFlowError):
    def __init__(self, message: str = "Downloading from this platform is not supported"):
        super().__init__(message, "PLATFORM_DOWNLOAD_NOT_SUPPORTED")

class URLValidationError(MediaFlowError):
    def __init__(self, message: str = "Invalid URL provided"):
        super().__init__(message, "URL_VALIDATION_ERROR")

class SSRFBlockedError(MediaFlowError):
    def __init__(self, message: str = "SSRF attempt blocked"):
        super().__init__(message, "SSRF_BLOCKED")

class RateLimitExceededError(MediaFlowError):
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, "RATE_LIMIT_EXCEEDED")

class JobNotFoundError(MediaFlowError):
    def __init__(self, message: str = "Job not found"):
        super().__init__(message, "JOB_NOT_FOUND")

class FileSecurityError(MediaFlowError):
    def __init__(self, message: str = "File security violation"):
        super().__init__(message, "FILE_SECURITY_ERROR")

class FileSizeLimitError(MediaFlowError):
    def __init__(self, message: str = "File size limit exceeded"):
        super().__init__(message, "FILE_SIZE_LIMIT_ERROR")

class JobTimeoutError(MediaFlowError):
    def __init__(self, message: str = "Job timed out"):
        super().__init__(message, "JOB_TIMEOUT_ERROR")
""",
    "app/core/security/ssrf.py": """from __future__ import annotations
import ipaddress
import socket
import httpx
from urllib.parse import urlparse
from app.core.exceptions import SSRFBlockedError

def is_ip_allowed(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_private or ip.is_loopback or ip.is_multicast or ip.is_reserved:
            return False
        if ip.version == 4:
            if ip.is_link_local:
                return False
        if ip_str == "169.254.169.254":
            return False
        return True
    except ValueError:
        return False

def resolve_and_check(hostname: str) -> str:
    try:
        ip = socket.gethostbyname(hostname)
        if not is_ip_allowed(ip):
            raise SSRFBlockedError(f"Resolved IP {ip} for {hostname} is blocked.")
        return ip
    except socket.gaierror:
        raise SSRFBlockedError(f"Could not resolve {hostname}")

async def ssrf_safe_request(url: str, method: str = "GET", **kwargs) -> httpx.Response:
    parsed = urlparse(url)
    if parsed.scheme not in ["http", "https"]:
        raise SSRFBlockedError("Only HTTP and HTTPS are allowed")
    
    resolve_and_check(parsed.hostname)
    
    async with httpx.AsyncClient(follow_redirects=False) as client:
        response = await client.request(method, url, **kwargs)
        
        redirect_count = 0
        while response.is_redirect and redirect_count < 3:
            redirect_url = response.headers.get("location")
            if not redirect_url:
                break
            parsed_redirect = urlparse(redirect_url)
            if parsed_redirect.hostname:
                resolve_and_check(parsed_redirect.hostname)
            response = await client.request(method, redirect_url, **kwargs)
            redirect_count += 1
            
        return response

async def ssrf_safe_download(url: str, dest_path: str, max_size: int, progress_callback=None) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ["http", "https"]:
        raise SSRFBlockedError("Only HTTP and HTTPS are allowed")
    resolve_and_check(parsed.hostname)
    
    downloaded = 0
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            with open(dest_path, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    downloaded += len(chunk)
                    if downloaded > max_size:
                        raise ValueError("File size limit exceeded")
                    f.write(chunk)
                    if progress_callback:
                        progress_callback(downloaded)
    return dest_path
""",
    "app/core/security/url_validator.py": """from __future__ import annotations
from pydantic import BaseModel, HttpUrl
from app.core.exceptions import URLValidationError
from app.core.security.ssrf import resolve_and_check
from urllib.parse import urlparse

class ValidatedURL(BaseModel):
    url: str
    resolved_ip: str

def validate_url(url: str) -> ValidatedURL:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ["http", "https"]:
            raise URLValidationError("URL scheme must be http or https")
        if not parsed.hostname:
            raise URLValidationError("Invalid hostname")
        ip = resolve_and_check(parsed.hostname)
        return ValidatedURL(url=url, resolved_ip=ip)
    except Exception as e:
        raise URLValidationError(str(e))
""",
    "app/core/security/file_security.py": """from __future__ import annotations
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
""",
    "app/core/security/rate_limiter.py": """from __future__ import annotations
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)

limiter = Limiter(key_func=get_client_ip)
""",
    "app/middleware/security_headers.py": """from __future__ import annotations
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response
""",
    "app/middleware/request_id.py": """from __future__ import annotations
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger()

class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        req_id = str(uuid.uuid4())
        request.state.request_id = req_id
        
        structlog.contextvars.bind_contextvars(request_id=req_id)
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
""",
    "app/middleware/max_body_size.py": """from __future__ import annotations
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.exceptions import FileSizeLimitError

class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get('content-length')
        if content_length and int(content_length) > self.max_size:
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Request body too large"}, status_code=413)
        return await call_next(request)
""",
    "app/schemas/job.py": """from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

class JobStatus(str, Enum):
    WAITING = "WAITING"
    ANALYZING = "ANALYZING"
    READY = "READY"
    PROCESSING = "PROCESSING"
    DOWNLOADING = "DOWNLOADING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class JobFormat(str, Enum):
    MP4 = "MP4"
    WEBM = "WEBM"
    MP3 = "MP3"
    WAV = "WAV"
    PNG = "PNG"
    JPG = "JPG"
    GIF = "GIF"
    WEBP = "WEBP"
    ORIGINAL = "ORIGINAL"

class JobCreate(BaseModel):
    url: HttpUrl
    preferred_format: Optional[JobFormat] = None

class BatchJobCreate(BaseModel):
    urls: List[HttpUrl]

class JobResponse(BaseModel):
    id: str
    url: str
    platform: str
    status: JobStatus
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    formats: List[str] = []
    selected_format: Optional[str] = None
    progress: int = 0
    file_size: Optional[int] = None
    media_type: Optional[str] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    completed: int
    failed: int
    active: int
""",
    "app/schemas/analyze.py": """from __future__ import annotations
from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    urls: List[HttpUrl]

class MediaInfo(BaseModel):
    url: str
    platform: str
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    media_type: Optional[str] = None
    formats: List[str] = []
    file_size: Optional[int] = None
    duration: Optional[int] = None
    download_supported: bool
    embed_html: Optional[str] = None
    embed_supported: bool
    limitations: List[str] = []

class AnalyzeResponse(BaseModel):
    results: List[MediaInfo]
""",
    "app/schemas/search.py": """from __future__ import annotations
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
""",
    "app/schemas/platform.py": """from __future__ import annotations
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

class PlatformListResponse(BaseModel):
    platforms: List[PlatformCapability]
""",
    "app/platforms/base.py": """from __future__ import annotations
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
""",
    "app/platforms/capabilities.py": """from __future__ import annotations
from app.schemas.platform import PlatformCapability

PLATFORM_CAPABILITIES = {
    "direct_url": PlatformCapability(
        name="Direct URL", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=False, official_api_required=False,
        legal_notes="", limitations=[]
    ),
    "youtube": PlatformCapability(
        name="YouTube", enabled=True, search_supported=True, metadata_supported=True,
        download_supported=False, embed_supported=True, official_api_required=True,
        legal_notes="Downloading violates YouTube ToS.", limitations=["No downloading"]
    ),
    "instagram": PlatformCapability(
        name="Instagram", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=False, embed_supported=True, official_api_required=False,
        legal_notes="Requires Instagram API for some uses.", limitations=["No downloading", "Embeds only"]
    ),
    "tiktok": PlatformCapability(
        name="TikTok", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=False, embed_supported=True, official_api_required=False,
        legal_notes="", limitations=["No downloading", "Embeds only"]
    ),
    "facebook": PlatformCapability(
        name="Facebook", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=False, embed_supported=True, official_api_required=False,
        legal_notes="", limitations=["No downloading", "Embeds only"]
    ),
    "x_twitter": PlatformCapability(
        name="X / Twitter", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=False, embed_supported=True, official_api_required=False,
        legal_notes="", limitations=["No downloading", "Embeds only"]
    )
}
""",
    "app/platforms/registry.py": """from __future__ import annotations
from typing import List, Optional
from app.platforms.base import PlatformAdapter
from app.schemas.platform import PlatformCapability

class PlatformRegistry:
    def __init__(self):
        self._adapters: List[PlatformAdapter] = []

    def register(self, adapter: PlatformAdapter):
        self._adapters.append(adapter)

    def detect_platform(self, url: str) -> Optional[PlatformAdapter]:
        for adapter in self._adapters:
            # naive match
            for pattern in adapter.url_patterns:
                if pattern in url:
                    return adapter
        return None

    def get_enabled_platforms(self) -> List[PlatformCapability]:
        return [adapter.capabilities for adapter in self._adapters if adapter.capabilities.enabled]

registry = PlatformRegistry()
""",
    "app/platforms/direct_url.py": """from __future__ import annotations
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
""",
    "app/platforms/youtube.py": """from __future__ import annotations
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo
from app.schemas.search import SearchResponse
from app.core.exceptions import PlatformDownloadNotSupportedError

class YouTubeAdapter(PlatformAdapter):
    name = "youtube"
    url_patterns = ["youtube.com/watch", "youtu.be/", "youtube.com/shorts"]
    capabilities = PLATFORM_CAPABILITIES["youtube"]

    async def validate_url(self, url: str) -> bool:
        return any(p in url for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        return MediaInfo(url=url, platform=self.name, download_supported=False, embed_supported=True)

    async def get_available_formats(self, url: str) -> list[str]:
        return []

    async def search(self, query: str, page: int, per_page: int) -> SearchResponse:
        return SearchResponse(results=[], total=0, page=page, has_more=False)
""",
    "app/platforms/instagram.py": """from __future__ import annotations
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo

class InstagramAdapter(PlatformAdapter):
    name = "instagram"
    url_patterns = ["instagram.com/p/", "instagram.com/reel/"]
    capabilities = PLATFORM_CAPABILITIES["instagram"]

    async def validate_url(self, url: str) -> bool:
        return any(p in url for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        return MediaInfo(url=url, platform=self.name, download_supported=False, embed_supported=True)
""",
    "app/platforms/tiktok.py": """from __future__ import annotations
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo

class TikTokAdapter(PlatformAdapter):
    name = "tiktok"
    url_patterns = ["tiktok.com/@", "vm.tiktok.com/"]
    capabilities = PLATFORM_CAPABILITIES["tiktok"]

    async def validate_url(self, url: str) -> bool:
        return any(p in url for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        return MediaInfo(url=url, platform=self.name, download_supported=False, embed_supported=True)
""",
    "app/platforms/facebook.py": """from __future__ import annotations
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo

class FacebookAdapter(PlatformAdapter):
    name = "facebook"
    url_patterns = ["facebook.com/watch", "facebook.com/video", "fb.watch"]
    capabilities = PLATFORM_CAPABILITIES["facebook"]

    async def validate_url(self, url: str) -> bool:
        return any(p in url for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        return MediaInfo(url=url, platform=self.name, download_supported=False, embed_supported=True)
""",
    "app/platforms/x_twitter.py": """from __future__ import annotations
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo

class XTwitterAdapter(PlatformAdapter):
    name = "x_twitter"
    url_patterns = ["x.com/", "twitter.com/"]
    capabilities = PLATFORM_CAPABILITIES["x_twitter"]

    async def validate_url(self, url: str) -> bool:
        return any(p in url for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        return MediaInfo(url=url, platform=self.name, download_supported=False, embed_supported=True)
""",
    "app/services/job_service.py": """from __future__ import annotations
from typing import List
import uuid
from datetime import datetime, timezone
import orjson
from app.schemas.job import JobResponse, JobStatus
from app.core.redis import get_redis

class JobService:
    @staticmethod
    async def create_job(url: str, format: str = None) -> JobResponse:
        redis = get_redis()
        job_id = str(uuid.uuid4())
        job = JobResponse(
            id=job_id, url=url, platform="unknown", status=JobStatus.WAITING,
            selected_format=format, created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        await redis.hset(f"job:{job_id}", mapping={"data": orjson.dumps(job.dict()).decode("utf-8")})
        return job

    @staticmethod
    async def get_job(job_id: str) -> JobResponse | None:
        redis = get_redis()
        data = await redis.hget(f"job:{job_id}", "data")
        if data:
            return JobResponse(**orjson.loads(data))
        return None
""",
    "app/services/download_service.py": """from __future__ import annotations
from pathlib import Path
from app.core.security.ssrf import ssrf_safe_download

class DownloadService:
    @staticmethod
    async def download_media(url: str, format: str, dest_dir: Path, progress_callback) -> Path:
        dest_path = dest_dir / "temp_file"
        await ssrf_safe_download(url, str(dest_path), 500 * 1024 * 1024, progress_callback)
        return dest_path
""",
    "app/services/zip_service.py": """from __future__ import annotations
from pathlib import Path
from app.core.security.file_security import safe_create_zip

class ZipService:
    @staticmethod
    async def create_zip(file_paths: list[Path], output_path: Path) -> Path:
        safe_create_zip(file_paths, output_path, 1024*1024*1024, 50)
        return output_path
""",
    "app/services/cleanup_service.py": """from __future__ import annotations
import os
import time
from pathlib import Path

class CleanupService:
    @staticmethod
    def purge_stale_files(base_dir: Path, max_age_seconds: int):
        now = time.time()
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                p = Path(root) / file
                if now - p.stat().st_mtime > max_age_seconds:
                    p.unlink()
""",
    "app/worker/tasks.py": """from __future__ import annotations
import asyncio
from app.services.cleanup_service import CleanupService
from pathlib import Path

async def process_media_job(ctx, job_id: str, url: str, format: str):
    await asyncio.sleep(1)

async def cleanup_temp_files(ctx):
    CleanupService.purge_stale_files(Path("/tmp/media_storage"), 3600)
""",
    "app/worker/worker_main.py": """from __future__ import annotations
from arq import Worker
from arq.cron import cron
from app.core.config import settings
from app.worker.tasks import process_media_job, cleanup_temp_files
from app.core.redis import init_redis, close_redis

class WorkerSettings:
    functions = [process_media_job, cleanup_temp_files]
    cron_jobs = [cron(cleanup_temp_files, minute=set(range(0, 60, 30)))]
    redis_settings = settings.REDIS_URL
    max_jobs = settings.MAX_CONCURRENT_JOBS
    job_timeout = settings.JOB_TIMEOUT_SECONDS
    on_startup = init_redis
    on_shutdown = close_redis
""",
    "app/api/v1/router.py": """from __future__ import annotations
from fastapi import APIRouter
from app.api.v1.endpoints import health, analyze, jobs, download, search, platforms, admin

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(download.router, prefix="/download", tags=["download"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(platforms.router, prefix="/platforms", tags=["platforms"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
""",
    "app/api/v1/endpoints/health.py": """from __future__ import annotations
from fastapi import APIRouter
from app.core.redis import get_redis

router = APIRouter()

@router.get("/")
async def health_check():
    return {"status": "ok"}

@router.get("/ready")
async def readiness_check():
    redis = get_redis()
    await redis.ping()
    return {"status": "ready"}
""",
    "app/api/v1/endpoints/analyze.py": """from __future__ import annotations
from fastapi import APIRouter, Request
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.core.security.rate_limiter import limiter

router = APIRouter()

@router.post("/", response_model=AnalyzeResponse)
@limiter.limit("30/minute")
async def analyze_urls(request: Request, body: AnalyzeRequest):
    return AnalyzeResponse(results=[])
""",
    "app/api/v1/endpoints/jobs.py": """from __future__ import annotations
from fastapi import APIRouter, Request, HTTPException
from app.schemas.job import JobCreate, JobResponse, BatchJobCreate, JobListResponse
from app.services.job_service import JobService
from app.core.security.rate_limiter import limiter

router = APIRouter()

@router.post("/", response_model=JobResponse)
@limiter.limit("30/minute")
async def create_job(request: Request, job: JobCreate):
    return await JobService.create_job(str(job.url), job.preferred_format)

@router.post("/batch", response_model=list[JobResponse])
@limiter.limit("10/minute")
async def create_batch_jobs(request: Request, batch: BatchJobCreate):
    return [await JobService.create_job(str(url)) for url in batch.urls]

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = await JobService.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.delete("/{job_id}")
async def cancel_job(job_id: str):
    return {"status": "cancelled"}

@router.post("/{job_id}/retry")
async def retry_job(job_id: str):
    return {"status": "retrying"}
""",
    "app/api/v1/endpoints/download.py": """from __future__ import annotations
from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

@router.get("/{job_id}")
async def download_file(job_id: str):
    return {"error": "Not implemented"}

@router.post("/batch")
async def download_batch():
    return {"error": "Not implemented"}
""",
    "app/api/v1/endpoints/search.py": """from __future__ import annotations
from fastapi import APIRouter, Request
from app.schemas.search import SearchRequest, SearchResponse
from app.core.security.rate_limiter import limiter

router = APIRouter()

@router.get("/", response_model=SearchResponse)
@limiter.limit("20/minute")
async def search(request: Request, query: str, platform: str, page: int = 1, per_page: int = 20):
    return SearchResponse(results=[], total=0, page=page, has_more=False)
""",
    "app/api/v1/endpoints/platforms.py": """from __future__ import annotations
from fastapi import APIRouter
from app.schemas.platform import PlatformListResponse
from app.platforms.registry import registry

router = APIRouter()

@router.get("/", response_model=PlatformListResponse)
async def list_platforms():
    return PlatformListResponse(platforms=registry.get_enabled_platforms())
""",
    "app/api/v1/endpoints/admin.py": """from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Header
from app.core.config import settings

router = APIRouter()

async def verify_admin(authorization: str = Header(...)):
    if not authorization.startswith("Bearer ") or authorization.split(" ")[1] != settings.API_SECRET_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/stats", dependencies=[Depends(verify_admin)])
async def get_stats():
    return {"jobs_processed": 0}

@router.get("/queue", dependencies=[Depends(verify_admin)])
async def get_queue():
    return {"queue_depth": 0}
""",
    "app/main.py": """from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
from app.core.config import settings
from app.core.redis import init_redis, close_redis
from app.core.exceptions import MediaFlowError
from app.api.v1.router import api_router
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.max_body_size import MaxBodySizeMiddleware
from app.platforms.registry import registry
from app.platforms.direct_url import DirectURLAdapter
from app.platforms.youtube import YouTubeAdapter

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    registry.register(DirectURLAdapter())
    if settings.ENABLE_PLATFORM_YOUTUBE:
        registry.register(YouTubeAdapter())
    yield
    await close_redis()

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(MaxBodySizeMiddleware, max_size=10 * 1024 * 1024)

@app.exception_handler(MediaFlowError)
async def mediaflow_exception_handler(request: Request, exc: MediaFlowError):
    return JSONResponse(status_code=400, content={"error": exc.message, "code": exc.error_code, "id": exc.error_id})

app.include_router(api_router, prefix=settings.API_V1_STR)
""",
    "Dockerfile.dev": """FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
""",
    "Dockerfile": """FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache /wheels/*
COPY . .
RUN useradd -u 10001 -m appuser && chown -R appuser /app
USER appuser
HEALTHCHECK CMD curl --fail http://localhost:8000/api/v1/health/ || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"""
}

for filepath, content in files.items():
    p = base_dir / filepath
    p.write_text(content, encoding="utf-8")
    print(f"Created {filepath}")
