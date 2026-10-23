from __future__ import annotations
import io
import os
import json
import traceback
import subprocess
from fastapi import APIRouter
import yt_dlp
from app.core.redis import get_redis
from app.services.media_service import _get_instagram_cookiefile

router = APIRouter()

@router.get("")
@router.get("/")
async def health_check():
    return {"status": "ok", "version": "1.1.4"}

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
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 1. Reel
            try:
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
            except Exception as e:
                res["reel_err"] = traceback.format_exc()

            # 2. Carousel
            try:
                ydl_opts_slide1 = dict(ydl_opts)
                ydl_opts_slide1["playlist_items"] = "1"
                ydl_opts_slide1["noplaylist"] = False
                with yt_dlp.YoutubeDL(ydl_opts_slide1) as ydl_s1:
                    info_car = ydl_s1.extract_info(u_carousel, download=False)
                    entries = list(info_car.get("entries", [])) if info_car.get("_type") == "playlist" else [info_car]
                    res["car_entries_count"] = len(entries)
                    if entries:
                        res["car_s1_formats"] = [
                            {
                                "id": f.get("format_id"),
                                "ext": f.get("ext"),
                                "vcodec": f.get("vcodec"),
                                "acodec": f.get("acodec"),
                                "note": f.get("format_note"),
                            }
                            for f in entries[0].get("formats", [])
                        ]
            except Exception as e:
                res["car_err"] = traceback.format_exc()
    except Exception as e:
        res["global_err"] = traceback.format_exc()

    return res
