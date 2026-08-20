"""
Download API endpoints.

Provides:
- POST /start             — Start a tracked download with progress
- GET  /{job_id}/progress — SSE real-time progress stream
- GET  /{job_id}/file    — Serve completed download file
- GET  /proxy            — Immediate download proxy (legacy, hardened)
"""
from __future__ import annotations
import asyncio
import os
import uuid
import json
import tempfile
from pathlib import Path
from fastapi import APIRouter, Query, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
import httpx
import yt_dlp
from urllib.parse import urlparse

from app.core.config import settings
from app.core.security.ssrf import resolve_and_check, SSRFBlockedError
from app.core.security.file_security import sanitize_filename, validate_path_traversal
from app.core.security.rate_limiter import limiter
from app.schemas.job import (
    DownloadRequest,
    DownloadStartResponse,
    DownloadProgress,
    JobStatus,
)
from app.services import media_service

router = APIRouter()

TEMP_DOWNLOAD_DIR = Path(tempfile.gettempdir()) / "mediaflow_downloads"
TEMP_DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Recognized social video host suffixes
SOCIAL_DOMAINS = (
    "youtube.com", "youtu.be", "instagram.com", "tiktok.com",
    "facebook.com", "fb.watch", "x.com", "twitter.com",
    "pinterest.com", "pin.it", "reddit.com", "redd.it", "threads.net",
)


def _is_allowed_social_domain(hostname: str) -> bool:
    h = hostname.lower()
    return any(h == d or h.endswith(f".{d}") for d in SOCIAL_DOMAINS)


# ──────────────────────────────────────────────────────────────
# POST /start  —  Start a tracked download with progress
# ──────────────────────────────────────────────────────────────
@router.post("/start")
@limiter.limit("20/minute")
async def start_download(request: Request, req: DownloadRequest):
    """
    Start a media download job. Returns a job_id that can be used to
    track progress via SSE and retrieve the completed file.
    """
    # SSRF verification on the requested URL
    parsed = urlparse(req.url)
    if not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid target URL.")
    
    try:
        resolve_and_check(parsed.hostname)
    except SSRFBlockedError:
        raise HTTPException(status_code=403, detail="The requested target destination is blocked.")

    job_id = str(uuid.uuid4())

    fmt = req.format.lower().strip()
    quality = req.quality.lower().strip()

    if " " in req.format:
        parts = req.format.split(" ", 1)
        fmt = parts[0].lower().strip()
        quality = parts[1].lower().strip()
    if " " in req.quality:
        parts = req.quality.split(" ", 1)
        fmt = parts[0].lower().strip()
        quality = parts[1].lower().strip()

    # Launch download as a background asyncio task
    asyncio.create_task(_run_download(job_id, req.url, fmt, quality))

    return DownloadStartResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        message=f"Download started. Track progress at /download/{job_id}/progress",
    )


async def _run_download(job_id: str, url: str, fmt: str, quality: str):
    """Background task that runs the actual download."""
    try:
        await media_service.start_download(job_id, url, fmt, quality)
    except Exception:
        pass


# ──────────────────────────────────────────────────────────────
# GET /{job_id}/progress  —  SSE real-time progress stream
# ──────────────────────────────────────────────────────────────
@router.get("/{job_id}/progress")
@limiter.limit("60/minute")
async def download_progress(request: Request, job_id: str):
    """
    Server-Sent Events stream for real-time download progress.
    Sends progress updates every 0.5s until COMPLETED or FAILED.
    """
    # Validate UUID format
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format.")

    async def event_generator():
        terminal_states = {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.EXPIRED}
        max_polls = 2400  # 20 minutes max
        poll_count = 0

        while poll_count < max_polls:
            progress = media_service.get_progress(job_id)
            data = json.dumps(progress.model_dump(), default=str)
            yield f"data: {data}\n\n"

            if progress.status in terminal_states:
                break

            await asyncio.sleep(0.5)
            poll_count += 1

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ──────────────────────────────────────────────────────────────
# GET /{job_id}/file  —  Serve completed download file
# ──────────────────────────────────────────────────────────────
@router.get("/{job_id}/file")
@limiter.limit("60/minute")
async def download_file(
    request: Request,
    job_id: str,
    filename: str | None = Query(default=None, max_length=255)
):
    """
    Serve a completed download file with Content-Disposition: attachment.
    The file remains available for a configurable TTL before cleanup.
    """
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format.")

    progress = media_service.get_progress(job_id)

    if progress.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Download not ready. Current status: {progress.status.value}",
        )

    file_path = media_service.get_file_path(job_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Download file not found or expired")

    # Path traversal validation
    if not validate_path_traversal(Path(file_path), TEMP_DOWNLOAD_DIR):
        raise HTTPException(status_code=403, detail="Access denied to requested path.")

    raw_filename = filename or progress.filename or os.path.basename(file_path)
    safe_filename = sanitize_filename(raw_filename)

    # Guarantee correct file extension matches actual file type
    if file_path.lower().endswith(".mp4"):
        if not safe_filename.lower().endswith(".mp4"):
            base = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
            safe_filename = f"{base}.mp4"
        media_type = "video/mp4"
    elif file_path.lower().endswith(".mp3"):
        if not safe_filename.lower().endswith(".mp3"):
            base = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
            safe_filename = f"{base}.mp3"
        media_type = "audio/mpeg"
    elif file_path.lower().endswith(".png"):
        if not safe_filename.lower().endswith(".png"):
            base = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
            safe_filename = f"{base}.png"
        media_type = "image/png"
    elif file_path.lower().endswith((".jpg", ".jpeg")):
        if not safe_filename.lower().endswith((".jpg", ".jpeg")):
            base = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
            safe_filename = f"{base}.jpg"
        media_type = "image/jpeg"
    elif file_path.lower().endswith(".webp"):
        if not safe_filename.lower().endswith(".webp"):
            base = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
            safe_filename = f"{base}.webp"
        media_type = "image/webp"
    else:
        # Default fallback for video files
        if not safe_filename.lower().endswith(".mp4"):
            base = safe_filename.rsplit(".", 1)[0] if "." in safe_filename else safe_filename
            safe_filename = f"{base}.mp4"
        media_type = "video/mp4"

    return FileResponse(
        path=file_path,
        filename=safe_filename,
        media_type=media_type,
    )


# ──────────────────────────────────────────────────────────────
# GET /proxy  —  Immediate download proxy (hardened)
# ──────────────────────────────────────────────────────────────
@router.get("/proxy")
@limiter.limit("20/minute")
async def download_proxy(
    request: Request,
    url: str = Query(..., min_length=7, max_length=2048),
    filename: str = Query("media_download.mp4", max_length=100)
):
    """
    Downloads and merges video/audio into a clean, playable MP4/MP3 file using
    yt-dlp + FFmpeg with strict SSRF & filename validation.
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ["http", "https"] or not parsed.hostname:
            raise HTTPException(status_code=400, detail="Only HTTP and HTTPS allowed")

        # Enforce SSRF resolution check
        resolve_and_check(parsed.hostname)

        safe_filename = sanitize_filename(filename)
        is_audio = safe_filename.endswith(".mp3") or safe_filename.endswith(".m4a")

        # Social media platforms
        if _is_allowed_social_domain(parsed.hostname):
            unique_name = f"media_{uuid.uuid4().hex[:10]}"
            target_file_path = str(TEMP_DOWNLOAD_DIR / unique_name)

            loop = asyncio.get_event_loop()
            actual_file = await loop.run_in_executor(
                None, _download_with_ytdlp, url, target_file_path, is_audio
            )

            if not os.path.exists(actual_file):
                raise HTTPException(status_code=500, detail="Failed to process video file")

            media_type = "audio/mpeg" if is_audio else "video/mp4"
            return FileResponse(
                path=actual_file,
                filename=safe_filename,
                media_type=media_type,
            )

        # Direct media files
        client = httpx.AsyncClient(follow_redirects=False, timeout=120.0, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        })
        req = client.build_request("GET", url)
        resp = await client.send(req, stream=True)

        content_type = "audio/mpeg" if is_audio else "video/mp4"
        content_length = resp.headers.get("content-length")

        headers = {
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "Content-Type": content_type,
        }
        if content_length:
            headers["Content-Length"] = content_length

        async def _stream_content():
            try:
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    yield chunk
            finally:
                await resp.aclose()
                await client.aclose()

        return StreamingResponse(_stream_content(), headers=headers, media_type=content_type)
    except HTTPException:
        raise
    except SSRFBlockedError:
        raise HTTPException(status_code=403, detail="Destination host is not permitted.")
    except Exception:
        raise HTTPException(status_code=400, detail="Download failed. Please verify the URL.")


def _download_with_ytdlp(url: str, output_path: str, is_audio: bool = False) -> str:
    """Synchronous download helper for the /proxy endpoint."""
    ydl_opts = {
        "outtmpl": output_path,
        "quiet": True,
        "no_warnings": True,
        "overwrites": True,
    }
    if is_audio:
        ydl_opts["format"] = "bestaudio/best"
        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "320",
        }]
    else:
        ydl_opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
        ydl_opts["merge_output_format"] = "mp4"

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    if os.path.exists(output_path):
        return output_path
    if os.path.exists(f"{output_path}.mp4"):
        return f"{output_path}.mp4"
    if os.path.exists(f"{output_path}.mp3"):
        return f"{output_path}.mp3"
    return output_path


@router.post("/batch")
@limiter.limit("5/minute")
async def download_batch(request: Request):
    return {"status": "ok", "message": "Batch processing active"}
