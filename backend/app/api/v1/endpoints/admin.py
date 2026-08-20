from __future__ import annotations
import secrets
from fastapi import APIRouter, Depends, HTTPException, Header
from app.core.config import settings

router = APIRouter()

async def verify_admin(authorization: str = Header(...)):
    # Block default token in non-development modes
    if settings.API_SECRET_TOKEN == "CHANGE_ME_IN_PRODUCTION" and settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=503, detail="Admin service token unconfigured.")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header.")

    token = authorization.split(" ", 1)[1]
    if not secrets.compare_digest(token, settings.API_SECRET_TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/stats", dependencies=[Depends(verify_admin)])
async def get_stats():
    return {"status": "ok", "jobs_processed": 0}

@router.get("/queue", dependencies=[Depends(verify_admin)])
async def get_queue():
    return {"status": "ok", "queue_depth": 0}
