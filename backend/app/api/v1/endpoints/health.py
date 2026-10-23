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
    return {"status": "ok", "version": "1.1.3"}

@router.get("/ready")
async def readiness_check():
    redis = get_redis()
    await redis.ping()
    return {"status": "ready"}

@router.get("/debug_reel")
def debug_reel():
    ig_cookie_file = _get_instagram_cookiefile()
    ydl_opts = {
        "quiet": True,
    }
    if ig_cookie_file:
        ydl_opts["cookiefile"] = ig_cookie_file

    u_reel = "https://www.instagram.com/reel/Demz7jFhX7y/?dlrf=NTc4MTIwNjQ2YQ=="
    u_carousel = "https://www.instagram.com/p/DemaLRKjlEZ/"

    res = {}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # 1. Reel
        info_reel = ydl.extract_info(u_reel, download=False)
        res["reel_title"] = info_reel.get("title")
        res["reel_type"] = info_reel.get("_type")
        res["reel_formats"] = [
            {
                "id": f.get("format_id"),
                "ext": f.get("ext"),
                "vcodec": f.get("vcodec"),
                "acodec": f.get("acodec"),
                "note": f.get("format_note"),
            }
            for f in info_reel.get("formats", [])
        ]
        # 2. Carousel
        info_car = ydl.extract_info(u_carousel, download=False, process=False)
        res["car_type"] = info_car.get("_type")
        entries = list(info_car.get("entries", []))
        res["car_entries_count"] = len(entries)
        # Process entry 1
        info_e1 = ydl.extract_info(entries[0]["url"] if entries and "url" in entries[0] else u_carousel, download=False)
        res["car_e1_formats"] = [
            {
                "id": f.get("format_id"),
                "ext": f.get("ext"),
                "vcodec": f.get("vcodec"),
                "acodec": f.get("acodec"),
                "note": f.get("format_note"),
            }
            for f in info_e1.get("formats", [])
        ]

    return res
