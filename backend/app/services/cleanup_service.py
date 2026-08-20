"""
Temporary file cleanup service.
Periodically removes expired download files from the temp directory and
prunes in-memory progress tracking records.
"""
from __future__ import annotations
import asyncio
import os
import time
import structlog
from pathlib import Path

from app.core.config import settings
from app.services.media_service import get_temp_dir, purge_stale_in_memory_jobs

logger = structlog.get_logger()


async def cleanup_old_files() -> int:
    """
    Scan the temp download directory and delete files older than TEMP_FILE_TTL_SECONDS.
    Also prune stale in-memory job records.
    Returns the number of files deleted.
    """
    temp_dir = get_temp_dir()
    ttl = settings.TEMP_FILE_TTL_SECONDS
    now = time.time()
    deleted = 0

    try:
        for entry in os.scandir(temp_dir):
            if entry.is_file():
                file_age = now - entry.stat().st_mtime
                if file_age > ttl:
                    try:
                        os.remove(entry.path)
                        deleted += 1
                        logger.debug("cleanup_deleted_file", file=entry.name, age_seconds=int(file_age))
                    except OSError as e:
                        logger.warning("cleanup_delete_failed", file=entry.name, error=str(e))
    except FileNotFoundError:
        pass
    except Exception as e:
        logger.error("cleanup_scan_error", error=str(e))

    # Also clean up in-memory records
    pruned_records = purge_stale_in_memory_jobs(ttl)

    if deleted > 0 or pruned_records > 0:
        logger.info("cleanup_completed", deleted_files=deleted, pruned_jobs=pruned_records)

    return deleted


async def start_cleanup_loop() -> None:
    """
    Background loop that runs cleanup_old_files every CLEANUP_INTERVAL_SECONDS.
    Should be started as an asyncio task during app lifespan.
    """
    interval = settings.CLEANUP_INTERVAL_SECONDS
    logger.info("cleanup_loop_started", interval_seconds=interval, ttl_seconds=settings.TEMP_FILE_TTL_SECONDS)

    while True:
        try:
            await asyncio.sleep(interval)
            await cleanup_old_files()
        except asyncio.CancelledError:
            logger.info("cleanup_loop_stopped")
            break
        except Exception as e:
            logger.error("cleanup_loop_error", error=str(e))
            await asyncio.sleep(60)
