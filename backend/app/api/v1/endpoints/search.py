from __future__ import annotations
import httpx
from fastapi import APIRouter, Request, Query
from app.schemas.search import SearchResponse
from app.platforms.youtube import YouTubeAdapter
from app.core.security.rate_limiter import limiter

router = APIRouter()

@router.get("/suggestions")
@limiter.limit("60/minute")
async def get_suggestions(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100, description="Search query prefix"),
):
    """Fetch live YouTube autocomplete search suggestions."""
    try:
        url = "https://suggestqueries.google.com/complete/search"
        params = {"client": "firefox", "ds": "yt", "q": q}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 1 and isinstance(data[1], list):
                    return {"suggestions": data[1][:10]}
    except Exception:
        pass
    return {"suggestions": []}

@router.get("", response_model=SearchResponse)
@router.get("/", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search(
    request: Request,
    query: str = Query(..., min_length=1, description="Search query"),
    platform: str = Query("youtube", description="Target platform"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50)
):
    adapter = YouTubeAdapter()
    return await adapter.search(query=query, page=page, per_page=per_page)

