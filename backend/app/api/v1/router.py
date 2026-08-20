from __future__ import annotations
from fastapi import APIRouter
from app.api.v1.endpoints import health, analyze, jobs, download, search, platforms, admin

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(download.router, prefix="/download", tags=["download"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(platforms.router, prefix="/platforms", tags=["platforms"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
