from __future__ import annotations
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from app.core.config import settings

def get_client_ip(request: Request) -> str:
    """
    Extract client IP safely. Only trust X-Forwarded-For if request comes
    from a verified trusted reverse proxy (like Nginx, Traefik, or Cloudflare).
    """
    direct_ip = get_remote_address(request) or "127.0.0.1"
    
    # If the direct peer is a trusted proxy, parse the forwarded header
    if direct_ip in settings.TRUSTED_PROXIES or settings.ENVIRONMENT == "development":
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take the leftmost untrusted client IP
            client_candidate = forwarded.split(",")[0].strip()
            if client_candidate:
                return client_candidate
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

    return direct_ip

limiter = Limiter(key_func=get_client_ip)
