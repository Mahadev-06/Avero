from __future__ import annotations
from app.schemas.platform import PlatformCapability

PLATFORM_CAPABILITIES = {
    "direct_url": PlatformCapability(
        name="Direct URL", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=False, official_api_required=False,
        legal_notes="Direct file downloads from publicly accessible URLs.",
        limitations=[],
        max_duration_seconds=0,
    ),
    "youtube": PlatformCapability(
        name="YouTube", enabled=True, search_supported=True, metadata_supported=True,
        download_supported=True, embed_supported=True, official_api_required=False,
        legal_notes="Public videos only. Respect creator and platform rights.",
        limitations=["Public content only", "No age-restricted content", "Max 1 hour duration"],
        max_duration_seconds=3600,
    ),
    "instagram": PlatformCapability(
        name="Instagram", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=True, official_api_required=False,
        legal_notes="Public posts and reels only.",
        limitations=["Public posts only", "No Stories", "No DMs", "No private accounts"],
        max_duration_seconds=600,
    ),
    "tiktok": PlatformCapability(
        name="TikTok", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=True, official_api_required=False,
        legal_notes="Public videos only.",
        limitations=["Public videos only", "No private accounts"],
        max_duration_seconds=600,
    ),
    "facebook": PlatformCapability(
        name="Facebook", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=True, official_api_required=False,
        legal_notes="Public videos only.",
        limitations=["Public videos only", "No private groups", "No private profiles"],
        max_duration_seconds=3600,
    ),
    "x_twitter": PlatformCapability(
        name="X / Twitter", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=True, official_api_required=False,
        legal_notes="Public tweets with media only.",
        limitations=["Public tweets only", "No protected accounts"],
        max_duration_seconds=600,
    ),
    "pinterest": PlatformCapability(
        name="Pinterest", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=True, official_api_required=False,
        legal_notes="Public pins, images, and videos only.",
        limitations=["Public pins only", "No secret boards"],
        max_duration_seconds=600,
    ),
    "reddit": PlatformCapability(
        name="Reddit", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=True, official_api_required=False,
        legal_notes="Public Reddit posts, videos, images, and galleries.",
        limitations=["Public posts only", "No private subreddits"],
        max_duration_seconds=3600,
    ),
    "threads": PlatformCapability(
        name="Threads", enabled=True, search_supported=False, metadata_supported=True,
        download_supported=True, embed_supported=True, official_api_required=False,
        legal_notes="Public Threads posts, videos, and photos.",
        limitations=["Public posts only", "No private accounts"],
        max_duration_seconds=600,
    ),
}
