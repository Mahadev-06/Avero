from __future__ import annotations
import io
import os
import json
import subprocess
from fastapi import APIRouter
import yt_dlp
from app.core.redis import get_redis
from app.services.media_service import _get_instagram_cookiefile

router = APIRouter()

@router.get("")
@router.get("/")
async def health_check():
    return {"status": "ok", "version": "1.1.1"}

@router.get("/ready")
async def readiness_check():
    redis = get_redis()
    await redis.ping()
    return {"status": "ready"}

@router.get("/debug_reel")
def debug_reel():
    log_buf = io.StringIO()
    class StringLogger:
        def debug(self, msg): log_buf.write(f"[debug] {msg}\n")
        def info(self, msg): log_buf.write(f"[info] {msg}\n")
        def warning(self, msg): log_buf.write(f"[warning] {msg}\n")
        def error(self, msg): log_buf.write(f"[error] {msg}\n")

    ig_cookie_file = _get_instagram_cookiefile()
    ydl_opts = {
        "outtmpl": "/tmp/debug_reel_test.%(ext)s",
        "format": "bestvideo+bestaudio/best",
        "merge_output_format": "mp4",
        "logger": StringLogger(),
        "verbose": True,
        "overwrites": True,
    }
    if ig_cookie_file:
        ydl_opts["cookiefile"] = ig_cookie_file
    
    url = "https://www.instagram.com/reel/Demz7jFhX7y/?dlrf=NTc4MTIwNjQ2YQ=="
    
    extract_error = None
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        extract_error = str(e)
    
    streams = []
    size = None
    ff_err = None
    test_path = "/tmp/debug_reel_test.mp4"
    if os.path.exists(test_path):
        size = os.path.getsize(test_path)
        p = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "stream=index,codec_type,codec_name", "-of", "json", test_path],
            capture_output=True, text=True
        )
        if p.returncode == 0:
            streams = json.loads(p.stdout).get("streams", [])
        else:
            ff_err = p.stderr

    return {
        "cookiefile_exists": bool(ig_cookie_file and os.path.exists(ig_cookie_file)),
        "size": size,
        "streams": streams,
        "extract_error": extract_error,
        "ff_err": ff_err,
        "logs": log_buf.getvalue(),
    }
