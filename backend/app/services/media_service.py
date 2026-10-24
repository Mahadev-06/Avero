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


def _get_platform_cookiefile(platform: str = "general") -> str | None:
    """Return path to cookie file for specified platform or general cookies."""
    platform = platform.lower()

    # 1. Platform-specific file path
    if platform == "youtube" and settings.YOUTUBE_COOKIES_FILE and os.path.exists(settings.YOUTUBE_COOKIES_FILE):
        return settings.YOUTUBE_COOKIES_FILE
    if platform == "instagram" and settings.INSTAGRAM_COOKIES_FILE and os.path.exists(settings.INSTAGRAM_COOKIES_FILE):
        return settings.INSTAGRAM_COOKIES_FILE
    if platform == "threads" and getattr(settings, "THREADS_COOKIES_FILE", None) and os.path.exists(settings.THREADS_COOKIES_FILE):
        return settings.THREADS_COOKIES_FILE
    if platform in ("x", "x_twitter", "twitter") and getattr(settings, "X_COOKIES_FILE", None) and os.path.exists(settings.X_COOKIES_FILE):
        return settings.X_COOKIES_FILE
    if platform == "reddit" and getattr(settings, "REDDIT_COOKIES_FILE", None) and os.path.exists(settings.REDDIT_COOKIES_FILE):
        return settings.REDDIT_COOKIES_FILE
    if settings.COOKIES_FILE and os.path.exists(settings.COOKIES_FILE):
        return settings.COOKIES_FILE

    # 2. Platform-specific Base64
    b64_val = None
    if platform == "youtube":
        b64_val = getattr(settings, "YOUTUBE_COOKIES_B64", None) or os.getenv("YOUTUBE_COOKIES_B64")
    elif platform == "instagram":
        b64_val = getattr(settings, "INSTAGRAM_COOKIES_B64", None) or os.getenv("INSTAGRAM_COOKIES_B64")
    elif platform == "threads":
        b64_val = getattr(settings, "THREADS_COOKIES_B64", None) or os.getenv("THREADS_COOKIES_B64")
    elif platform in ("x", "x_twitter", "twitter"):
        b64_val = getattr(settings, "X_COOKIES_B64", None) or os.getenv("X_COOKIES_B64")
    elif platform == "reddit":
        b64_val = getattr(settings, "REDDIT_COOKIES_B64", None) or os.getenv("REDDIT_COOKIES_B64")
    if not b64_val:
        b64_val = getattr(settings, "COOKIES_B64", None) or os.getenv("COOKIES_B64")

    if b64_val and b64_val.strip():
        try:
            import base64
            decoded = base64.b64decode(b64_val.strip()).decode("utf-8")
            cookie_path = str(TEMP_DOWNLOAD_DIR / f"{platform}_cookies.txt")
            with open(cookie_path, "w", encoding="utf-8") as f:
                f.write(decoded)
            return cookie_path
        except Exception as e:
            logger.warning("failed_to_decode_b64_cookies", platform=platform, error=str(e))

    # 3. Platform-specific raw text
    raw_text = None
    if platform == "youtube":
        raw_text = settings.YOUTUBE_COOKIES_TEXT or os.getenv("YOUTUBE_COOKIES_TEXT")
    elif platform == "instagram":
        raw_text = settings.INSTAGRAM_COOKIES_TEXT or os.getenv("INSTAGRAM_COOKIES_TEXT")
    elif platform == "threads":
        raw_text = getattr(settings, "THREADS_COOKIES_TEXT", None) or os.getenv("THREADS_COOKIES_TEXT")
    elif platform in ("x", "x_twitter", "twitter"):
        raw_text = getattr(settings, "X_COOKIES_TEXT", None) or os.getenv("X_COOKIES_TEXT")
    elif platform == "reddit":
        raw_text = getattr(settings, "REDDIT_COOKIES_TEXT", None) or os.getenv("REDDIT_COOKIES_TEXT")
    if not raw_text:
        raw_text = settings.COOKIES_TEXT or os.getenv("COOKIES_TEXT")

    if raw_text and raw_text.strip():
        cookie_path = str(TEMP_DOWNLOAD_DIR / f"{platform}_cookies.txt")
        try:
            normalized = raw_text.strip()
            if "\\n" in normalized and "\n" not in normalized:
                normalized = normalized.replace("\\n", "\n").replace("\\t", "\t")
            with open(cookie_path, "w", encoding="utf-8") as f:
                f.write(normalized)
            return cookie_path
        except OSError as e:
            logger.warning("failed_to_write_cookies_file", platform=platform, error=str(e))

    return None


def _get_youtube_cookiefile() -> str | None:
    return _get_platform_cookiefile("youtube")


def _get_instagram_cookiefile() -> str | None:
    return _get_platform_cookiefile("instagram")


def _get_threads_cookiefile() -> str | None:
    """Return Threads cookiefile; falls back to Instagram cookiefile since Threads shares Meta login."""
    return _get_platform_cookiefile("threads") or _get_instagram_cookiefile()


def _get_x_cookiefile() -> str | None:
    return _get_platform_cookiefile("x")


def _get_reddit_cookiefile() -> str | None:
    return _get_platform_cookiefile("reddit")


def _load_cookiejar(cookiefile: str | None):
    """Load Mozilla/Netscape cookie file into an http.cookiejar.MozillaCookieJar."""
    if not cookiefile or not os.path.exists(cookiefile):
        return None
    try:
        import http.cookiejar
        jar = http.cookiejar.MozillaCookieJar(cookiefile)
        jar.load(ignore_discard=True, ignore_expires=True)
        return jar
    except Exception as e:
        logger.warning("failed_to_load_cookiejar", cookiefile=cookiefile, error=str(e))
        return None


# Unified shared YouTube player client lists
YOUTUBE_PLAYER_CLIENTS_DEFAULT: list[str] = [
    "tv_embedded",
    "android",
    "web_embedded",
]
YOUTUBE_PLAYER_CLIENTS_WITH_COOKIES: list[str] = [
    "web",
    "ios",
    "mweb",
    "android",
    "tv_embedded",
]


def get_youtube_player_clients(has_cookies: bool = False) -> list[str]:
    """Return unified YouTube player_client list for both analyze and download pipelines."""
    if has_cookies:
        return list(YOUTUBE_PLAYER_CLIENTS_WITH_COOKIES)
    return list(YOUTUBE_PLAYER_CLIENTS_DEFAULT)


def _is_youtube_unsupported_video(exc: Exception | str) -> bool:
    """Check if YouTube video format is not available or locked by restrictions/SABR."""
    msg = str(exc).lower()
    return any(
        phrase in msg
        for phrase in (
            "requested format is not available",
            "only images are available",
            "no video formats",
            "the page needs to be reloaded",
            "sabr",
            "unsupported_video",
            "no formats found",
            "format is not available",
        )
    )


def _sanitize_error_message(exc: Exception) -> str:
    """Sanitize internal errors to prevent leaking server paths, stack traces, or credentials."""
    if _is_youtube_unsupported_video(exc):
        return "This video can't be downloaded right now due to YouTube restrictions."
    if _is_youtube_bot_challenge(exc):
        return "Unfortunately, YouTube downloads are currently unavailable from our server. Please try again later."
    msg = str(exc).lower()
    if isinstance(exc, SSRFBlockedError) or "ssrf" in msg:
        return "Access to the requested resource is not permitted."
    if "expired" in msg:
        return "This media link has expired. Please re-analyze the Instagram link."
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
        return "bestaudio[ext=m4a]/bestaudio/ba/b/best"

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
            f"bestvideo[height<={height}][vcodec^=avc1]+bestaudio[acodec^=mp4a]/"
            f"bestvideo[width<={w_portrait}][vcodec^=avc1]+bestaudio[acodec^=mp4a]/"
            f"bestvideo[height<={h_portrait}][width<={w_portrait}][vcodec^=avc1]+bestaudio[acodec^=mp4a]/"
            f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo[width<={w_portrait}][ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo[height<={h_portrait}][width<={w_portrait}][ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo[height<={height}]+bestaudio/"
            f"bestvideo[width<={w_portrait}]+bestaudio/"
            f"bestvideo[height<={h_portrait}][width<={w_portrait}]+bestaudio/"
            f"b[height<={height}][ext=mp4]/"
            f"b[width<={w_portrait}][ext=mp4]/"
            f"b[height<={h_portrait}][width<={w_portrait}][ext=mp4]/"
            f"b[height<={height}]/"
            f"b[width<={w_portrait}]/"
            f"b[height<={h_portrait}][width<={w_portrait}]/"
            f"bestvideo*+bestaudio/"
            f"b[ext=mp4]/"
            f"b/"
            f"best[height<={height}]/"
            f"best[width<={w_portrait}]/"
            f"bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/"
            f"bestvideo[ext=mp4]+bestaudio[ext=m4a]/"
            f"bestvideo+bestaudio/"
            f"best[ext=mp4]/"
            f"best"
        )

    return (
        "bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/"
        "bestvideo[ext=mp4]+bestaudio[ext=m4a]/"
        "bestvideo+bestaudio/"
        "bestvideo*+bestaudio/"
        "b[ext=mp4]/"
        "b/"
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
    Ensure any downloaded video is a valid MP4 file.
    If the file is already an MP4, returns immediately without re-encoding.
    If remuxing from another container is needed, performs fast stream copy.
    """
    if not input_path or not os.path.exists(input_path):
        return input_path

    # If it is already an MP4 file with valid content, use it directly
    if input_path.lower().endswith(".mp4") and os.path.getsize(input_path) > 0:
        if input_path == target_mp4_path:
            return target_mp4_path
        try:
            if os.path.exists(target_mp4_path):
                os.remove(target_mp4_path)
            os.replace(input_path, target_mp4_path)
            return target_mp4_path
        except OSError:
            return input_path

    # If it's a non-MP4 video container (e.g. webm/mkv/mov), remux quickly with ffmpeg stream copy
    transcode_temp = f"{target_mp4_path}.{uuid.uuid4().hex[:6]}.tmp.mp4"
    try:
        cmd_copy = [
            "ffmpeg", "-y", "-i", input_path,
            "-c:v", "copy", "-c:a", "copy",
            "-movflags", "+faststart",
            transcode_temp
        ]
        result = subprocess.run(cmd_copy, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=20)
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
        logger.warning("ffmpeg_fast_remux_failed", error=str(err))
    finally:
        if os.path.exists(transcode_temp):
            try:
                os.remove(transcode_temp)
            except OSError:
                pass

    return input_path


def _ensure_mp3_audio(input_path: str, target_mp3_path: str, quality_kbps: str = "320") -> str:
    """
    Ensure any downloaded audio is a clean, standard MP3 file.
    """
    if not input_path or not os.path.exists(input_path):
        return input_path

    if input_path.lower().endswith(".mp3") and os.path.getsize(input_path) > 0:
        if input_path == target_mp3_path:
            return target_mp3_path
        try:
            if os.path.exists(target_mp3_path):
                os.remove(target_mp3_path)
            os.replace(input_path, target_mp3_path)
            return target_mp3_path
        except OSError:
            return input_path

    transcode_temp = f"{target_mp3_path}.{uuid.uuid4().hex[:6]}.tmp.mp3"
    try:
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vn", "-c:a", "libmp3lame", "-b:a", f"{quality_kbps}k",
            transcode_temp
        ]
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=30)
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
    url = url.replace("&amp;", "&")
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
                return url.replace("&amp;", "&")
            
            crawler_headers = {
                "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            with httpx.Client(follow_redirects=True, timeout=8.0, headers=crawler_headers) as client:
                resp = client.get(url)
                html = resp.text
                og_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
                if og_img:
                    img_url = og_img.group(1).replace("&amp;", "&")
                    if not any(img_url.endswith(e) for e in ("reddit_icon.png", "reddit_logo.png", "favicon.ico")):
                        return img_url.replace("&amp;", "&")

            with httpx.Client(follow_redirects=True, timeout=8.0) as client:
                r = client.get(f"https://rapidsave.com/info?url={url}", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
                if r.status_code == 200:
                    img_match = re.search(r'href=["\'](https?://i\.redd\.it/[^"\']+)["\']', r.text)
                    if img_match:
                        return img_match.group(1).replace("&amp;", "&")
        except Exception:
            pass

    # 4. Threads photo
    if "threads.net" in url or "threads.com" in url:
        try:
            crawler_headers = {
                "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            with httpx.Client(follow_redirects=True, timeout=8.0, headers=crawler_headers) as client:
                resp = client.get(url)
                html = resp.text
                og_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
                if og_img:
                    img_url = og_img.group(1).replace("&amp;", "&")
                    if not any(img_url.endswith(e) for e in ("favicon.ico", "threads_logo.png", "kHwIMM5b8PW.webp", "rsrc.php")):
                        return img_url
        except Exception:
            pass

    # 5. Instagram photo: extract full-resolution uncropped image
    if "instagram.com" in url or "instagr.am" in url:
        try:
            from app.platforms.universal_extractor import _scrape_instagram
            loop = asyncio.new_event_loop()
            ig_data = loop.run_until_complete(_scrape_instagram(url))
            loop.close()
            if ig_data.get("image_url"):
                return ig_data["image_url"]
        except Exception:
            pass

    # 6. Instagram or X photo: extract via yt-dlp thumbnail
    try:
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0',
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


def _resolve_video_url(url: str) -> str | None:
    """Resolve direct video stream URL for Reddit or Threads."""
    import httpx
    if "reddit.com" in url or "redd.it" in url:
        try:
            # 1. Social Crawler OpenGraph
            crawler_headers = {
                "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            with httpx.Client(follow_redirects=True, timeout=8.0, headers=crawler_headers) as client:
                resp = client.get(url)
                og_vid = re.search(r'<meta\s+property=["\']og:video(?::secure_url)?["\']\s+content=["\']([^"\']+)["\']', resp.text)
                if og_vid:
                    return og_vid.group(1).replace("&amp;", "&")

            # 2. Rapidsave
            with httpx.Client(follow_redirects=True, timeout=8.0) as client:
                r = client.get(f"https://rapidsave.com/info?url={url}", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
                if r.status_code == 200:
                    btn_match = re.search(r'class=["\'][^"\']*downloadbutton[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', r.text)
                    if btn_match:
                        dl_path = btn_match.group(1)
                        return f"https://rapidsave.com{dl_path}" if dl_path.startswith("/") else dl_path
        except Exception:
            pass

    if "threads.net" in url or "threads.com" in url:
        try:
            crawler_headers = {
                "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            with httpx.Client(follow_redirects=True, timeout=8.0, headers=crawler_headers) as client:
                resp = client.get(url)
                html = resp.text
                og_vid = re.search(r'<meta\s+property=["\']og:video(?::secure_url)?["\']\s+content=["\']([^"\']+)["\']', html)
                if og_vid:
                    return og_vid.group(1).replace("&amp;", "&")
                mp4_matches = re.findall(r'https?:\\?/\\?/[^"\'\\ ]+?(?:cdninstagram\.com|fbcdn\.net)[^"\'\\ ]*?\.mp4[^"\'\\ ]*', html)
                if mp4_matches:
                    return mp4_matches[0].replace(r"\u0026", "&").replace(r"\/", "/")
        except Exception:
            pass

    return None



def _probe_content_type(url: str) -> str:
    """Probe the Content-Type header of a direct stream URL to distinguish images from video/audio."""
    import httpx
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        }
        with httpx.Client(follow_redirects=True, timeout=5.0, headers=headers) as client:
            resp = client.head(url)
            ct = resp.headers.get("content-type", "").lower()
            if ct:
                return ct
            with client.stream("GET", url) as stream_resp:
                return stream_resp.headers.get("content-type", "").lower()
    except Exception:
        return ""


def _download_image_sync(job_id: str, url: str, fmt: str) -> str:
    """Download image directly with SSRF verification, real format conversion (JPG/PNG/WEBP via FFmpeg), and strict magic bytes verification."""
    import httpx

    # Ensure any escaped entities in image URL are cleaned
    url = url.replace("&amp;", "&")
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    fmt_lower = fmt.lower().strip()
    target_ext = "jpg"
    if "png" in fmt_lower:
        target_ext = "png"
    elif "webp" in fmt_lower:
        target_ext = "webp"
    elif "jpg" in fmt_lower or "jpeg" in fmt_lower or "original" in fmt_lower:
        target_ext = "jpg"
    elif any(url.lower().endswith(e) for e in (".png", ".webp", ".gif", ".jpg", ".jpeg")):
        raw_ext = url.split("?")[0].split(".")[-1].lower()
        if raw_ext in ("jpg", "jpeg"):
            target_ext = "jpg"
        elif raw_ext in ("png", "webp"):
            target_ext = raw_ext

    unique_name = f"image_{uuid.uuid4().hex[:12]}.{target_ext}"
    output_file = str(TEMP_DOWNLOAD_DIR / unique_name)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }
    with httpx.Client(follow_redirects=True, timeout=30.0, headers=headers) as client:
        resp = client.get(url)
        if resp.status_code in (403, 410) or ("signature" in resp.text.lower() and "expired" in resp.text.lower()):
            raise ValueError("This media link has expired. Please re-analyze the Instagram link.")
        if resp.status_code != 200:
            raise ValueError(f"Image host returned HTTP status {resp.status_code}")

        content_type = resp.headers.get("content-type", "").lower()
        body = resp.content
        body_len = len(body)

        # Validate against HTML/XML error payloads
        is_html_or_xml = (
            b"<html" in body[:500].lower()
            or b"<!doctype" in body[:500].lower()
            or b"<error" in body[:500].lower()
            or b"accessdenied" in body[:500].lower()
        )
        if is_html_or_xml:
            raise ValueError("Received HTML/XML error payload instead of valid image")

        # Validate source magic bytes
        is_jpeg = body[:2] == b"\xff\xd8"
        is_png = body[:8] == b"\x89PNG\r\n\x1a\n"
        is_webp = body[:4] == b"RIFF" and b"WEBP" in body[:16]
        is_valid_magic = (
            is_jpeg
            or is_png
            or is_webp
            or body[:4] in (b"GIF8", b"II*\x00", b"MM\x00*")  # GIF / TIFF
        )

        if not is_valid_magic and not content_type.startswith("image/"):
            raise ValueError(f"Invalid image format received (Content-Type: {content_type})")

        # Reject corrupted files or small error icons (< 5KB without valid magic)
        if body_len < 1024 or (body_len < 5120 and not is_valid_magic):
            raise ValueError(f"Downloaded image is suspiciously small ({body_len} bytes) or corrupted")

        # Format conversion logic:
        # Keep original bytes if the source format already matches the requested target format
        # or if the target format is "jpg" (the original format from Instagram/CDN) and source is JPEG
        if target_ext == "jpg" and is_jpeg:
            with open(output_file, "wb") as f:
                f.write(body)
        elif target_ext == "png" and is_png:
            with open(output_file, "wb") as f:
                f.write(body)
        elif target_ext == "webp" and is_webp:
            with open(output_file, "wb") as f:
                f.write(body)
        else:
            # Transcode image using ffmpeg to the requested format (PNG / WEBP / JPG)
            temp_src = str(TEMP_DOWNLOAD_DIR / f"src_{uuid.uuid4().hex[:12]}.tmp")
            try:
                with open(temp_src, "wb") as f:
                    f.write(body)

                cmd = ["ffmpeg", "-y", "-i", temp_src, output_file]
                res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=25)
                if res.returncode != 0 or not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
                    err_msg = res.stderr.decode("utf-8", errors="ignore")[:200] if res.stderr else "Conversion failed"
                    raise ValueError(f"Image conversion to {target_ext.upper()} failed: {err_msg}")
            finally:
                if os.path.exists(temp_src):
                    try:
                        os.remove(temp_src)
                    except OSError:
                        pass

        # Strict verification of magic bytes: Never save mislabeled bytes!
        if not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
            raise ValueError(f"Failed to generate {target_ext.upper()} image file.")

        with open(output_file, "rb") as f:
            header = f.read(16)

        is_correct_magic = False
        if target_ext == "jpg" and header[:2] == b"\xff\xd8":
            is_correct_magic = True
        elif target_ext == "png" and header[:8] == b"\x89PNG\r\n\x1a\n":
            is_correct_magic = True
        elif target_ext == "webp" and (header[:4] == b"RIFF" and b"WEBP" in header[:16]):
            is_correct_magic = True

        if not is_correct_magic:
            try:
                os.remove(output_file)
            except OSError:
                pass
            raise ValueError(
                f"Image conversion check failed: Output file does not have valid {target_ext.upper()} magic bytes (header: {header[:8].hex()})"
            )

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
    logger.info("image_download_completed", job_id=job_id, format=target_ext, size=file_size)
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

    with httpx.Client(follow_redirects=True, timeout=60.0, headers=headers) as client:
        with client.stream("GET", video_url, headers=headers) as resp:
            if resp.status_code in (403, 410):
                raise ValueError("This media link has expired. Please re-analyze the Instagram link.")
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

    file_size = os.path.getsize(final_file) if os.path.exists(final_file) else 0
    raw_filename = os.path.basename(final_file)
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
    _file_store[job_id] = final_file
    logger.info("direct_video_download_completed", job_id=job_id, size=file_size)
    return final_file


def _download_sync(job_id: str, url: str, fmt: str, quality: str, media_type: str | None = None, slide_index: int | None = None) -> str:
    """
    Synchronous download function run in a thread pool.
    Validates hostnames for SSRF before downloading.
    """
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    if slide_index is None:
        m = re.search(r"#slide=(\d+)", url)
        if m:
            slide_index = int(m.group(1))

    clean_url = url.split("#")[0]

    fmt_lower = fmt.lower().strip()
    media_type_lower = (media_type or "").lower().strip()

    is_image = (
        media_type_lower == "image"
        or fmt_lower in ("jpg", "jpeg", "png", "webp", "image", "photo")
        or fmt_lower.startswith("jpg")
        or fmt_lower.startswith("png")
        or fmt_lower.startswith("webp")
        or "image" in fmt_lower
        or "photo" in fmt_lower
        or "pin" in fmt_lower
        or any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".heic"))
    )

    is_direct_img = (
        "i.redd.it" in url
        or "preview.redd.it" in url
        or "pinimg.com" in url
        or "twimg.com" in url
        or any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".heic"))
    )

    if is_direct_img and (is_image or not any(fmt_lower.startswith(v) for v in ("mp4", "mp3", "webm", "audio", "video"))):
        return _download_image_sync(job_id, url, fmt)

    is_video_or_audio_fmt = (
        media_type_lower in ("video", "audio")
        or fmt_lower in ("mp4", "webm", "mp3", "m4a", "wav", "360p", "480p", "720p", "1080p", "best")
        or "mp4" in fmt_lower
        or "mp3" in fmt_lower
        or "video" in fmt_lower
        or "audio" in fmt_lower
    )

    if (is_image or "pinterest.com" in url or "pin.it" in url or "reddit.com" in url or "redd.it" in url or "threads.net" in url or "threads.com" in url or "instagram.com" in url or "instagr.am" in url) and not is_video_or_audio_fmt:
        direct_img = _resolve_image_url(url)
        if direct_img:
            return _download_image_sync(job_id, direct_img, fmt)

    is_audio = _is_audio_format(fmt, quality) or media_type_lower == "audio"
    audio_quality = "320"
    if "192" in quality:
        audio_quality = "192"
    elif "128" in quality:
        audio_quality = "128"

    # For direct media stream hosts:
    # Do NOT decide video vs image based on "cdninstagram.com" in url!
    # An image/* response from cdninstagram or fbcdn MUST go down the image path.
    is_direct_host = (
        "cdninstagram.com" in url
        or "fbcdn.net" in url
        or "lovethreads.net" in url
        or "v.pinimg.com" in url
        or "v1.pinimg.com" in url
        or any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".mp4", ".m4v", ".mov", ".webm"))
    )

    if is_direct_host and ("youtube.com" not in url and "youtu.be" not in url):
        # 1. If the user or analyze result classified this as an image:
        if is_image and not is_video_or_audio_fmt:
            return _download_image_sync(job_id, url, fmt)

        # 2. Probe Content-Type to reliably route image vs video stream:
        probed_ct = _probe_content_type(url)
        if probed_ct.startswith("image/"):
            return _download_image_sync(job_id, url, fmt)
        elif probed_ct.startswith("video/") or probed_ct.startswith("application/"):
            try:
                return _download_video_direct_sync(job_id, url, is_audio, audio_quality)
            except Exception:
                pass

    if ("reddit.com" in url or "redd.it" in url or "threads.net" in url or "threads.com" in url) and is_video_or_audio_fmt:
        direct_vid = _resolve_video_url(url)
        if direct_vid:
            try:
                return _download_video_direct_sync(job_id, direct_vid, is_audio, audio_quality)
            except Exception:
                pass

    format_string = _build_ytdlp_format(fmt, quality)

    unique_name = f"media_{uuid.uuid4().hex[:12]}"
    output_path = str(TEMP_DOWNLOAD_DIR / unique_name)

    start_time = time.time()
    is_youtube = "youtube.com" in url or "youtu.be" in url
    is_instagram = "instagram.com" in url or "instagr.am" in url

    yt_cookie_file = _get_youtube_cookiefile() if is_youtube else None
    has_yt_cookies = bool(yt_cookie_file)

    ydl_opts = {
        "outtmpl": output_path,
        "format": format_string,
        "quiet": True,
        "no_warnings": True,
        "overwrites": True,
        "progress_hooks": [_make_progress_hook(job_id)],
        "socket_timeout": 30,
        "retries": 3 if is_youtube else 5,
        "fragment_retries": 3 if is_youtube else 5,
        "extractor_args": {
            "youtube": {
                "player_client": get_youtube_player_clients(has_yt_cookies)
            }
        },
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if is_youtube:
        if yt_cookie_file:
            ydl_opts["cookiefile"] = yt_cookie_file
        ydl_opts["sleep_interval"] = 3
        ydl_opts["sleep_interval_requests"] = 3
    elif is_instagram:
        ig_cookie_file = _get_instagram_cookiefile()
        if ig_cookie_file:
            ydl_opts["cookiefile"] = ig_cookie_file
        if slide_index:
            ydl_opts["playlist_items"] = str(slide_index)
            ydl_opts["noplaylist"] = False
        elif not is_audio and not is_image:
            ydl_opts["format"] = "bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/[format_id$=-2]/[format_id$=-1]/[format_id$=-0]/[format_id$=-3]/3/2/1/0/best"

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
    target_dl_url = clean_url
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
            # Safety check: if an Instagram video downloaded with 0 audio tracks, attempt progressive fallback
            if is_instagram:
                codecs = _inspect_media_codecs(actual_file)
                if not codecs.get("a_codec"):
                    logger.warning("instagram_download_missing_audio_stream_retrying_progressive", file=actual_file)
                    try:
                        ydl_opts_retry = dict(ydl_opts)
                        retry_output_path = f"{output_path}_prog"
                        ydl_opts_retry["outtmpl"] = retry_output_path
                        ydl_opts_retry["format"] = "[format_id$=-2]/[format_id$=-1]/[format_id$=-0]/[format_id$=-3]/3/2/1/0/best"
                        with yt_dlp.YoutubeDL(ydl_opts_retry) as ydl_retry:
                            ydl_retry.download([target_dl_url])
                        retry_file = _find_output_file(retry_output_path)
                        if retry_file and os.path.exists(retry_file):
                            retry_file = _ensure_mp4_video(retry_file, f"{retry_output_path}.mp4")
                            retry_codecs = _inspect_media_codecs(retry_file)
                            if retry_codecs.get("a_codec"):
                                try:
                                    os.remove(actual_file)
                                except OSError:
                                    pass
                                actual_file = retry_file
                    except Exception as retry_err:
                        logger.warning("instagram_audio_retry_failed", error=str(retry_err))

        file_size = os.path.getsize(actual_file)

        # Check file size limit
        if file_size > settings.MAX_FILE_SIZE_BYTES:
            os.remove(actual_file)
            raise ValueError(f"File size exceeds allowable limit.")

        raw_filename = os.path.basename(actual_file)
        clean_filename = sanitize_filename(raw_filename)
        if is_instagram and slide_index:
            shortcode_match = re.search(r"/(?:p|reel)/([A-Za-z0-9_-]+)", clean_url)
            post_id = shortcode_match.group(1) if shortcode_match else "instagram"
            ext = clean_filename.rsplit(".", 1)[-1] if "." in clean_filename else ("mp3" if is_audio else "mp4")
            clean_filename = f"{post_id}_slide_{slide_index:02d}.{ext}"

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
        video_id_match = re.search(r'(?:v=|\/|shorts\/)([0-9A-Za-z_-]{11})', url)
        video_id = video_id_match.group(1) if video_id_match else None
        clients_tried = get_youtube_player_clients(has_yt_cookies) if is_youtube else []

        if is_youtube and _is_youtube_unsupported_video(e):
            logger.warning(
                "youtube_video_unsupported",
                job_id=job_id,
                platform="youtube",
                video_id=video_id,
                url=url,
                player_clients=clients_tried,
                processing_duration=duration,
                raw_error=str(e),
            )
        elif is_youtube and _is_youtube_bot_challenge(e):
            logger.warning(
                "media_download_failed",
                platform="youtube",
                error_category="bot_challenge",
                video_id=video_id,
                url=url,
                player_clients=clients_tried,
                job_id=job_id,
                timestamp=time.time(),
                processing_duration=duration,
                raw_error=str(e),
            )
        else:
            logger.error(
                "download_failed",
                job_id=job_id,
                platform="youtube" if is_youtube else "other",
                video_id=video_id if is_youtube else None,
                player_clients=clients_tried if is_youtube else None,
                processing_duration=duration,
                raw_error=str(e),
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
                    elif th_data.get("image_url"):
                        return _download_image_sync(job_id, th_data["image_url"], fmt)
                except Exception:
                    pass

            # 3. Fallback for Instagram media
            if "instagram.com" in url or "instagr.am" in url:
                try:
                    from app.platforms.universal_extractor import _scrape_instagram
                    loop = asyncio.new_event_loop()
                    ig_data = loop.run_until_complete(_scrape_instagram(url))
                    loop.close()
                    if ig_data.get("video_url") and ("cdninstagram.com" in ig_data["video_url"] or "fbcdn.net" in ig_data["video_url"]):
                        return _download_video_direct_sync(job_id, ig_data["video_url"], is_audio, audio_quality)
                    elif ig_data.get("image_url") and is_image:
                        return _download_image_sync(job_id, ig_data["image_url"], fmt)
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
        error_code = "unsupported_video" if (is_youtube and _is_youtube_unsupported_video(e)) else "download_failed"
        _progress_store[job_id] = DownloadProgress(
            job_id=job_id,
            status=JobStatus.FAILED,
            percent=0.0,
            error=clean_error,
            error_code=error_code,
        )
        raise


def _download_carousel_zip_sync(job_id: str, post_url: str) -> str:
    """
    Download all slides in an Instagram carousel (up to 20 slides),
    verify hostnames against SSRF, cap total size at 200 MB,
    pack into {post_id}_all_slides.zip with files named {post_id}_slide_01.jpg, {post_id}_slide_02.mp4, etc.
    Deletes all intermediate slide files in a finally: block.
    Reuses existing job flow with concurrency and rate limits.
    """
    import zipfile
    import shutil
    import httpx

    parsed = urlparse(post_url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    clean_post_url = post_url.split("#")[0]
    shortcode_match = re.search(r"/(?:p|reel|post)/([A-Za-z0-9_-]+)", clean_post_url)
    post_id = shortcode_match.group(1) if shortcode_match else "carousel"

    MAX_SLIDES = 20
    MAX_TOTAL_BYTES = 200 * 1024 * 1024  # 200 MB

    slide_temp_dir = TEMP_DOWNLOAD_DIR / f"zip_tmp_{job_id}"
    slide_temp_dir.mkdir(parents=True, exist_ok=True)

    try:
        is_threads = "threads.net" in clean_post_url or "threads.com" in clean_post_url
        if is_threads:
            from app.platforms.universal_extractor import _scrape_threads
            loop = asyncio.new_event_loop()
            th_data = loop.run_until_complete(_scrape_threads(clean_post_url))
            loop.close()

            post_id = th_data.get("post_id") or post_id
        zip_output_path = str(TEMP_DOWNLOAD_DIR / f"{post_id}_all_slides_{job_id[:8]}.zip")
            th_slides = th_data.get("slides") or []
            if not th_slides:
                raise ValueError("Could not extract carousel slides from Threads post.")

            entries = []
            for s in th_slides:
                entries.append({
                    "url": s.get("download_url") or s.get("thumbnail_url"),
                    "thumbnails": [{"url": s.get("thumbnail_url") or s.get("download_url")}],
                    "formats": [],
                    "vcodec": "none",
                })
        else:
            ig_cookie_file = _get_instagram_cookiefile()
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "socket_timeout": 30,
            }
            if ig_cookie_file:
                ydl_opts["cookiefile"] = ig_cookie_file

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                try:
                    info = ydl.extract_info(clean_post_url, download=False, process=False)
                except Exception:
                    info = ydl.extract_info(clean_post_url, download=False)

            entries = list(info.get("entries", [])) if (info and info.get("_type") == "playlist") else []
            if not entries:
                if info:
                    entries = [info]
                else:
                    raise ValueError("Could not extract carousel slides from Instagram post.")

        entries = entries[:MAX_SLIDES]
        total_slides = len(entries)
        total_downloaded_bytes = 0
        slide_files_for_zip: list[tuple[str, str]] = []

        for idx, entry in enumerate(entries):
            slide_num = idx + 1
            _progress_store[job_id] = DownloadProgress(
                job_id=job_id,
                status=JobStatus.DOWNLOADING,
                percent=round((idx / total_slides) * 85.0, 1),
                speed="",
                eta=f"Downloading slide {slide_num}/{total_slides}",
                file_size=total_downloaded_bytes,
            )

            slide_formats = entry.get("formats", [])
            has_video = bool(slide_formats and any(f.get("vcodec") != "none" for f in slide_formats)) or bool(entry.get("vcodec") and entry.get("vcodec") != "none")

            if has_video:
                slide_out_base = str(slide_temp_dir / f"slide_{slide_num}")
                v_opts = {
                    "outtmpl": slide_out_base,
                    "format": "bestvideo+bestaudio/best",
                    "merge_output_format": "mp4",
                    "playlist_items": str(slide_num),
                    "quiet": True,
                    "no_warnings": True,
                    "overwrites": True,
                    "socket_timeout": 30,
                }
                if ig_cookie_file:
                    v_opts["cookiefile"] = ig_cookie_file

                with yt_dlp.YoutubeDL(v_opts) as v_ydl:
                    v_ydl.download([clean_post_url])

                downloaded_file = _find_output_file(slide_out_base)
                if not downloaded_file or not os.path.exists(downloaded_file):
                    raise ValueError(f"Failed to download video slide {slide_num}")
                downloaded_file = _ensure_mp4_video(downloaded_file, f"{slide_out_base}.mp4")
                file_ext = "mp4"
            else:
                img_url = (entry.get("thumbnails", [{}])[-1].get("url") if entry.get("thumbnails") else None) or entry.get("url")
                if not img_url:
                    raise ValueError(f"Could not locate image URL for slide {slide_num}")

                img_parsed = urlparse(img_url)
                if img_parsed.hostname:
                    resolve_and_check(img_parsed.hostname)

                slide_out_file = str(slide_temp_dir / f"slide_{slide_num}.jpg")
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                }
                with httpx.Client(follow_redirects=True, timeout=30.0, headers=headers) as client:
                    resp = client.get(img_url)
                    if resp.status_code in (403, 410):
                        raise ValueError("This media link has expired. Please re-analyze the Instagram link.")
                    if resp.status_code != 200:
                        raise ValueError(f"Image host returned HTTP status {resp.status_code}")
                    body = resp.content
                    if body[:4] == b"RIFF" and b"WEBP" in body[:16]:
                        temp_webp = str(slide_temp_dir / f"slide_{slide_num}.webp")
                        with open(temp_webp, "wb") as f_webp:
                            f_webp.write(body)
                        cmd = ["ffmpeg", "-y", "-i", temp_webp, slide_out_file]
                        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=25)
                        if not os.path.exists(slide_out_file):
                            with open(slide_out_file, "wb") as f:
                                f.write(body)
                    else:
                        with open(slide_out_file, "wb") as f:
                            f.write(body)
                downloaded_file = slide_out_file
                file_ext = "jpg"

            slide_size = os.path.getsize(downloaded_file)
            total_downloaded_bytes += slide_size
            if total_downloaded_bytes > MAX_TOTAL_BYTES:
                raise ValueError("Carousel total size exceeds 200 MB limit.")

            archive_name = f"{post_id}_slide_{slide_num:02d}.{file_ext}"
            slide_files_for_zip.append((downloaded_file, archive_name))

        _progress_store[job_id] = DownloadProgress(
            job_id=job_id,
            status=JobStatus.CONVERTING,
            percent=90.0,
            speed="",
            eta="Packaging ZIP archive...",
            file_size=total_downloaded_bytes,
        )

        with zipfile.ZipFile(zip_output_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for src_path, arc_name in slide_files_for_zip:
                zf.write(src_path, arcname=arc_name)

        final_zip_size = os.path.getsize(zip_output_path)
        final_filename = f"{post_id}_all_slides.zip"

        _progress_store[job_id] = DownloadProgress(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            percent=100.0,
            speed="",
            eta="",
            file_size=final_zip_size,
            filename=final_filename,
        )
        _file_store[job_id] = zip_output_path
        logger.info("carousel_zip_download_completed", job_id=job_id, slides=total_slides, size=final_zip_size)
        return zip_output_path

    except Exception as e:
        if os.path.exists(zip_output_path):
            try:
                os.remove(zip_output_path)
            except OSError:
                pass
        clean_error = _sanitize_error_message(e)
        _progress_store[job_id] = DownloadProgress(
            job_id=job_id,
            status=JobStatus.FAILED,
            percent=0.0,
            error=clean_error,
            error_code="download_failed",
        )
        raise
    finally:
        shutil.rmtree(slide_temp_dir, ignore_errors=True)


async def start_download(
    job_id: str,
    url: str,
    fmt: str = "mp4",
    quality: str = "best",
    media_type: str | None = None,
    slide_index: int | None = None,
    is_carousel_zip: bool = False,
) -> str:
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
            if is_carousel_zip or fmt.lower().strip() == "zip":
                result = await asyncio.wait_for(
                    loop.run_in_executor(None, _download_carousel_zip_sync, job_id, url),
                    timeout=settings.DOWNLOAD_TIMEOUT_SECONDS,
                )
            else:
                result = await asyncio.wait_for(
                    loop.run_in_executor(None, _download_sync, job_id, url, fmt, quality, media_type, slide_index),
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
