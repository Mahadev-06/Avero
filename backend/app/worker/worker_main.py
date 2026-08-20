from __future__ import annotations
from arq import Worker
from arq.cron import cron
from app.core.config import settings
from app.worker.tasks import process_media_job, cleanup_temp_files
from app.core.redis import init_redis, close_redis

class WorkerSettings:
    functions = [process_media_job, cleanup_temp_files]
    cron_jobs = [cron(cleanup_temp_files, minute=set(range(0, 60, 30)))]
    redis_settings = settings.REDIS_URL
    max_jobs = settings.MAX_CONCURRENT_JOBS
    job_timeout = settings.JOB_TIMEOUT_SECONDS
    on_startup = init_redis
    on_shutdown = close_redis
