from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
import structlog
from app.core.config import settings
from app.core.redis import init_redis, close_redis
from app.core.exceptions import MediaFlowError, RateLimitExceededError
from app.core.security.rate_limiter import limiter
from app.api.v1.router import api_router
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.max_body_size import MaxBodySizeMiddleware
from app.platforms.registry import registry
from app.platforms.direct_url import DirectURLAdapter
from app.platforms.youtube import YouTubeAdapter
from app.platforms.instagram import InstagramAdapter
from app.platforms.tiktok import TikTokAdapter
from app.platforms.facebook import FacebookAdapter
from app.platforms.x_twitter import XTwitterAdapter
from app.platforms.pinterest import PinterestAdapter
from app.platforms.reddit import RedditAdapter
from app.platforms.threads import ThreadsAdapter
from app.services.cleanup_service import start_cleanup_loop

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Optional Redis connection (gracefully continues in-memory if Redis not running)
    try:
        await init_redis()
        logger.info("redis_connected")
    except Exception as e:
        logger.warning("redis_unavailable_fallback_to_local", error=str(e))

    registry.register(DirectURLAdapter())
    registry.register(YouTubeAdapter())
    registry.register(InstagramAdapter())
    registry.register(TikTokAdapter())
    registry.register(FacebookAdapter())
    registry.register(XTwitterAdapter())
    registry.register(PinterestAdapter())
    registry.register(RedditAdapter())
    registry.register(ThreadsAdapter())

    # Start background cleanup loop for expired temp files & completed jobs
    cleanup_task = asyncio.create_task(start_cleanup_loop())

    yield

    # Cancel cleanup on shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

    try:
        await close_redis()
    except Exception:
        pass

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan, redirect_slashes=False)

# Attach SlowAPI rate limiter to app state
app.state.limiter = limiter

# Middleware Pipeline
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "Content-Disposition"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(MaxBodySizeMiddleware, max_size=10 * 1024 * 1024)

# Exception Handlers
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Too many requests. Please wait a moment before trying again.",
            "code": "RATE_LIMIT_EXCEEDED",
        },
        headers={"Retry-After": "60"},
    )

@app.exception_handler(MediaFlowError)
async def mediaflow_exception_handler(request: Request, exc: MediaFlowError):
    return JSONResponse(
        status_code=400,
        content={"error": exc.message, "code": exc.error_code, "id": exc.error_id}
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error("unhandled_exception", error=str(exc), request_id=req_id, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "An unexpected error occurred while processing your request.",
            "code": "INTERNAL_SERVER_ERROR",
            "id": req_id,
        }
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
