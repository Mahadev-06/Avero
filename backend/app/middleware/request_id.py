from __future__ import annotations
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger()

class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        req_id = str(uuid.uuid4())
        request.state.request_id = req_id
        
        structlog.contextvars.bind_contextvars(request_id=req_id)
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
