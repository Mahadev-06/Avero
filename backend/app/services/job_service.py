from __future__ import annotations
from typing import List
import uuid
from datetime import datetime, timezone
import orjson
from app.schemas.job import JobResponse, JobStatus
from app.core.redis import get_redis

class JobService:
    @staticmethod
    async def create_job(url: str, format: str = None) -> JobResponse:
        redis = get_redis()
        job_id = str(uuid.uuid4())
        job = JobResponse(
            id=job_id, url=url, platform="unknown", status=JobStatus.WAITING,
            selected_format=format, created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        await redis.hset(f"job:{job_id}", mapping={"data": orjson.dumps(job.dict()).decode("utf-8")})
        return job

    @staticmethod
    async def get_job(job_id: str) -> JobResponse | None:
        redis = get_redis()
        data = await redis.hget(f"job:{job_id}", "data")
        if data:
            return JobResponse(**orjson.loads(data))
        return None
