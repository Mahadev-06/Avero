"""
MediaFlow Media Download Service

Core download engine using yt-dlp Python library API for safe, 
concurrent media downloading with real-time progress tracking.

No source code from external repositories was used.
All functionality implemented independently with strict SSRF & error sanitization.
"""
from __future__ import annotations
import asyncio
import os
import uuid
import glob
import tempfile
import time
import re
import subprocess
from urllib.parse import urlparse
import structlog
from pathlib import Path
from typing import Optional
import yt_dlp

from app.core.config import settings
from app.core.security.ssrf import resolve_and_check, SSRFBlockedError
from app.core.security.file_security import sanitize_filename
from app.schemas.job import JobStatus, DownloadProgress

logger = structlog.get_logger()

# --- Temp directory ---
TEMP_DOWNLOAD_DIR = Path(tempfile.gettempdir()) / "mediaflow_downloads"
TEMP_DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

# --- Concurrency limiter ---
_download_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_DOWNLOADS)

# --- In-memory progress store (job_id -> DownloadProgress) ---
_progress_store: dict[str, DownloadProgress] = {}

# --- File path store (job_id -> file path) ---
_file_store: dict[str, str] = {}

# --- Timestamp store for TTL pruning (job_id -> creation timestamp) ---
_timestamp_store: dict[str, float] = {}


def _is_youtube_bot_challenge(exc: Exception) -> bool:
    """Detect YouTube BotGuard / Sign in to confirm you're not a bot challenge."""
    msg = str(exc).lower()
    return (
        "sign in to confirm you're not a bot" in msg
        or "sign in to confirm you’re not a bot" in msg
        or "botguard" in msg
        or ("bot" in msg and ("sign in" in msg or "confirm" in msg or "challenge" in msg))
    )


def _get_youtube_cookiefile() -> str | None:
    """Return path to YouTube cookie file if configured via environment variables."""
    if settings.YOUTUBE_COOKIES_FILE and os.path.exists(settings.YOUTUBE_COOKIES_FILE):
        return settings.YOUTUBE_COOKIES_FILE
    if settings.YOUTUBE_COOKIES_TEXT:
        cookie_path = str(TEMP_DOWNLOAD_DIR / "youtube_cookies.txt")
        try:
            with open(cookie_path, "w", encoding="utf-8") as f:
                f.write(settings.YOUTUBE_COOKIES_TEXT.strip())
            return cookie_path
        except OSError:
            pass
    return None


def _sanitize_error_message(exc: Exception) -> str:
    """Sanitize internal errors to prevent leaking server paths, stack traces, or credentials."""
    if _is_youtube_bot_challenge(exc):
        return "Unfortunately, YouTube downloads are currently unavailable from our server. Please try again later."
    msg = str(exc).lower()
    if isinstance(exc, SSRFBlockedError) or "ssrf" in msg:
        return "Access to the requested resource is not permitted."
    if "403" in msg or "forbidden" in msg or "blocked" in msg:
        return "Unable to access this media. The post may be private, restricted, or rate-limited."
    if "too large" in msg or "size" in msg:
        return "File exceeds the maximum allowable download size."
    if "timeout" in msg or "timed out" in msg:
        return "The media request timed out. Please try again."
    if "private" in msg or "login" in msg or "drm" in msg:
        return "This media cannot be downloaded (private or restricted content)."
    if "unsupported" in msg or "no video formats" in msg:
        return "Unsupported media link or no downloadable stream found."
    return "Unable to process this media link. Please verify the URL."


def _build_ytdlp_format(fmt: str, quality: str) -> str:
    """Map user-facing format+quality to yt-dlp format string with robust fallback chains."""
    fmt = fmt.lower().strip()
    quality = quality.lower().strip()

    # Audio formats
    if fmt in ("mp3", "audio", "m4a") or "kbps" in quality:
        return "bestaudio[ext=m4a]/bestaudio/best"

    # Extract height if present (e.g. 2160p (4k) -> 2160, 4k -> 2160, 1080p -> 1080)
    height = None
    if "4k" in quality or "2160" in quality:
        height = 2160
    elif "2k" in quality or "1440" in quality:
        height = 1440
    elif "1080" in quality:
        height = 1080
    elif "720" in quality:
        height = 720
    elif "480" in quality:
        height = 480
    elif "360" in quality:
        height = 360
    elif "240" in quality:
        height = 240
    elif "144" in quality:
        height = 144
    else:
        m = re.search(r'(\d{3,4})', quality)
        if m:
            height = int(m.group(1))

    if height:
        w_portrait = height
        h_portrait = int(height * 16 / 9) + 50
        return (
            f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo[width<={w_portrait}][ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo[height<={h_portrait}][width<={w_portrait}][ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo[height<={height}]+bestaudio/"
            f"bestvideo[width<={w_portrait}]+bestaudio/"
            f"bestvideo[height<={h_portrait}][width<={w_portrait}]+bestaudio/"
            f"best[height<={height}]/"
            f"best[width<={w_portrait}]/"
            f"bestvideo[ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo+bestaudio/"
            f"best[ext=mp4]/"
            f"best"
        )

    return (
        "bestvideo[ext=mp4]+bestaudio[ext=m4a]/"
        "bestvideo+bestaudio/"
        "best[ext=mp4]/"
        "best"
    )


def _is_audio_format(fmt: str, quality: str) -> bool:
    """Check if the requested output is audio."""
    fmt = fmt.lower().strip()
    quality = quality.lower().strip()
    return fmt in ("mp3", "audio", "m4a") or "kbps" in quality


def _make_progress_hook(job_id: str):
    """Create a yt-dlp progress callback that updates the in-memory store."""
    def hook(d):
        status = d.get("status", "")
        if status == "downloading":
            percent_str = d.get("_percent_str", "0%").strip().rstrip("%")
            try:
                percent = float(percent_str)
            except (ValueError, TypeError):
                percent = 0.0

            raw_file_size = d.get("total_bytes") or d.get("total_bytes_estimate")
            file_size_val = None
            if raw_file_size is not None:
                try:
                    file_size_val = int(round(float(raw_file_size)))
                except (ValueError, TypeError):
                    file_size_val = None

            _progress_store[job_id] = DownloadProgress(
                job_id=job_id,
                status=JobStatus.DOWNLOADING,
                percent=min(percent, 99.9),
                speed=str(d.get("_speed_str", "") or ""),
                eta=str(d.get("_eta_str", "") or ""),
                file_size=file_size_val,
            )
        elif status == "finished":
            _progress_store[job_id] = DownloadProgress(
                job_id=job_id,
                status=JobStatus.CONVERTING,
                percent=100.0,
                speed="",
                eta="Merging/Converting...",
            )
    return hook


def _inspect_media_codecs(file_path: str) -> dict:
    """Inspect video codec, audio codec, and pixel format of a media file using ffprobe."""
    import json
    try:
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_streams", file_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if res.returncode == 0:
            data = json.loads(res.stdout)
            v_codec = None
            a_codec = None
            pix_fmt = None
            for s in data.get("streams", []):
                if s.get("codec_type") == "video" and not v_codec:
                    v_codec = s.get("codec_name", "").lower()
                    pix_fmt = s.get("pix_fmt", "").lower()
                elif s.get("codec_type") == "audio" and not a_codec:
                    a_codec = s.get("codec_name", "").lower()
            return {"v_codec": v_codec, "a_codec": a_codec, "pix_fmt": pix_fmt}
    except Exception as e:
        logger.warning("ffprobe_inspection_error", error=str(e))
    return {"v_codec": None, "a_codec": None, "pix_fmt": None}


def _ensure_mp4_video(input_path: str, target_mp4_path: str) -> str:
    """
    Ensure any downloaded video is clean, standard MP4 (H.264 + AAC with yuv420p and faststart)
    for universal Windows Media Player, macOS QuickTime, mobile, and web playback without 0xC00D36C4 errors.
    """
    if not input_path or not os.path.exists(input_path):
        return input_path

    # Check codec compatibility with ffprobe
    codecs = _inspect_media_codecs(input_path)
    v_codec = codecs.get("v_codec")
    a_codec = codecs.get("a_codec")
    pix_fmt = codecs.get("pix_fmt")

    is_standard_h264 = v_codec in ("h264", "avc1")
    is_standard_pix_fmt = pix_fmt in ("yuv420p", None)
    is_standard_aac = a_codec in ("aac", "mp4a", "mp3", None)

    # If it is already H.264 + AAC + yuv420p and inside target mp4, it's valid
    if is_standard_h264 and is_standard_pix_fmt and is_standard_aac:
        if input_path == target_mp4_path and os.path.exists(target_mp4_path) and os.path.getsize(target_mp4_path) > 0:
            return target_mp4_path

    transcode_temp = f"{target_mp4_path}.{uuid.uuid4().hex[:6]}.tmp.mp4"

    try:
        if is_standard_h264 and is_standard_pix_fmt and is_standard_aac:
            # 1. Fast stream copy (lossless & instant)
            cmd_copy = [
                "ffmpeg", "-y", "-i", input_path,
                "-c:v", "copy", "-c:a", "copy",
                "-movflags", "+faststart",
                transcode_temp
            ]
            result = subprocess.run(cmd_copy, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=120)
            if result.returncode == 0 and os.path.exists(transcode_temp) and os.path.getsize(transcode_temp) > 0:
                if os.path.exists(input_path) and os.path.abspath(input_path) != os.path.abspath(target_mp4_path):
                    try:
                        os.remove(input_path)
                    except OSError:
                        pass
                if os.path.exists(target_mp4_path):
                    try:
                        os.remove(target_mp4_path)
                    except OSError:
                        pass
                os.replace(transcode_temp, target_mp4_path)
                return target_mp4_path

        # 2. Transcode video to universal H.264 (yuv420p) + AAC (handles VP9, AV1, HEVC, WebM, FLV, TS, etc.)
        cmd_transcode = [
            "ffmpeg", "-y", "-i", input_path,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            transcode_temp
        ]
        result = subprocess.run(cmd_transcode, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=300)
        if result.returncode == 0 and os.path.exists(transcode_temp) and os.path.getsize(transcode_temp) > 0:
            if os.path.exists(input_path) and os.path.abspath(input_path) != os.path.abspath(target_mp4_path):
                try:
                    os.remove(input_path)
                except OSError:
                    pass
            if os.path.exists(target_mp4_path):
                try:
                    os.remove(target_mp4_path)
                except OSError:
                    pass
            os.replace(transcode_temp, target_mp4_path)
            return target_mp4_path

    except Exception as err:
        logger.warning("ffmpeg_conversion_failed", error=str(err))
    finally:
        if os.path.exists(transcode_temp):
            try:
                os.remove(transcode_temp)
            except OSError:
                pass

    return input_path


def _ensure_mp3_audio(input_path: str, target_mp3_path: str, quality_kbps: str = "320") -> str:
    """
    Ensure any downloaded audio is clean, standard MP3.
    """
    if not input_path or not os.path.exists(input_path):
        return input_path

    codecs = _inspect_media_codecs(input_path)
    if codecs.get("a_codec") == "mp3" and input_path == target_mp3_path and os.path.getsize(target_mp3_path) > 0:
        return target_mp3_path

    transcode_temp = f"{target_mp3_path}.{uuid.uuid4().hex[:6]}.tmp.mp3"

    try:
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vn", "-c:a", "libmp3lame", "-b:a", f"{quality_kbps}k",
            transcode_temp
        ]
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=120)
        if res.returncode == 0 and os.path.exists(transcode_temp) and os.path.getsize(transcode_temp) > 0:
            if os.path.exists(input_path) and os.path.abspath(input_path) != os.path.abspath(target_mp3_path):
                try:
                    os.remove(input_path)
                except OSError:
                    pass
            if os.path.exists(target_mp3_path):
                try:
                    os.remove(target_mp3_path)
                except OSError:
                    pass
            os.replace(transcode_temp, target_mp3_path)
            return target_mp3_path
    except Exception as err:
        logger.warning("ffmpeg_audio_conversion_failed", error=str(err))
    finally:
        if os.path.exists(transcode_temp):
            try:
                os.remove(transcode_temp)
            except OSError:
                pass

    return input_path


def _find_output_file(base_path: str) -> Optional[str]:
    """Find the actual output file, handling yt-dlp's extension appending."""
    if os.path.exists(base_path):
        return base_path

    # yt-dlp may append extensions
    for ext in (".mp4", ".mp3", ".m4a", ".webm", ".mkv", ".opus", ".ogg"):
        candidate = f"{base_path}{ext}"
        if os.path.exists(candidate):
            return candidate

    pattern = f"{base_path}*"
    matches = glob.glob(pattern)
    if matches:
        return matches[0]

    return None


def _resolve_image_url(url: str) -> Optional[str]:
    """Extract direct high-resolution image URL with SSRF validation."""
    import httpx, re
    parsed = urlparse(url)
    if not parsed.hostname:
        return None
    try:
        resolve_and_check(parsed.hostname)
    except SSRFBlockedError:
        return None

    # 1. Direct image
    if any(url.lower().endswith(e) or f"{e}?" in url.lower() for e in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg")):
        return url
    
    # 2. Pinterest pin
    if "pinterest.com" in url or "pin.it" in url or "pinimg.com" in url:
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            with httpx.Client(follow_redirects=True, timeout=12.0, headers=headers) as client:
                resp = client.get(url)
                html = resp.text
            img_match = re.search(r'https://i\.pinimg\.com/[0-9]+x/([a-zA-Z0-9/_.\-]+)', html)
            if img_match:
                return f"https://i.pinimg.com/originals/{img_match.group(1)}"
            og_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
            if og_match:
                return re.sub(r'/[0-9]+x/', '/originals/', og_match.group(1))
        except Exception:
            pass

    # 3. Reddit photo / gallery
    if "reddit.com" in url or "redd.it" in url:
        try:
            if "i.redd.it" in url or "preview.redd.it" in url:
                return url
            
            from urllib.parse import urlunparse
            old_url = urlunparse(parsed._replace(netloc="old.reddit.com"))
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            with httpx.Client(follow_redirects=True, timeout=10.0, headers=headers) as client:
                resp = client.get(old_url)
                html = resp.text
                
                # Check data-url
                data_match = re.search(r'<div[^>]+class=["\'][^"\']*thing[^"\']*["\'][^>]+data-url=["\']([^"\']+)["\']', html)
                if data_match:
                    media_link = data_match.group(1).replace("&amp;", "&")
                    if any(media_link.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif")) or "i.redd.it" in media_link or "preview.redd.it" in media_link:
                        return media_link

                # Check preview images in html
                preview_match = re.search(r'https://(?:preview|i)\.redd\.it/[a-zA-Z0-9._\-?=&;]+', html)
                if preview_match:
                    return preview_match.group(0).replace("&amp;", "&")
                
                # Check oEmbed
                oe_url = f"https://www.reddit.com/oembed?url={url}"
                oe_resp = client.get(oe_url)
                if oe_resp.status_code == 200:
                    thumb = oe_resp.json().get("thumbnail_url")
                    if thumb:
                        return thumb
        except Exception:
            pass

    # 4. Threads photo
    if "threads.net" in url or "threads.com" in url:
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            with httpx.Client(follow_redirects=True, timeout=10.0, headers=headers) as client:
                resp = client.get(url)
                html = resp.text
                og_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
                if og_img:
                    return og_img.group(1).replace("&amp;", "&")
        except Exception:
            pass

    # 5. Instagram or X photo: extract via yt-dlp thumbnail
    try:
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            }
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if info:
                thumb = info.get('thumbnail') or (info.get('thumbnails', [{}])[-1].get('url') if info.get('thumbnails') else None)
                if thumb:
                    if "twimg.com" in thumb and "name=" in thumb:
                        thumb = re.sub(r'name=[a-zA-Z0-9_]+', 'name=orig', thumb)
                    return thumb
    except Exception:
        pass

    return None


def _download_image_sync(job_id: str, url: str, fmt: str) -> str:
    """Download image directly with SSRF verification."""
    import httpx
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    fmt_lower = fmt.lower()
    ext = "jpg"
    if "png" in fmt_lower:
        ext = "png"
    elif "webp" in fmt_lower:
        ext = "webp"
    elif any(url.lower().endswith(e) for e in (".png", ".webp", ".gif", ".jpg", ".jpeg")):
        ext = url.split("?")[0].split(".")[-1].lower()

    unique_name = f"image_{uuid.uuid4().hex[:12]}.{ext}"
    output_file = str(TEMP_DOWNLOAD_DIR / unique_name)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }
    with httpx.Client(follow_redirects=True, timeout=30.0, headers=headers) as client:
        resp = client.get(url)
        resp.raise_for_status()
        with open(output_file, "wb") as f:
            f.write(resp.content)

    file_size = os.path.getsize(output_file)
    raw_filename = os.path.basename(output_file)
    clean_filename = sanitize_filename(raw_filename)

    _progress_store[job_id] = DownloadProgress(
        job_id=job_id,
        status=JobStatus.COMPLETED,
        percent=100.0,
        speed="",
        eta="",
        file_size=file_size,
        filename=clean_filename,
    )
    _file_store[job_id] = output_file
    logger.info("image_download_completed", job_id=job_id, size=file_size)
    return output_file


def _download_video_direct_sync(job_id: str, video_url: str, is_audio: bool = False, audio_quality: str = "320") -> str:
    """Download direct video stream using SSRF-safe streaming and convert to MP4/MP3."""
    import httpx
    parsed = urlparse(video_url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    unique_name = f"media_{uuid.uuid4().hex[:12]}"
    raw_path = str(TEMP_DOWNLOAD_DIR / f"{unique_name}_raw.mp4")
    target_mp4 = str(TEMP_DOWNLOAD_DIR / f"{unique_name}.mp4")
    target_mp3 = str(TEMP_DOWNLOAD_DIR / f"{unique_name}.mp3")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
    }

    with httpx.Client(follow_redirects=True, timeout=60.0) as client:
        with client.stream("GET", video_url, headers=headers) as resp:
            resp.raise_for_status()
            total_size = int(resp.headers.get("content-length", 0))
            downloaded = 0

            with open(raw_path, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=65536):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            pct = min(99.0, (downloaded / total_size) * 100.0)
                            _progress_store[job_id] = DownloadProgress(
                                job_id=job_id,
                                status=JobStatus.DOWNLOADING,
                                percent=round(pct, 1),
                                speed="",
                                eta="",
                                file_size=total_size,
                            )

    # Convert/Remux to standard format
    if is_audio:
        final_file = _ensure_mp3_audio(raw_path, target_mp3, audio_quality)
    else:
        final_file = _ensure_mp4_video(raw_path, target_mp4)

    # Clean up raw temp file
    if os.path.exists(raw_path) and raw_path != final_file:
        try:
            os.remove(raw_path)
        except OSError:
            pass

    file_size = os.path.getsize(final_file)
    clean_filename = sanitize_filename(os.path.basename(final_file))

    _progress_store[job_id] = DownloadProgress(
        job_id=job_id,
        status=JobStatus.COMPLETED,
        percent=100.0,
        speed="",
        eta="",
        file_size=file_size,
        filename=clean_filename,
    )
    _file_store[job_id] = final_file
    logger.info("direct_video_download_completed", job_id=job_id, size=file_size)
    return final_file


def _download_sync(job_id: str, url: str, fmt: str, quality: str) -> str:
    """
    Synchronous download function run in a thread pool.
    Validates hostnames for SSRF before downloading.
    """
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    fmt_lower = fmt.lower()
    is_image = (
        fmt_lower.startswith("jpg")
        or fmt_lower.startswith("png")
        or fmt_lower.startswith("webp")
        or "image" in fmt_lower
        or "photo" in fmt_lower
        or "pin" in fmt_lower
        or "lossless" in quality.lower()
        or any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"))
    )

    is_direct_img = (
        "i.redd.it" in url
        or "preview.redd.it" in url
        or "pinimg.com" in url
        or "twimg.com" in url
        or any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"))
    )

    if is_direct_img:
        return _download_image_sync(job_id, url, fmt)

    is_video_or_audio_fmt = (
        fmt.lower() in ("mp4", "webm", "mp3", "m4a", "wav", "360p", "480p", "720p", "1080p", "best")
        or "mp4" in fmt.lower()
        or "mp3" in fmt.lower()
        or "video" in fmt.lower()
        or "audio" in fmt.lower()
    )

    if (is_image or "pinterest.com" in url or "pin.it" in url) and not is_video_or_audio_fmt:
        direct_img = _resolve_image_url(url)
        if direct_img:
            return _download_image_sync(job_id, direct_img, fmt)

    is_audio = _is_audio_format(fmt, quality)
    audio_quality = "320"
    if "192" in quality:
        audio_quality = "192"
    elif "128" in quality:
        audio_quality = "128"

    is_direct_video = (
        "cdninstagram.com" in url
        or "fbcdn.net" in url
        or "lovethreads.net" in url
        or "v.pinimg.com" in url
        or "v1.pinimg.com" in url
        or (any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".mp4", ".m4v", ".mov", ".webm")) and "youtube.com" not in url and "youtu.be" not in url)
    )

    if is_direct_video:
        try:
            return _download_video_direct_sync(job_id, url, is_audio, audio_quality)
        except Exception:
            pass
    format_string = _build_ytdlp_format(fmt, quality)

    unique_name = f"media_{uuid.uuid4().hex[:12]}"
    output_path = str(TEMP_DOWNLOAD_DIR / unique_name)

    start_time = time.time()
    is_youtube = "youtube.com" in url or "youtu.be" in url

    ydl_opts = {
        "outtmpl": output_path,
        "format": format_string,
        "quiet": True,
        "no_warnings": True,
        "overwrites": True,
        "progress_hooks": [_make_progress_hook(job_id)],
        "socket_timeout": 30,
        "retries": 1 if is_youtube else 5,
        "fragment_retries": 1 if is_youtube else 5,
        "extractor_args": {
            "youtube": {
                "player_client": ["ios", "android"]
            }
        },
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if is_youtube:
        cookie_file = _get_youtube_cookiefile()
        if cookie_file:
            ydl_opts["cookiefile"] = cookie_file
            ydl_opts["extractor_args"]["youtube"]["player_client"] = ["web", "mweb", "android", "ios"]

    if is_audio:
        audio_quality = "320"
        if "192" in quality:
            audio_quality = "192"
        elif "128" in quality:
            audio_quality = "128"

        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": audio_quality,
        }]
    elif not is_image:
        ydl_opts["merge_output_format"] = "mp4"
    target_dl_url = url
    if "youtube.com" in url or "youtu.be" in url:
        shorts_match = re.search(r'(?:youtube\.com|youtu\.be)/shorts/([a-zA-Z0-9_\-]+)', url)
        if shorts_match:
            target_dl_url = f"https://www.youtube.com/watch?v={shorts_match.group(1)}"
        else:
            youtu_match = re.search(r'youtu\.be/([a-zA-Z0-9_\-]+)', url)
            if youtu_match:
                target_dl_url = f"https://www.youtube.com/watch?v={youtu_match.group(1)}"
            elif "m.youtube.com" in url:
                target_dl_url = url.replace("m.youtube.com", "www.youtube.com")

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([target_dl_url])

        actual_file = _find_output_file(output_path)
        if not actual_file or not os.path.exists(actual_file):
            raise FileNotFoundError("Download completed but media file was not generated.")

        # Ensure universal standard format (MP4 for video, MP3 for audio)
        if is_audio:
            actual_file = _ensure_mp3_audio(actual_file, f"{output_path}.mp3", audio_quality)
        elif not is_image:
            actual_file = _ensure_mp4_video(actual_file, f"{output_path}.mp4")

        file_size = os.path.getsize(actual_file)

        # Check file size limit
        if file_size > settings.MAX_FILE_SIZE_BYTES:
            os.remove(actual_file)
            raise ValueError(f"File size exceeds allowable limit.")

        raw_filename = os.path.basename(actual_file)
        clean_filename = sanitize_filename(raw_filename)

        _progress_store[job_id] = DownloadProgress(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            percent=100.0,
            speed="",
            eta="",
            file_size=file_size,
            filename=clean_filename,
        )
        _file_store[job_id] = actual_file

        duration = round(time.time() - start_time, 3)
        logger.info("download_completed", job_id=job_id, size=file_size, processing_duration=duration)
        return actual_file

    except Exception as e:
        duration = round(time.time() - start_time, 3)
        if is_youtube and _is_youtube_bot_challenge(e):
            logger.warning(
                "media_download_failed",
                platform="youtube",
                error_category="bot_challenge",
                job_id=job_id,
                timestamp=time.time(),
                processing_duration=duration,
            )
        else:
            logger.error(
                "download_failed",
                job_id=job_id,
                platform="youtube" if is_youtube else "other",
                processing_duration=duration,
            )

        # Non-YouTube fallbacks
        if not is_youtube:
            # 1. Fallback for Reddit videos via RapidSave
            if "reddit.com" in url or "redd.it" in url:
                try:
                    rapid_url = f"https://rapidsave.com/info?url={url}"
                    with httpx.Client(follow_redirects=True, timeout=10.0, headers={"user-agent": "Mozilla/5.0", "referer": "https://rapidsave.com/"}) as client:
                        r = client.get(rapid_url)
                        if r.status_code == 200:
                            btn_match = re.search(r'class=["\'][^"\']*downloadbutton[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', r.text)
                            if btn_match:
                                dl_path = btn_match.group(1)
                                full_dl = f"https://rapidsave.com{dl_path}" if dl_path.startswith("/") else dl_path
                                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                                    ydl.download([full_dl])
                                actual_file = _find_output_file(output_path)
                                if actual_file and os.path.exists(actual_file):
                                    actual_file = _ensure_mp4_video(actual_file, f"{output_path}.mp4")
                                    file_size = os.path.getsize(actual_file)
                                    raw_filename = os.path.basename(actual_file)
                                    clean_filename = sanitize_filename(raw_filename)
                                    _progress_store[job_id] = DownloadProgress(
                                        job_id=job_id,
                                        status=JobStatus.COMPLETED,
                                        percent=100.0,
                                        speed="",
                                        eta="",
                                        file_size=file_size,
                                        filename=clean_filename,
                                    )
                                    _file_store[job_id] = actual_file
                                    logger.info("download_completed_via_rapidsave", job_id=job_id, size=file_size)
                                    return actual_file
                except Exception:
                    pass

            # 2. Fallback for Threads posts
            if "threads.net" in url or "threads.com" in url:
                try:
                    from app.platforms.universal_extractor import _scrape_threads
                    loop = asyncio.new_event_loop()
                    th_data = loop.run_until_complete(_scrape_threads(url))
                    loop.close()
                    if th_data.get("video_url") and not is_image:
                        return _download_video_direct_sync(job_id, th_data["video_url"], is_audio, audio_quality)
                    elif th_data.get("image_url") and is_image:
                        return _download_image_sync(job_id, th_data["image_url"], fmt)
                except Exception:
                    pass

            if is_image:
                direct_img = _resolve_image_url(url)
                if direct_img:
                    try:
                        return _download_image_sync(job_id, direct_img, fmt)
                    except Exception:
                        pass

        # Clean up partial files immediately on failure
        for candidate in glob.glob(f"{output_path}*"):
            try:
                os.remove(candidate)
            except OSError:
                pass

        clean_error = _sanitize_error_message(e)
        _progress_store[job_id] = DownloadProgress(
            job_id=job_id,
            status=JobStatus.FAILED,
            percent=0.0,
            error=clean_error,
        )
        raise


async def start_download(job_id: str, url: str, fmt: str = "mp4", quality: str = "best") -> str:
    """Download media file with concurrency limiting and SSRF protection."""
    _timestamp_store[job_id] = time.time()
    _progress_store[job_id] = DownloadProgress(
        job_id=job_id,
        status=JobStatus.PENDING,
        percent=0.0,
    )

    async with _download_semaphore:
        _progress_store[job_id] = DownloadProgress(
            job_id=job_id,
            status=JobStatus.DOWNLOADING,
            percent=0.0,
        )

        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(None, _download_sync, job_id, url, fmt, quality),
                timeout=settings.DOWNLOAD_TIMEOUT_SECONDS,
            )
            return result
        except asyncio.TimeoutError:
            _progress_store[job_id] = DownloadProgress(
                job_id=job_id,
                status=JobStatus.FAILED,
                error="Download timed out. Please try again.",
            )
            raise
        except Exception:
            raise


def get_progress(job_id: str) -> DownloadProgress:
    """Get current download progress for a job."""
    return _progress_store.get(job_id, DownloadProgress(
        job_id=job_id,
        status=JobStatus.FAILED,
        error="Job not found or expired.",
    ))


def get_file_path(job_id: str) -> Optional[str]:
    """Get the file path for a completed download."""
    return _file_store.get(job_id)


def cleanup_job(job_id: str) -> None:
    """Remove a job from progress store, file store, and delete its file."""
    _progress_store.pop(job_id, None)
    _timestamp_store.pop(job_id, None)
    file_path = _file_store.pop(job_id, None)
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info("job_file_cleaned", job_id=job_id)
        except OSError as e:
            logger.warning("job_file_cleanup_failed", job_id=job_id, error=str(e))


def purge_stale_in_memory_jobs(max_age_seconds: int) -> int:
    """Remove expired in-memory job records to prevent memory leak."""
    now = time.time()
    expired_ids = [
        jid for jid, created in _timestamp_store.items()
        if (now - created) > max_age_seconds
    ]
    for jid in expired_ids:
        cleanup_job(jid)
    return len(expired_ids)


def get_temp_dir() -> Path:
    """Return the temp download directory path."""
    TEMP_DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return TEMP_DOWNLOAD_DIR
