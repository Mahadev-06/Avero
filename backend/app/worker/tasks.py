from __future__ import annotations
import asyncio
from app.services.cleanup_service import CleanupService
from pathlib import Path

async def process_media_job(ctx, job_id: str, url: str, format: str):
    await asyncio.sleep(1)

async def cleanup_temp_files(ctx):
    CleanupService.purge_stale_files(Path("/tmp/media_storage"), 3600)
