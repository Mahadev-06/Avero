from __future__ import annotations
from fastapi import APIRouter, Request, HTTPException
from app.schemas.job import JobCreate, JobResponse, BatchJobCreate, JobListResponse
from app.services.job_service import JobService
from app.core.security.rate_limiter import limiter

router = APIRouter()

@router.post("/", response_model=JobResponse)
@limiter.limit("30/minute")
async def create_job(request: Request, job: JobCreate):
    return await JobService.create_job(str(job.url), job.preferred_format)

@router.post("/batch", response_model=list[JobResponse])
@limiter.limit("10/minute")
async def create_batch_jobs(request: Request, batch: BatchJobCreate):
    return [await JobService.create_job(str(url)) for url in batch.urls]

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = await JobService.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.delete("/{job_id}")
async def cancel_job(job_id: str):
    return {"status": "cancelled"}

@router.post("/{job_id}/retry")
async def retry_job(job_id: str):
    return {"status": "retrying"}
