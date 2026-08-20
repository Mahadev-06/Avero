from __future__ import annotations
from pydantic import BaseModel
from app.core.exceptions import URLValidationError, SSRFBlockedError
from app.core.security.ssrf import resolve_and_check
from urllib.parse import urlparse

class ValidatedURL(BaseModel):
    url: str
    resolved_ip: str

def validate_url(url: str) -> ValidatedURL:
    """Validate a user-supplied URL for scheme, hostname, and SSRF safety."""
    if not url or len(url) > 2048:
        raise URLValidationError("Invalid or excessively long URL")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise URLValidationError("URL scheme must be http or https")
    if not parsed.hostname:
        raise URLValidationError("Invalid hostname")
    if parsed.port and parsed.port not in (80, 443):
        raise URLValidationError("Only standard HTTP ports are allowed")

    # Let SSRFBlockedError propagate — don't mask it as URLValidationError
    try:
        ip = resolve_and_check(parsed.hostname)
        return ValidatedURL(url=url, resolved_ip=ip)
    except SSRFBlockedError:
        raise  # Propagate SSRF blocks directly
    except Exception as e:
        raise URLValidationError(f"URL validation failed: {type(e).__name__}")
