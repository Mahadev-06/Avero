from __future__ import annotations
from fastapi import APIRouter
from app.schemas.platform import PlatformListResponse
from app.platforms.registry import registry

router = APIRouter()

@router.get("/", response_model=PlatformListResponse)
async def list_platforms():
    return PlatformListResponse(platforms=registry.get_enabled_platforms())
