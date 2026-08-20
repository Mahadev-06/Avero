from __future__ import annotations
import redis.asyncio as redis
from app.core.config import settings

redis_pool: redis.Redis | None = None

async def init_redis():
    global redis_pool
    redis_pool = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def close_redis():
    global redis_pool
    if redis_pool:
        await redis_pool.aclose()

def get_redis() -> redis.Redis:
    if redis_pool is None:
        raise RuntimeError("Redis not initialized")
    return redis_pool
