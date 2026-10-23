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
    return {"status": "ok", "version": "1.1.2"}

@router.get("/ready")
async def readiness_check():
    redis = get_redis()
    await redis.ping()
    return {"status": "ready"}

@router.get("/debug_reel")
def debug_reel():
    ig_cookie_file = _get_instagram_cookiefile()
    url = "https://www.instagram.com/reel/Demz7jFhX7y/?dlrf=NTc4MTIwNjQ2YQ=="

    # 1. With cookies
    ydl_opts_with = {
        "quiet": True,
        "format": "bestvideo+bestaudio/best",
    }
    if ig_cookie_file:
        ydl_opts_with["cookiefile"] = ig_cookie_file
    
    formats_with_cookies = []
    selected_with = None
    try:
        with yt_dlp.YoutubeDL(ydl_opts_with) as ydl:
            info_with = ydl.extract_info(url, download=False)
            selected_with = info_with.get("format_id")
            for f in info_with.get("formats", []):
                formats_with_cookies.append({
                    "format_id": f.get("format_id"),
                    "ext": f.get("ext"),
                    "vcodec": f.get("vcodec"),
                    "acodec": f.get("acodec"),
                    "tbr": f.get("tbr"),
                })
    except Exception as e:
        formats_with_cookies = str(e)

    # 2. Without cookies
    ydl_opts_no = {
        "quiet": True,
        "format": "bestvideo+bestaudio/best",
    }
    formats_no_cookies = []
    selected_no = None
    try:
        with yt_dlp.YoutubeDL(ydl_opts_no) as ydl:
            info_no = ydl.extract_info(url, download=False)
            selected_no = info_no.get("format_id")
            for f in info_no.get("formats", []):
                formats_no_cookies.append({
                    "format_id": f.get("format_id"),
                    "ext": f.get("ext"),
                    "vcodec": f.get("vcodec"),
                    "acodec": f.get("acodec"),
                    "tbr": f.get("tbr"),
                })
    except Exception as e:
        formats_no_cookies = str(e)

    return {
        "cookiefile_exists": bool(ig_cookie_file and os.path.exists(ig_cookie_file)),
        "selected_with_cookies": selected_with,
        "formats_with_cookies": formats_with_cookies,
        "selected_no_cookies": selected_no,
        "formats_no_cookies": formats_no_cookies,
    }
