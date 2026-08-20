from __future__ import annotations
from fastapi import APIRouter, Request
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse, MediaInfo
from app.core.security.rate_limiter import limiter
from app.platforms.registry import registry
from app.platforms.direct_url import DirectURLAdapter

router = APIRouter()

@router.post("/", response_model=AnalyzeResponse)
@limiter.limit("30/minute")
async def analyze_urls(request: Request, body: AnalyzeRequest):
    results: list[MediaInfo] = []
    direct_fallback = DirectURLAdapter()
    
    for url_obj in body.urls:
        url_str = str(url_obj)
        adapter = registry.detect_platform(url_str) or direct_fallback
        try:
            info = await adapter.analyze(url_str)
            results.append(info)
        except Exception:
            results.append(MediaInfo(
                url=url_str,
                platform="unknown",
                title=url_str,
                download_supported=False,
                embed_supported=False,
            ))
            
    return AnalyzeResponse(results=results)
