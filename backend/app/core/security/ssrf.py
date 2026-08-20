from __future__ import annotations
import ipaddress
import re
import socket
import httpx
from urllib.parse import urlparse
from app.core.exceptions import SSRFBlockedError

# ── Allow-listed public CDN domains (suffix match) ──────────────────────────
ALLOWED_CDN_DOMAINS = (
    "googlevideo.com",
    "youtube.com",
    "youtu.be",
    "ytimg.com",
    "fbcdn.net",
    "facebook.com",
    "fb.watch",
    "fb.com",
    "cdninstagram.com",
    "instagram.com",
    "instagr.am",
    "tiktokcdn.com",
    "tiktok.com",
    "byteoversea.com",
    "twimg.com",
    "twitter.com",
    "x.com",
    "t.co",
    "pinimg.com",
    "pinterest.com",
    "pin.it",
    "redd.it",
    "reddit.com",
    "redditstatic.com",
    "redditmedia.com",
    "threads.net",
    "threads.com",
    "rapidsave.com",
    "lovethreads.net",
)

# ── Blocked hostnames (exact match) ─────────────────────────────────────────
BLOCKED_HOSTNAMES = frozenset({
    "localhost",
    "metadata.google.internal",
    "metadata.google.com",
    "instance-data",
    "metadata",
    "kubernetes.default",
    "kubernetes.default.svc",
})

# ── Regex to detect numeric-encoded IPs that bypass naive checks ────────────
_NUMERIC_IP_RE = re.compile(
    r"^(0x[0-9a-fA-F]+|0[0-7]+|\d+)(\.(0x[0-9a-fA-F]+|0[0-7]+|\d+)){0,3}$"
)


def is_ip_allowed(ip_str: str) -> bool:
    """Return True only if ip_str resolves to a routable public address."""
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False

    if ip.is_private or ip.is_loopback or ip.is_multicast or ip.is_reserved or ip.is_link_local:
        return False

    # Cloud metadata endpoints
    if ip_str in ("169.254.169.254", "fd00:ec2::254"):
        return False

    # IPv4-mapped IPv6 — unwrap and re-check
    if ip.version == 6:
        mapped = getattr(ip, "ipv4_mapped", None)
        if mapped is not None:
            return is_ip_allowed(str(mapped))
        # 6to4 addresses (2002::/16) can embed private IPv4
        if ip in ipaddress.ip_network("2002::/16"):
            embedded = ipaddress.ip_address(int(ip) >> 80 & 0xFFFFFFFF)
            return is_ip_allowed(str(embedded))

    return True


def _is_numeric_ip(hostname: str) -> bool:
    """Detect hex/octal/decimal encoded IPs like 0x7f000001, 2130706433."""
    return bool(_NUMERIC_IP_RE.match(hostname))


def resolve_and_check(hostname: str) -> str:
    """
    Resolve hostname via DNS and verify every returned IP is safe.
    FAIL-CLOSED: if DNS resolution fails, the request is blocked.
    """
    if not hostname:
        raise SSRFBlockedError("Empty hostname")

    hostname_lower = hostname.lower().strip().rstrip(".")

    # Block known dangerous hostnames
    if hostname_lower in BLOCKED_HOSTNAMES:
        raise SSRFBlockedError(f"Blocked hostname: {hostname}")

    # Block numeric-encoded IPs (hex, octal, decimal integers)
    if _is_numeric_ip(hostname_lower):
        raise SSRFBlockedError(f"Numeric IP encoding not allowed: {hostname}")

    # If it is directly an IP address string, validate immediately
    try:
        ipaddress.ip_address(hostname_lower)
        # It IS an IP string: verify it is not in a private/blocked subnet
        if not is_ip_allowed(hostname_lower):
            raise SSRFBlockedError(f"Blocked IP address: {hostname}")
        return hostname
    except ValueError:
        pass  # Not a raw IP address — continue to CDN check and DNS resolution

    # Allow trusted public CDNs directly (skip DNS for known-good domains)
    if any(hostname_lower == domain or hostname_lower.endswith(f".{domain}") for domain in ALLOWED_CDN_DOMAINS):
        return hostname

    # DNS resolution — FAIL-CLOSED on any error
    try:
        addresses = socket.getaddrinfo(hostname_lower, None, proto=socket.IPPROTO_TCP)
        if not addresses:
            raise SSRFBlockedError(f"DNS resolution returned no results for {hostname}")
        for _family, _type, _proto, _canonname, sockaddr in addresses:
            ip_str = sockaddr[0]
            if not is_ip_allowed(ip_str):
                raise SSRFBlockedError(f"Resolved IP for {hostname} is in a blocked range")
        return hostname
    except socket.gaierror:
        # FAIL-CLOSED: cannot resolve → block
        raise SSRFBlockedError(f"DNS resolution failed for {hostname}")


async def ssrf_safe_request(url: str, method: str = "GET", **kwargs) -> httpx.Response:
    """Make an HTTP request with full SSRF protection including redirect validation."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SSRFBlockedError("Only HTTP and HTTPS protocols are allowed")

    if not parsed.hostname:
        raise SSRFBlockedError("URL has no hostname")

    resolve_and_check(parsed.hostname)

    async with httpx.AsyncClient(follow_redirects=False, timeout=60.0) as client:
        response = await client.request(method, url, **kwargs)

        redirect_count = 0
        while response.is_redirect and redirect_count < 3:
            redirect_url = response.headers.get("location")
            if not redirect_url:
                break
            parsed_redirect = urlparse(redirect_url)
            if parsed_redirect.scheme not in ("http", "https"):
                raise SSRFBlockedError("Redirect to non-HTTP scheme blocked")
            if parsed_redirect.hostname:
                resolve_and_check(parsed_redirect.hostname)
            response = await client.request(method, redirect_url, **kwargs)
            redirect_count += 1

        return response


async def ssrf_safe_download(url: str, dest_path: str, max_size: int, progress_callback=None) -> str:
    """Download a file with SSRF protection and size limiting."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SSRFBlockedError("Only HTTP and HTTPS protocols are allowed")
    if not parsed.hostname:
        raise SSRFBlockedError("URL has no hostname")

    resolve_and_check(parsed.hostname)

    downloaded = 0
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=False) as client:
        final_url = url
        for _ in range(3):
            resp = await client.request("GET", final_url)
            if not resp.is_redirect:
                break
            redirect_url = resp.headers.get("location")
            if not redirect_url:
                break
            rp = urlparse(redirect_url)
            if rp.scheme not in ("http", "https"):
                raise SSRFBlockedError("Redirect to non-HTTP scheme blocked")
            if rp.hostname:
                resolve_and_check(rp.hostname)
            final_url = redirect_url

        async with client.stream("GET", final_url) as response:
            response.raise_for_status()
            with open(dest_path, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=65536):
                    downloaded += len(chunk)
                    if downloaded > max_size:
                        raise SSRFBlockedError("File size limit exceeded during download")
                    f.write(chunk)
                    if progress_callback:
                        progress_callback(downloaded)
    return dest_path
