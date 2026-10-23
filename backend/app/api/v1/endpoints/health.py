from __future__ import annotations
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
    return {"status": "ok", "version": "1.1.6"}

@router.get("/ready")
async def readiness_check():
    redis = get_redis()
    await redis.ping()
    return {"status": "ready"}

@router.get("/debug_reel")
def debug_reel():
    ig_cookie_file = _get_instagram_cookiefile()
    u_reel = "https://www.instagram.com/reel/Demz7jFhX7y/?dlrf=NTc4MTIwNjQ2YQ=="

    # Test downloading progressive formats: format id 0, 1, 2 or 1104304199121900v-0
    # In yt-dlp, format '0' or '1' or '2' or 'b'
    ydl_opts = {
        "outtmpl": "/tmp/test_prog.%(ext)s",
        "format": "1104304199121900v-2/1104304199121900v-1/1104304199121900v-0/0/1/2/3",
        "overwrites": True,
        "quiet": True,
    }
    if ig_cookie_file:
        ydl_opts["cookiefile"] = ig_cookie_file

    err = None
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(u_reel, download=True)
            sel_format = info.get("format_id")
    except Exception as e:
        err = str(e)
        sel_format = None

    streams = []
    size = None
    target_file = "/tmp/test_prog.mp4"
    if os.path.exists(target_file):
        size = os.path.getsize(target_file)
        p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=index,codec_type,codec_name", "-of", "json", target_file], capture_output=True, text=True)
        if p.returncode == 0:
            streams = json.loads(p.stdout).get("streams", [])

    return {
        "selected_format": sel_format,
        "size": size,
        "streams": streams,
        "err": err,
    }
