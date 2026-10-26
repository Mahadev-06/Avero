from __future__ import annotations
from fastapi import APIRouter
from app.core.redis import get_redis

router = APIRouter()

@router.get("")
@router.get("/")
async def health_check():
    return {"status": "ok", "version": "1.3.0-stage-a"}

@router.get("/ready")
async def readiness_check():
    redis = get_redis()
    await redis.ping()
    return {"status": "ready"}
