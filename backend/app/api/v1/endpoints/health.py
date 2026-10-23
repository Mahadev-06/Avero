from __future__ import annotations
import re
import httpx
from fastapi import APIRouter
from app.core.redis import get_redis

router = APIRouter()

@router.get("")
@router.get("/")
async def health_check():
    return {"status": "ok", "version": "1.1.5"}

@router.get("/ready")
async def readiness_check():
    redis = get_redis()
    await redis.ping()
    return {"status": "ready"}

@router.get("/debug_reel")
async def debug_reel():
    u_reel = "https://www.instagram.com/reel/Demz7jFhX7y/?dlrf=NTc4MTIwNjQ2YQ=="
    embed_url = "https://www.instagram.com/reel/Demz7jFhX7y/embed/captioned/"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=headers) as client:
        r = client.get(embed_url)
        html = (await r).text
    
    # search for video_url in embed HTML
    vids = re.findall(r'"video_url":"([^"]+)"', html)
    og_vids = re.findall(r'<meta property="og:video" content="([^"]+)"', html)
    
    clean_vids = [v.replace("\\u0026", "&").replace("&amp;", "&") for v in (vids + og_vids)]
    
    # Probe each video URL to check audio with ffprobe
    import subprocess, json, tempfile
    results = []
    for cv in clean_vids[:2]:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as dl_client:
            resp = await dl_client.get(cv, headers={"Range": "bytes=0-1000000"})
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
                tf.write(resp.content)
                tf_path = tf.name
        p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=index,codec_type,codec_name", "-of", "json", tf_path], capture_output=True, text=True)
        streams = json.loads(p.stdout).get("streams", []) if p.returncode == 0 else []
        results.append({
            "url": cv[:80],
            "streams": streams,
        })
        try: os.remove(tf_path)
        except OSError: pass

    return {
        "embed_video_count": len(clean_vids),
        "results": results
    }
