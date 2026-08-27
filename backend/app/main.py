from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
import os
import shutil
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

    # Check runtime binaries in PATH (FFmpeg, Node.js)
    ffmpeg_path = shutil.which("ffmpeg")
    node_path = shutil.which("node")

    logger.info(
        "runtime_binary_check",
        ffmpeg_found=bool(ffmpeg_path),
        ffmpeg_path=ffmpeg_path or "",
        node_found=bool(node_path),
        node_path=node_path or "",
    )

    # Log cookie configuration status at startup
    yt_has_file = bool(settings.YOUTUBE_COOKIES_FILE and os.path.exists(settings.YOUTUBE_COOKIES_FILE))
    yt_has_b64 = bool((getattr(settings, "YOUTUBE_COOKIES_B64", None) or os.getenv("YOUTUBE_COOKIES_B64", "")).strip())
    yt_has_text = bool((getattr(settings, "YOUTUBE_COOKIES_TEXT", None) or os.getenv("YOUTUBE_COOKIES_TEXT", "")).strip())
    yt_cookies_found = yt_has_file or yt_has_b64 or yt_has_text
    yt_source = "FILE" if yt_has_file else ("B64" if yt_has_b64 else ("TEXT" if yt_has_text else "NONE"))

    ig_has_file = bool(settings.INSTAGRAM_COOKIES_FILE and os.path.exists(settings.INSTAGRAM_COOKIES_FILE))
    ig_has_b64 = bool((getattr(settings, "INSTAGRAM_COOKIES_B64", None) or os.getenv("INSTAGRAM_COOKIES_B64", "")).strip())
    ig_has_text = bool((getattr(settings, "INSTAGRAM_COOKIES_TEXT", None) or os.getenv("INSTAGRAM_COOKIES_TEXT", "")).strip())
    ig_cookies_found = ig_has_file or ig_has_b64 or ig_has_text
    ig_source = "FILE" if ig_has_file else ("B64" if ig_has_b64 else ("TEXT" if ig_has_text else "NONE"))

    th_has_file = bool(getattr(settings, "THREADS_COOKIES_FILE", None) and os.path.exists(settings.THREADS_COOKIES_FILE))
    th_has_b64 = bool((getattr(settings, "THREADS_COOKIES_B64", None) or os.getenv("THREADS_COOKIES_B64", "")).strip())
    th_has_text = bool((getattr(settings, "THREADS_COOKIES_TEXT", None) or os.getenv("THREADS_COOKIES_TEXT", "")).strip())
    th_cookies_found = th_has_file or th_has_b64 or th_has_text or ig_cookies_found
    th_source = "FILE" if th_has_file else ("B64" if th_has_b64 else ("TEXT" if th_has_text else ("INHERITED_FROM_INSTAGRAM" if ig_cookies_found else "NONE")))

    x_has_file = bool(getattr(settings, "X_COOKIES_FILE", None) and os.path.exists(settings.X_COOKIES_FILE))
    x_has_b64 = bool((getattr(settings, "X_COOKIES_B64", None) or os.getenv("X_COOKIES_B64", "")).strip())
    x_has_text = bool((getattr(settings, "X_COOKIES_TEXT", None) or os.getenv("X_COOKIES_TEXT", "")).strip())
    x_cookies_found = x_has_file or x_has_b64 or x_has_text
    x_source = "FILE" if x_has_file else ("B64" if x_has_b64 else ("TEXT" if x_has_text else "NONE"))

    rd_has_file = bool(getattr(settings, "REDDIT_COOKIES_FILE", None) and os.path.exists(settings.REDDIT_COOKIES_FILE))
    rd_has_b64 = bool((getattr(settings, "REDDIT_COOKIES_B64", None) or os.getenv("REDDIT_COOKIES_B64", "")).strip())
    rd_has_text = bool((getattr(settings, "REDDIT_COOKIES_TEXT", None) or os.getenv("REDDIT_COOKIES_TEXT", "")).strip())
    rd_cookies_found = rd_has_file or rd_has_b64 or rd_has_text
    rd_source = "FILE" if rd_has_file else ("B64" if rd_has_b64 else ("TEXT" if rd_has_text else "NONE"))

    gen_cookies_found = bool(
        (settings.COOKIES_FILE and os.path.exists(settings.COOKIES_FILE))
        or (getattr(settings, "COOKIES_B64", None) or os.getenv("COOKIES_B64", "")).strip()
        or (getattr(settings, "COOKIES_TEXT", None) or os.getenv("COOKIES_TEXT", "")).strip()
    )

    logger.info(
        "platform_cookies_startup_status",
        youtube_cookies_found=yt_cookies_found,
        youtube_source=yt_source,
        instagram_cookies_found=ig_cookies_found,
        instagram_source=ig_source,
        threads_cookies_found=th_cookies_found,
        threads_source=th_source,
        x_cookies_found=x_cookies_found,
        x_source=x_source,
        reddit_cookies_found=rd_cookies_found,
        reddit_source=rd_source,
        generic_cookies_found=gen_cookies_found,
    )

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
