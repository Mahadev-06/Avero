from __future__ import annotations
from typing import List, Optional
from urllib.parse import urlparse
from app.platforms.base import PlatformAdapter
from app.schemas.platform import PlatformCapability

class PlatformRegistry:
    def __init__(self):
        self._adapters: List[PlatformAdapter] = []

    def register(self, adapter: PlatformAdapter):
        self._adapters.append(adapter)

    def detect_platform(self, url: str) -> Optional[PlatformAdapter]:
        try:
            parsed = urlparse(url)
            host = (parsed.hostname or "").lower()
        except Exception:
            host = ""

        # First pass: check specific platforms with exact host matches
        for adapter in self._adapters:
            if adapter.name == "direct_url":
                continue
            for pattern in adapter.url_patterns:
                p = pattern.lower()
                # Exact host or subdomain match (e.g. www.reddit.com or v.redd.it)
                if host == p or host.endswith("." + p):
                    return adapter
                # If pattern has path info (e.g. youtu.be), check host
                if "/" not in p and (host == p or host.endswith("." + p)):
                    return adapter

        # Fallback to direct_url adapter
        for adapter in self._adapters:
            if adapter.name == "direct_url":
                return adapter
        return None

    def get_enabled_platforms(self) -> List[PlatformCapability]:
        return [adapter.capabilities for adapter in self._adapters if adapter.capabilities.enabled]

registry = PlatformRegistry()

