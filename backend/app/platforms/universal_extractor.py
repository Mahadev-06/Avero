from __future__ import annotations
import asyncio
import re
from urllib.parse import urlparse
import httpx
import yt_dlp
import structlog
from app.core.security.ssrf import resolve_and_check, SSRFBlockedError
from app.schemas.analyze import MediaInfo, FormatOption, SlideItem
from app.platforms.format_builder import build_real_format_options

logger = structlog.get_logger()

def format_bytes(size_bytes: float) -> str:
    """Format bytes into KB / MB human-readable strings."""
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.2f} MB"

def build_image_format_options(thumbnail_or_orig: str = None) -> list[FormatOption]:
    """Build format options for high-resolution images, Pinterest pins, Instagram photos, X pictures."""
    return [
        FormatOption(
            format_id="jpg_original",
            ext="JPG",
            quality="Original High-Res",
            file_size_formatted="Master Quality",
            media_category="image",
        ),
        FormatOption(
            format_id="png_hd",
            ext="PNG",
            quality="Ultra-HD",
            file_size_formatted="Lossless",
            media_category="image",
        ),
        FormatOption(
            format_id="webp_hd",
            ext="WEBP",
            quality="Web-Optimized",
            file_size_formatted="Fast",
            media_category="image",
        ),
    ]

def build_format_options(
    duration_sec: int = 60,
    raw_formats: list = None,
    max_height: int = None,
    max_width: int = None
) -> list[FormatOption]:
    """
    Build rich video & audio format options showing ONLY available resolutions.
    If a video is only available in 480p or 720p, higher unavailable resolutions (e.g. 1080p)
    are strictly excluded.
    """
    dur = max(duration_sec or 60, 5)

    standard_tiers = [
        ("2160p (4K)", 2160, 15_000_000),
        ("1440p (2K)", 1440, 8_000_000),
        ("1080p", 1080, 5_200_000),
        ("720p", 720, 2_800_000),
        ("480p", 480, 750_000),
        ("360p", 360, 420_000),
        ("240p", 240, 180_000),
        ("144p", 144, 80_000),
    ]

    # 1. Detect actual max available resolution
    detected_max_res = 0
    found_tier_sizes = {}

    if max_height and max_width:
        # Effective resolution for vertical vs horizontal videos
        detected_max_res = min(max_height, max_width) if (max_height > max_width and max_width >= 240) else max_height
    elif max_height:
        detected_max_res = max_height

    if raw_formats:
        for f in raw_formats:
            if f.get('vcodec') == 'none':
                continue
            h = f.get('height') or 0
            w = f.get('width') or 0
            res = min(h, w) if (h > 0 and w > 0 and (h > w or w > h)) else (h or w)
            if res > 0:
                if res > detected_max_res:
                    detected_max_res = res

                # Calculate or estimate size
                size = f.get('filesize') or f.get('filesize_approx')
                if not size:
                    tbr = f.get('tbr') or 1000
                    size = int((tbr * 1000 / 8) * dur)

                # Map to standard tier key
                if res >= 2160:
                    found_tier_sizes["2160p (4k)"] = max(found_tier_sizes.get("2160p (4k)", 0), size)
                elif res >= 1440:
                    found_tier_sizes["1440p (2k)"] = max(found_tier_sizes.get("1440p (2k)", 0), size)
                elif res >= 1080:
                    found_tier_sizes["1080p"] = max(found_tier_sizes.get("1080p", 0), size)
                elif res >= 720:
                    found_tier_sizes["720p"] = max(found_tier_sizes.get("720p", 0), size)
                elif res >= 480:
                    found_tier_sizes["480p"] = max(found_tier_sizes.get("480p", 0), size)
                elif res >= 360:
                    found_tier_sizes["360p"] = max(found_tier_sizes.get("360p", 0), size)
                elif res >= 240:
                    found_tier_sizes["240p"] = max(found_tier_sizes.get("240p", 0), size)
                elif res >= 144:
                    found_tier_sizes["144p"] = max(found_tier_sizes.get("144p", 0), size)

    # If no resolution detected, default conservatively to 720p
    if detected_max_res <= 0:
        detected_max_res = 720

    options: list[FormatOption] = []

    # Add only available video tiers (highest to lowest)
    for q_label, min_h, bitrate in standard_tiers:
        # If the tier exceeds the video's actual resolution, skip it!
        if min_h > detected_max_res * 1.05:
            continue

        size = found_tier_sizes.get(q_label.lower())
        if not size:
            size = int((bitrate / 8) * dur)

        options.append(FormatOption(
            format_id=f"mp4_{q_label.split()[0].lower()}",
            ext="MP4",
            quality=q_label,
            file_size_formatted=format_bytes(size),
            media_category="video"
        ))

    # Add Standard Audio Tiers
    audio_tiers = [
        ("48KBPS", 48_000),
        ("128KBPS", 128_000),
        ("256KBPS", 256_000),
        ("320KBPS", 320_000),
    ]
    for q_label, bitrate in audio_tiers:
        est_size = (bitrate / 8) * dur
        options.append(FormatOption(
            format_id=f"mp3_{q_label.lower()}",
            ext="MP3",
            quality=q_label,
            file_size_formatted=format_bytes(est_size),
            media_category="audio"
        ))

    return options

def resolve_pinterest_shortlink(url: str) -> str:
    if "pin.it" not in url:
        return url
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    }
    try:
        curr = url
        for _ in range(5):
            with httpx.Client(follow_redirects=False, headers=headers, timeout=5.0) as client:
                resp = client.get(curr)
                loc = resp.headers.get("location")
                if not loc:
                    break
                if "/pin/" in loc:
                    return re.sub(r'/sent/.*$', '/', loc)
                curr = loc
        return curr
    except Exception:
        return url


async def _scrape_pinterest(url: str) -> dict:
    """Scrape Pinterest pin metadata with SSRF validation and video detection."""
    target_url = resolve_pinterest_shortlink(url)
    parsed = urlparse(target_url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=12.0, headers=headers) as client:
        resp = await client.get(target_url)
        html = resp.text
        final_url = str(resp.url)

    # Search for video URLs in HTML or JSON
    video_url = None
    og_video = re.search(r'<meta\s+property=["\']og:video(?::url)?["\']\s+content=["\']([^"\']+)["\']', html)
    if og_video:
        video_url = og_video.group(1).replace('&amp;', '&')

    if not video_url:
        mp4_matches = re.findall(r'https?:\\?/\\?/(?:v1?\.pinimg\.com|[^\s"\']+\.pinimg\.com)[^"\']+\.mp4[^"\']*', html)
        if mp4_matches:
            video_url = mp4_matches[0].replace('\\/', '/').replace('&amp;', '&')

    if not video_url:
        any_mp4 = re.findall(r'https?:\\?/\\?/[^"\']+\.mp4[^"\']*', html)
        if any_mp4:
            clean = any_mp4[0].replace('\\/', '/').replace('&amp;', '&')
            if "pinimg.com" in clean or "pinterest" in clean or "v.pinimg" in clean:
                video_url = clean

    img_match = re.search(r'https://i\.pinimg\.com/[0-9]+x/([a-zA-Z0-9/_.\-]+)', html)
    orig_img = None
    if img_match:
        orig_img = f"https://i.pinimg.com/originals/{img_match.group(1)}"
    else:
        og_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
        if og_match:
            orig_img = re.sub(r'/[0-9]+x/', '/originals/', og_match.group(1))

    title_match = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)
    title = title_match.group(1) if title_match else "Pinterest Pin"

    is_video = bool(video_url) or "/video/" in target_url or "/video/" in final_url or "v.pinimg" in html or "VideoObject" in html

    return {
        "title": title,
        "image_url": orig_img,
        "video_url": video_url,
        "is_video": is_video,
    }

async def _scrape_reddit(url: str) -> dict:
    """Extract Reddit post (photo, gallery, or video) with SSRF validation."""
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    try:
        # Handle direct i.redd.it image or direct image extension
        if "i.redd.it" in url or "preview.redd.it" in url or any(url.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif")):
            return {
                "title": "Reddit Image Post",
                "image_url": url.replace("&amp;", "&"),
                "is_image": True,
            }

        from app.services.media_service import _get_reddit_cookiefile, _load_cookiejar
        reddit_cookie = _get_reddit_cookiefile()
        reddit_jar = _load_cookiejar(reddit_cookie) if reddit_cookie else None

        if reddit_jar:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
        else:
            headers = {
                "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }

        title = "Reddit Post"
        thumb_img = None

        # 1. Social Crawler / Logged-in Fetch
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers=headers, cookies=reddit_jar) as client:
            resp = await client.get(url)
            html = resp.text
            
            og_vid = re.search(r'<meta\s+property=["\']og:video(?::secure_url)?["\']\s+content=["\']([^"\']+)["\']', html)
            og_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
            og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)

            if og_title:
                raw_title = og_title.group(1).replace("&amp;", "&")
                title = re.sub(r'^(?:\[Mature Content\]\s*)?From the .*? community on Reddit:\s*', '', raw_title)

            if og_vid:
                return {
                    "title": title or "Reddit Video",
                    "video_url": og_vid.group(1).replace("&amp;", "&"),
                    "thumbnail": og_img.group(1).replace("&amp;", "&") if og_img else None,
                    "is_image": False,
                }
            
            if og_img:
                img_url = og_img.group(1).replace("&amp;", "&")
                if "i.redd.it" in img_url or "preview.redd.it" in img_url or not any(img_url.endswith(e) for e in ("reddit_icon.png", "reddit_logo.png", "favicon.ico")):
                    return {
                        "title": title or "Reddit Image",
                        "image_url": img_url,
                        "is_image": True,
                    }

        # 2. RapidSave fallback for Reddit media
        async with httpx.AsyncClient(follow_redirects=True, timeout=8.0) as client:
            rapid_url = f"https://rapidsave.com/info?url={url}"
            r = await client.get(rapid_url, headers={"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "referer": "https://rapidsave.com/"})
            if r.status_code == 200:
                img_match = re.search(r'href=["\'](https?://i\.redd\.it/[^"\']+)["\']', r.text)
                if img_match:
                    return {
                        "title": title or "Reddit Image",
                        "image_url": img_match.group(1).replace("&amp;", "&"),
                        "is_image": True,
                    }
                btn_match = re.search(r'class=["\'][^"\']*downloadbutton[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', r.text)
                if btn_match:
                    dl_path = btn_match.group(1)
                    full_dl = f"https://rapidsave.com{dl_path}" if dl_path.startswith("/") else dl_path
                    return {
                        "title": title or "Reddit Video",
                        "video_url": full_dl,
                        "thumbnail": thumb_img,
                        "is_image": False,
                    }

        # 3. Official Reddit oEmbed fallback
        oembed_url = f"https://www.reddit.com/oembed?url={url}"
        async with httpx.AsyncClient(follow_redirects=True, timeout=6.0, headers={"User-Agent": "Mozilla/5.0"}) as client:
            resp = await client.get(oembed_url)
            if resp.status_code == 200:
                oe_data = resp.json()
                title = oe_data.get("title") or title
                thumb_img = oe_data.get("thumbnail_url")
                if thumb_img and any(thumb_img.endswith(e) for e in (".jpg", ".jpeg", ".png", ".webp", ".gif")):
                    return {
                        "title": title,
                        "image_url": thumb_img.replace("&amp;", "&"),
                        "is_image": True,
                    }
    except Exception:
        pass

    return {}


def _extract_full_res_instagram_image(html: str) -> str | None:
    """Extract full-resolution uncropped Instagram image from JSON or HTML."""
    # 1. Look for image_versions2 candidates in JSON (Polaris / Relay)
    json_candidate = re.search(
        r'["\']image_versions2["\']\s*:\s*\{["\']candidates["\']\s*:\s*\[\s*\{["\']url["\']\s*:\s*["\']([^"\']+)["\']',
        html,
    )
    if json_candidate:
        clean = json_candidate.group(1).replace(r'\/', '/').replace(r'\u0026', '&').replace('&amp;', '&')
        return clean

    # 2. Look for link preload as image
    preload_match = re.search(
        r'<link\s+[^>]*rel=["\']preload["\'][^>]*as=["\']image["\'][^>]*href=["\']([^"\']+)["\']',
        html,
        re.IGNORECASE,
    )
    if not preload_match:
        preload_match = re.search(
            r'<link\s+[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']preload["\'][^>]*as=["\']image["\']',
            html,
            re.IGNORECASE,
        )
    if preload_match:
        clean = preload_match.group(1).replace(r'\/', '/').replace(r'\u0026', '&').replace('&amp;', '&')
        if ("cdninstagram.com" in clean or "fbcdn.net" in clean) and not any(k in clean for k in ("rsrc.php", "favicon")):
            return clean

    # 3. Find candidate image URLs from cdninstagram / fbcdn
    all_imgs = re.findall(r'https?:\\?/\\?/[^"\'\s<>]+?\.(?:jpg|jpeg|webp)[^"\'\s<>]*', html)
    clean_candidates = [u.replace(r'\/', '/').replace(r'\u0026', '&').replace('&amp;', '&') for u in all_imgs]

    uncropped = []
    for u in clean_candidates:
        if ("cdninstagram.com" in u or "fbcdn.net" in u) and not any(
            k in u for k in ("rsrc.php", "favicon", "150x150", "320x320", "s150x150")
        ):
            m_stp = re.search(r'stp=([^&]+)', u)
            stp_val = m_stp.group(1) if m_stp else ""
            if not re.search(r'c\d+\.\d+', stp_val):
                uncropped.append(u)

    if uncropped:
        for u in uncropped:
            if "dst-jpg_e35_tt6" in u:
                return u
        return uncropped[0]

    return None


async def _scrape_instagram(url: str) -> dict:
    """Extract Instagram Reel, Post, or Photo with multi-tier extraction."""
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".mp4", ".m4v", ".mov", ".webm")) or "cdninstagram.com" in url or "fbcdn.net" in url:
        return {
            "title": "Instagram Video",
            "video_url": url,
            "is_image": False,
            "muted": True,
        }

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif")):
        return {
            "title": "Instagram Photo",
            "image_url": url,
            "is_image": True,
            "muted": False,
        }

    shortcode_match = re.search(r'(?:instagram\.com|instagr\.am)/(?:p|reel|tv)/([a-zA-Z0-9_\-]+)', url)
    shortcode = shortcode_match.group(1) if shortcode_match else None

    title = "Instagram Media"
    thumbnail_img = None

    # Tier 1: Embed captioned page extraction
    if shortcode:
        try:
            embed_url = f"https://www.instagram.com/p/{shortcode}/embed/captioned/"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with httpx.AsyncClient(follow_redirects=True, timeout=8.0, headers=headers) as client:
                resp = await client.get(embed_url)
                if resp.status_code == 200:
                    html = resp.text
                    caption_match = re.search(r'class=["\']CaptionText["\'][^>]*>(.*?)</div>', html, re.DOTALL)
                    if caption_match:
                        raw_caption = re.sub(r'<[^>]+>', '', caption_match.group(1)).strip()
                        if raw_caption:
                            title = raw_caption[:80]
                    
                    # Check for full-resolution uncropped image on embed page
                    full_res = _extract_full_res_instagram_image(html)
                    if full_res:
                        thumbnail_img = full_res

                    if not thumbnail_img:
                        img_match = re.search(r'class=["\']EmbeddedMediaImage["\'][^>]*src=["\']([^"\']+)["\']', html)
                        if img_match:
                            thumbnail_img = img_match.group(1).replace("&amp;", "&")

                    mp4_matches = re.findall(r'https?:\\?/\\?/[^"\'\\ ]+?(?:cdninstagram\.com|fbcdn\.net)[^"\'\\ ]*?\.mp4[^"\'\\ ]*', html)
                    if mp4_matches:
                        clean_url = mp4_matches[0].replace(r"\u0026", "&").replace(r"\/", "/")
                        return {
                            "title": title or "Instagram Video",
                            "video_url": clean_url,
                            "thumbnail": thumbnail_img,
                            "is_image": False,
                            "muted": True,
                        }
                    elif thumbnail_img and not re.search(r'c\d+\.\d+', thumbnail_img):
                        # Only return from Tier 1 if image is NOT a cropped thumbnail!
                        return {
                            "title": title or "Instagram Photo",
                            "image_url": thumbnail_img,
                            "thumbnail": thumbnail_img,
                            "is_image": True,
                            "muted": False,
                        }
        except Exception:
            pass

    # Tier 2: OpenGraph social crawler
    try:
        crawler_headers = {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=12.0, headers=crawler_headers) as client:
            resp = await client.get(url)
            html = resp.text
            
            og_vid = re.search(r'<meta\s+property=["\']og:video(?::secure_url)?["\']\s+content=["\']([^"\']+)["\']', html)
            og_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
            og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)

            if og_title:
                raw_title = og_title.group(1).replace("&amp;", "&")
                if raw_title and not any(k in raw_title for k in ("Login", "Instagram")):
                    title = raw_title

            if og_vid:
                return {
                    "title": title or "Instagram Video",
                    "video_url": og_vid.group(1).replace("&amp;", "&"),
                    "thumbnail": og_img.group(1).replace("&amp;", "&") if og_img else thumbnail_img,
                    "is_image": False,
                    "muted": True,
                }

            # Prioritize full-resolution uncropped image
            full_res_img = _extract_full_res_instagram_image(html)
            if full_res_img:
                return {
                    "title": title or "Instagram Photo",
                    "image_url": full_res_img,
                    "thumbnail": full_res_img,
                    "is_image": True,
                    "muted": False,
                }

            if og_img:
                img_url = og_img.group(1).replace("&amp;", "&")
                if not any(img_url.endswith(e) for e in ("instagram_icon.png", "favicon.ico", "rsrc.php")):
                    return {
                        "title": title or "Instagram Photo",
                        "image_url": img_url,
                        "thumbnail": img_url,
                        "is_image": True,
                        "muted": False,
                    }
                elif not thumbnail_img:
                    thumbnail_img = img_url
    except Exception:
        pass

    if thumbnail_img and not any(thumbnail_img.endswith(e) for e in ("instagram_icon.png", "favicon.ico", "rsrc.php")):
        return {
            "title": title or "Instagram Photo",
            "image_url": thumbnail_img,
            "thumbnail": thumbnail_img,
            "is_image": True,
            "muted": False,
        }

    return {}


async def _scrape_threads(url: str) -> dict:
    """Scrape Threads post for image or video with multi-tier extraction."""
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif")):
        return {
            "title": "Threads Photo",
            "image_url": url,
            "thumbnail": url,
            "is_image": True,
        }

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".mp4", ".m4v", ".mov", ".webm")):
        return {
            "title": "Threads Video",
            "video_url": url,
            "is_image": False,
        }

    # 1. Resolve share links hop-by-hop with resolve_and_check (max 5 hops, host must be threads.net or threads.com)
    current_url = url
    for _ in range(5):
        parsed_hop = urlparse(current_url)
        hostname = (parsed_hop.hostname or "").lower()
        if not hostname or not (
            hostname == "threads.net" or hostname.endswith(".threads.net") or
            hostname == "threads.com" or hostname.endswith(".threads.com")
        ):
            raise SSRFBlockedError(f"Hop to non-Threads host blocked: {hostname}")
        resolve_and_check(hostname)

        if "error=invalid_post" in current_url:
            return {"error": "invalid_post", "canonical_url": current_url}

        async with httpx.AsyncClient(follow_redirects=False, timeout=10.0) as hop_client:
            try:
                r_hop = await hop_client.get(current_url, headers={"User-Agent": "Mozilla/5.0"})
                if r_hop.is_redirect:
                    next_loc = r_hop.headers.get("location")
                    if not next_loc:
                        break
                    if next_loc.startswith("/"):
                        next_loc = f"{parsed_hop.scheme}://{parsed_hop.netloc}{next_loc}"
                    current_url = next_loc
                    if "error=invalid_post" in current_url:
                        return {"error": "invalid_post", "canonical_url": current_url}
                else:
                    break
            except Exception:
                break

    m = re.search(r'@([^/]+)/post/([^/?]+)', current_url)
    author = m.group(1) if m else None
    post_id = m.group(2) if m else None

    import html as html_module
    title = None
    caption_text = None

    # 2. Tier 1: Embed Page Scraping (https://www.threads.net/@user/post/POST_ID/embed)
    embed_video_src = None
    embed_imgs: list[str] = []
    if author and post_id:
        embed_url = f"https://www.threads.net/@{author}/post/{post_id}/embed"
        try:
            parsed_emb = urlparse(embed_url)
            if parsed_emb.hostname:
                resolve_and_check(parsed_emb.hostname)
            async with httpx.AsyncClient(follow_redirects=True, timeout=8.0) as emb_client:
                emb_resp = await emb_client.get(embed_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                if emb_resp.status_code == 200:
                    embed_html = emb_resp.text
                    cap_m = re.search(r'class="BodyText[^"]*"[^>]*>(.*?)</div>', embed_html, re.DOTALL)
                    if cap_m:
                        clean_cap = re.sub(r'<[^>]+>', '', cap_m.group(1)).strip()
                        if clean_cap:
                            caption_text = html_module.unescape(clean_cap)

                    v_src = re.findall(r'<source[^>]+src="([^">]+)"', embed_html)
                    if v_src:
                        embed_video_src = v_src[0].replace("&amp;", "&")

                    # Embed tier: take images ONLY from inside MediaScrollImageContainer, in order.
                    # Exclude avatars, emoji, icons and any other <img>.
                    scroll_matches = re.findall(
                        r'<div[^>]*class="[^"]*MediaScrollImageContainer[^"]*"[^>]*>(.*?)</div>',
                        embed_html,
                        re.DOTALL,
                    )
                    for sm in scroll_matches:
                        img_m = re.search(r'<img[^>]+src="([^">]+)"', sm)
                        if img_m:
                            c_url = img_m.group(1).replace("&amp;", "&")
                            p_host = (urlparse(c_url).hostname or "").lower()
                            if p_host.endswith("cdninstagram.com") or p_host.endswith("fbcdn.net"):
                                try:
                                    resolve_and_check(p_host)
                                    embed_imgs.append(c_url)
                                except Exception:
                                    pass
        except Exception:
            pass

    # 3. Tier 2: Social Crawler / OpenGraph Scraping (facebookexternalhit/1.1)
    og_vid_url = None
    og_img_url = None
    try:
        from app.services.media_service import _get_threads_cookiefile, _load_cookiejar
        threads_cookie = _get_threads_cookiefile()
        threads_jar = _load_cookiejar(threads_cookie) if threads_cookie else None

        crawl_headers = {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=8.0, headers=crawl_headers, cookies=threads_jar) as crawl_client:
            crawl_resp = await crawl_client.get(current_url)
            if crawl_resp.status_code == 200:
                html = crawl_resp.text
                og_vid = re.search(r'<meta\s+(?:property|name)=["\'](?:og:video(?::secure_url)?|twitter:player:stream)["\']\s+content=["\']([^"\']+)["\']', html)
                if not og_vid:
                    og_vid = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+(?:property|name)=["\'](?:og:video(?::secure_url)?|twitter:player:stream)["\']', html)
                if og_vid:
                    og_vid_url = og_vid.group(1).replace("&amp;", "&")

                og_img = re.search(r'<meta\s+(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["\']\s+content=["\']([^"\']+)["\']', html)
                if not og_img:
                    og_img = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["\']', html)
                if og_img:
                    cand_img = og_img.group(1).replace("&amp;", "&")
                    if not any(e in cand_img.lower() for e in ("favicon.ico", "threads_logo.png", "khwimm5b8pw", "rsrc.php")):
                        og_img_url = cand_img

                if not caption_text:
                    og_desc = re.search(r'<meta\s+(?:property|name)=["\'](?:og:description|twitter:description)["\']\s+content=["\']([^"\']+)["\']', html)
                    if not og_desc:
                        og_desc = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+(?:property|name)=["\'](?:og:description|twitter:description)["\']', html)
                    if og_desc:
                        clean_desc = html_module.unescape(og_desc.group(1).replace("&amp;", "&")).strip()
                        if clean_desc and not any(k in clean_desc.lower() for k in ("log in to threads", "join threads")):
                            caption_text = clean_desc

                if not author:
                    og_title = re.search(r'<meta\s+(?:property|name)=["\'](?:og:title|twitter:title)["\']\s+content=["\']([^"\']+)["\']', html)
                    if not og_title:
                        og_title = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+(?:property|name)=["\'](?:og:title|twitter:title)["\']', html)
                    if og_title:
                        raw_title = html_module.unescape(og_title.group(1).replace("&amp;", "&"))
                        m_auth = re.search(r'@([A-Za-z0-9._]+)', raw_title)
                        if m_auth:
                            author = m_auth.group(1)
    except Exception:
        pass

    # Build display title according to approved plan
    if caption_text:
        single_line_cap = re.sub(r'\s+', ' ', caption_text).strip()
        cap_snippet = single_line_cap[:80] + ("..." if len(single_line_cap) > 80 else "")
        if author:
            title = f"@{author}: {cap_snippet}"
        else:
            title = cap_snippet
    elif author:
        title = f"Threads post by @{author}"

    # Check if embed tier yielded carousel slides (>= 2 images)
    if len(embed_imgs) >= 2:
        slides: list[dict] = []
        for idx, slide_url in enumerate(embed_imgs):
            slide_idx = idx + 1
            slides.append({
                "id": f"slide_{slide_idx}",
                "slide_index": slide_idx,
                "media_type": "image",
                "thumbnail_url": slide_url,
                "download_url": slide_url,
            })
        return {
            "title": title or (f"Threads post by @{author}" if author else "Threads Carousel"),
            "thumbnail": embed_imgs[0],
            "is_image": True,
            "is_carousel": True,
            "slide_count": len(slides),
            "slides": slides,
            "canonical_url": current_url,
            "author": author,
            "post_id": post_id,
        }

    # Return if video found via Embed or OpenGraph
    final_video = embed_video_src or og_vid_url
    if final_video:
        return {
            "title": title or (f"Threads video by @{author}" if author else "Threads Video"),
            "video_url": final_video,
            "thumbnail": og_img_url or (embed_imgs[0] if embed_imgs else None),
            "is_image": False,
            "canonical_url": current_url,
            "author": author,
            "post_id": post_id,
        }

    # Return if direct image found via Embed or OpenGraph
    final_img = (embed_imgs[0] if embed_imgs else None) or og_img_url
    if final_img:
        return {
            "title": title or (f"Threads photo by @{author}" if author else "Threads Photo"),
            "image_url": final_img,
            "thumbnail": og_img_url or final_img,
            "is_image": True,
            "canonical_url": current_url,
            "author": author,
            "post_id": post_id,
        }

    # 4. Tier 3: lovethreads.net API fallback
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=8.0) as client:
            endpoint = "https://lovethreads.net/api/ajaxSearch"
            data = {"q": current_url, "t": "media", "lang": "en"}
            lt_headers = {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "origin": "https://lovethreads.net",
                "referer": "https://lovethreads.net/en",
                "x-requested-with": "XMLHttpRequest",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }
            r = await client.post(endpoint, data=data, headers=lt_headers)
            if r.status_code == 200:
                res = r.json()
                if res.get("status") == "ok":
                    data_html = res.get("data", "")
                    # Check for carousel items in LoveThreads fallback only if embed tier yielded < 2 slides
                    lt_items = re.findall(r'<div class="download-items"[^>]*>(.*?)</div>\s*</li>', data_html, re.DOTALL)
                    if len(lt_items) >= 2 and len(embed_imgs) < 2:
                        lt_slides = []
                        for idx, it in enumerate(lt_items):
                            photo_m = re.search(r'href=["\'](https?://[^"\']+)["\'][^>]*title=["\']Download Photo["\']', it)
                            img_m = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', it)
                            cand = (photo_m.group(1) if photo_m else None) or (img_m.group(1) if img_m else None)
                            if cand:
                                cand_clean = cand.replace("&amp;", "&")
                                cand_host = (urlparse(cand_clean).hostname or "").lower()
                                if cand_host.endswith("cdninstagram.com") or cand_host.endswith("fbcdn.net") or cand_host.endswith("snapcdn.app"):
                                    try:
                                        resolve_and_check(cand_host)
                                        s_idx = idx + 1
                                        lt_slides.append({
                                            "id": f"slide_{s_idx}",
                                            "slide_index": s_idx,
                                            "media_type": "image",
                                            "thumbnail_url": cand_clean,
                                            "download_url": cand_clean,
                                        })
                                    except Exception:
                                        pass
                        if len(lt_slides) >= 2:
                            return {
                                "title": title or (f"Threads post by @{author}" if author else "Threads Carousel"),
                                "thumbnail": lt_slides[0]["thumbnail_url"],
                                "is_image": True,
                                "is_carousel": True,
                                "slide_count": len(lt_slides),
                                "slides": lt_slides,
                                "canonical_url": current_url,
                                "author": author,
                                "post_id": post_id,
                            }

                    v_match = re.search(r'href=["\'](https?://[^"\']+)["\'][^>]*title=["\']Download Video["\']', data_html)
                    p_match = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', data_html)
                    photo_dl = re.search(r'href=["\'](https?://[^"\']+)["\'][^>]*title=["\']Download Photo["\']', data_html)
                    if v_match:
                        return {
                            "title": title or (f"Threads video by @{author}" if author else "Threads Video"),
                            "video_url": v_match.group(1),
                            "thumbnail": p_match.group(1) if p_match else og_img_url,
                            "is_image": False,
                            "canonical_url": current_url,
                            "author": author,
                            "post_id": post_id,
                        }
                    elif photo_dl:
                        return {
                            "title": title or (f"Threads photo by @{author}" if author else "Threads Photo"),
                            "image_url": photo_dl.group(1),
                            "thumbnail": p_match.group(1) if p_match else photo_dl.group(1),
                            "is_image": True,
                            "canonical_url": current_url,
                            "author": author,
                            "post_id": post_id,
                        }
                    elif p_match:
                        return {
                            "title": title or (f"Threads photo by @{author}" if author else "Threads Photo"),
                            "image_url": p_match.group(1),
                            "thumbnail": p_match.group(1),
                            "is_image": True,
                            "canonical_url": current_url,
                            "author": author,
                            "post_id": post_id,
                        }
    except Exception:
        pass

    # If no media was found, return canonical info
    return {"canonical_url": current_url, "author": author, "post_id": post_id}
async def _scrape_x(url: str) -> dict:
    """Extract X / Twitter post metadata and media (photo, gallery, or video)."""
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif")):
        return {
            "title": "X Photo",
            "image_url": url,
            "thumbnail": url,
            "is_image": True,
        }

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".mp4", ".m4v", ".mov", ".webm")):
        return {
            "title": "X Video",
            "video_url": url,
            "is_image": False,
        }

    tweet_id_match = re.search(r'status/(\d+)', url)
    tweet_id = tweet_id_match.group(1) if tweet_id_match else None

    # 1. Primary: Query fxtwitter API (gives exact variants, bitrates, dimensions, duration)
    if tweet_id:
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=8.0) as client:
                r_fx = await client.get(f"https://api.fxtwitter.com/status/{tweet_id}", headers={"User-Agent": "Mozilla/5.0"})
                if r_fx.status_code == 200:
                    data = r_fx.json()
                    tweet = data.get("tweet", {})
                    t_text = tweet.get("text")
                    title = t_text[:100] if t_text else "X Post"
                    media = tweet.get("media", {})
                    author_name = tweet.get("author", {}).get("screen_name")
                    videos = media.get("videos", [])
                    if videos:
                        v0 = videos[0]
                        raw_formats = v0.get("formats", []) or v0.get("variants", [])
                        mp4_variants = []
                        for f in raw_formats:
                            ctype = (f.get("content_type") or f.get("container") or "").lower()
                            f_url = f.get("url") or ""
                            if ("mp4" in ctype or f_url.endswith(".mp4") or ".mp4?" in f_url) and f_url:
                                m_dim = re.search(r"[/_](\d{3,4})x(\d{3,4})[/_.]", f_url)
                                w_val = int(m_dim.group(1)) if m_dim else None
                                h_val = int(m_dim.group(2)) if m_dim else None
                                fmt_id = f"x_{w_val}x{h_val}" if (w_val and h_val) else f"x_{f.get('bitrate') or len(mp4_variants)}"
                                mp4_variants.append({
                                    "url": f_url,
                                    "bitrate": f.get("bitrate"),
                                    "codec": f.get("codec") or "h264",
                                    "width": w_val,
                                    "height": h_val,
                                    "ext": "mp4",
                                    "format_id": fmt_id,
                                })
                        if not mp4_variants and v0.get("url"):
                            mp4_variants.append({
                                "url": v0.get("url"),
                                "ext": "mp4",
                                "format_id": "x_default",
                            })
                        return {
                            "title": title or "X Video",
                            "author": author_name,
                            "tweet_id": tweet_id,
                            "video_url": v0.get("url"),
                            "thumbnail": v0.get("thumbnail_url"),
                            "duration": v0.get("duration", 0),
                            "variants": mp4_variants,
                            "is_image": False,
                        }
                    photos = media.get("photos", [])
                    if photos:
                        return {
                            "title": title or "X Photo",
                            "author": author_name,
                            "tweet_id": tweet_id,
                            "image_url": photos[0].get("url"),
                            "thumbnail": photos[0].get("url"),
                            "is_image": True,
                        }
        except Exception as e:
            logger.debug(f"fxtwitter lookup failed for {tweet_id}: {e}")

    # 2. Fallback: Social Crawler / Logged-in OpenGraph Fetch
    from app.services.media_service import _get_x_cookiefile, _load_cookiejar
    x_cookie = _get_x_cookiefile()
    x_jar = _load_cookiejar(x_cookie) if x_cookie else None

    if x_jar:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/124.0.0.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
    else:
        headers = {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

    title = "X Post"

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers=headers, cookies=x_jar) as client:
            resp = await client.get(url)
            html = resp.text

            og_vid = re.search(r"""<meta\s+(?:property|name)=['"](?:og:video(?::secure_url)?|twitter:player:stream)['"]\s+content=['"]([^'"]+)['"]""", html)
            og_img = re.search(r"""<meta\s+(?:property|name)=['"](?:og:image(?::secure_url)?|twitter:image(?::src)?)['"]\s+content=['"]([^'"]+)['"]""", html)
            og_title = re.search(r"""<meta\s+(?:property|name)=['"](?:og:title|twitter:title)['"]\s+content=['"]([^'"]+)['"]""", html)

            if og_title:
                import html as html_module
                raw_t = html_module.unescape(og_title.group(1).replace("&amp;", "&")).strip()
                if raw_t and not any(k in raw_t for k in ("Post Not Found", "404 Error")):
                    title = raw_t

            if og_vid:
                return {
                    "title": title or "X Video",
                    "video_url": og_vid.group(1).replace("&amp;", "&"),
                    "thumbnail": og_img.group(1).replace("&amp;", "&") if og_img else None,
                    "is_image": False,
                }

            if og_img:
                raw_img = og_img.group(1).replace("&amp;", "&")
                if "twimg.com" in raw_img and not any(raw_img.endswith(e) for e in ("og/image.png", "favicon.ico", "default_profile")):
                    if "name=" in raw_img:
                        raw_img = re.sub(r'name=[a-zA-Z0-9_]+', 'name=orig', raw_img)
                    return {
                        "title": title or "X Photo",
                        "image_url": raw_img,
                        "thumbnail": raw_img,
                        "is_image": True,
                    }

            twimg_matches = re.findall(r"""https?://pbs\.twimg\.com/media/[^'"\s\\]+""", html)
            if twimg_matches:
                clean_img = twimg_matches[0].replace("&amp;", "&").replace(r"\/", "/")
                if "name=" in clean_img:
                    clean_img = re.sub(r'name=[a-zA-Z0-9_]+', 'name=orig', clean_img)
                return {
                    "title": title or "X Photo",
                    "image_url": clean_img,
                    "thumbnail": clean_img,
                    "is_image": True,
                }
    except Exception:
        pass

    return {}


async def extract_media_info(url: str, platform_name: str) -> MediaInfo:
    # SSRF check on target URL
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    # 1. Check if direct image URL
    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif")):
        filename = url.split("/")[-1].split("?")[0]
        format_opts = build_image_format_options(url)
        return MediaInfo(
            url=url,
            platform=platform_name,
            title=filename or "High-Resolution Image",
            thumbnail_url=url,
            media_type="image",
            formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
            format_options=format_opts,
            download_url=url,
            download_supported=True,
            embed_supported=False,
        )

    # 2. Pinterest pin handler
    if "pinterest.com" in url or "pin.it" in url or "pinimg.com" in url:
        try:
            pin_data = await _scrape_pinterest(url)
            is_video = pin_data.get("is_video", False)
            if is_video or pin_data.get("video_url"):
                format_opts = build_format_options(duration_sec=60)
                download_url = pin_data.get("video_url") or url
                return MediaInfo(
                    url=url,
                    platform="pinterest",
                    title=pin_data.get("title", "Pinterest Pin Video"),
                    thumbnail_url=pin_data.get("image_url"),
                    media_type="video",
                    duration=60,
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=download_url,
                    download_supported=True,
                    embed_supported=True,
                )
            elif pin_data.get("image_url"):
                format_opts = build_image_format_options(pin_data["image_url"])
                return MediaInfo(
                    url=url,
                    platform="pinterest",
                    title=pin_data.get("title", "Pinterest Pin"),
                    thumbnail_url=pin_data["image_url"],
                    media_type="image",
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=pin_data["image_url"],
                    download_supported=True,
                    embed_supported=True,
                )
        except Exception:
            pass

    # 3. Reddit specific photo / gallery / video handler
    if "reddit.com" in url or "redd.it" in url:
        try:
            reddit_data = await _scrape_reddit(url)
            if reddit_data.get("is_image") and reddit_data.get("image_url"):
                format_opts = build_image_format_options(reddit_data["image_url"])
                return MediaInfo(
                    url=url,
                    platform="reddit",
                    title=reddit_data.get("title", "Reddit Post"),
                    thumbnail_url=reddit_data["image_url"],
                    media_type="image",
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=reddit_data["image_url"],
                    download_supported=True,
                    embed_supported=True,
                )
            elif reddit_data.get("video_url"):
                v_url = reddit_data["video_url"]
                max_h = reddit_data.get("max_height")
                if not max_h:
                    h_match = re.search(r'[_/](\d{3,4})\.(?:mp4|m3u8|webm)', v_url)
                    if h_match:
                        max_h = int(h_match.group(1))
                format_opts = build_format_options(30, max_height=max_h)
                return MediaInfo(
                    url=url,
                    platform="reddit",
                    title=reddit_data.get("title", "Reddit Video"),
                    thumbnail_url=reddit_data.get("thumbnail"),
                    duration=30,
                    media_type="video",
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=reddit_data["video_url"],
                    download_supported=True,
                    embed_supported=True,
                )
            else:
                # Graceful failure for Reddit when extraction returns empty
                return MediaInfo(
                    url=url,
                    platform="reddit",
                    title="Reddit Post",
                    media_type="image",
                    formats=[],
                    format_options=[],
                    download_url=url,
                    download_supported=False,
                    embed_supported=True,
                    error="unsupported_reddit",
                    error_message="Unable to extract media from this Reddit post. Please verify the post is public and contains supported media.",
                )
        except Exception:
            pass

    # 4. Threads photo/video handler
    if "threads.net" in url or "threads.com" in url:
        try:
            th_data = await _scrape_threads(url)
            if th_data.get("error") == "invalid_post":
                return MediaInfo(
                    url=url,
                    platform="threads",
                    title="Threads Post",
                    media_type="image",
                    formats=[],
                    format_options=[],
                    download_url=url,
                    download_supported=False,
                    embed_supported=True,
                    error="unsupported_threads",
                    error_message="This Threads post is invalid, private, or has been removed.",
                )

            canonical = th_data.get("canonical_url") or url
            if th_data.get("is_carousel") and th_data.get("slides") and len(th_data["slides"]) > 1:
                slides_list: list[SlideItem] = []
                for s in th_data["slides"]:
                    s_idx = s["slide_index"]
                    s_url = s["download_url"]
                    s_fmt_opts = build_image_format_options(s_url)
                    s_formats = [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in s_fmt_opts]
                    slides_list.append(SlideItem(
                        id=s.get("id") or f"slide_{s_idx}",
                        slide_index=s_idx,
                        media_type="image",
                        title=f"Slide {s_idx}",
                        thumbnail_url=s.get("thumbnail_url") or s_url,
                        download_url=s_url,
                        formats=s_formats,
                        format_options=s_fmt_opts,
                    ))

                cover_slide = slides_list[0]
                return MediaInfo(
                    url=canonical,
                    platform="threads",
                    title=th_data.get("title") or "Threads Carousel",
                    thumbnail_url=cover_slide.thumbnail_url,
                    media_type="image",
                    duration=0,
                    formats=cover_slide.formats,
                    format_options=cover_slide.format_options,
                    download_url=cover_slide.download_url,
                    download_supported=True,
                    embed_supported=True,
                    is_carousel=True,
                    slide_count=len(slides_list),
                    slides=slides_list,
                )

            if th_data.get("is_image") and th_data.get("image_url") and th_data["image_url"] != url:
                target_img = th_data["image_url"]
                format_opts = build_image_format_options(target_img)
                return MediaInfo(
                    url=canonical,
                    platform="threads",
                    title=th_data.get("title") or "Threads Photo",
                    thumbnail_url=th_data.get("thumbnail") or target_img,
                    media_type="image",
                    duration=0,
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=target_img,
                    download_supported=True,
                    embed_supported=True,
                )
            elif th_data.get("video_url") and th_data["video_url"] != url:
                video_url = th_data["video_url"]
                thumbnail = th_data.get("thumbnail") or th_data.get("image_url")
                format_opts = build_format_options(30)
                return MediaInfo(
                    url=canonical,
                    platform="threads",
                    title=th_data.get("title") or "Threads Video",
                    thumbnail_url=thumbnail,
                    duration=30,
                    media_type="video",
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=video_url,
                    download_supported=True,
                    embed_supported=True,
                )
            else:
                # Graceful failure for Threads when extraction returns empty or no CDN media
                return MediaInfo(
                    url=canonical,
                    platform="threads",
                    title="Threads Post",
                    media_type="image",
                    formats=[],
                    format_options=[],
                    download_url=url,
                    download_supported=False,
                    embed_supported=True,
                    error="unsupported_threads",
                    error_message="Unable to extract media from this Threads post. Please ensure the post is public and contains supported media.",
                )
        except Exception:
            pass
    # 5. X / Twitter handler
    if "x.com" in url or "twitter.com" in url or "t.co" in url:
        try:
            x_data = await _scrape_x(url)
            if x_data.get("is_image") and x_data.get("image_url"):
                format_opts = build_image_format_options(x_data["image_url"])
                return MediaInfo(
                    url=url,
                    platform="x_twitter",
                    title=x_data.get("title", "X Photo"),
                    thumbnail_url=x_data.get("thumbnail") or x_data["image_url"],
                    media_type="image",
                    duration=0,
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=x_data["image_url"],
                    download_supported=True,
                    embed_supported=True,
                )
            elif x_data.get("video_url") and x_data["video_url"] != url:
                variants = x_data.get("variants") or [{"url": x_data["video_url"]}]
                dur = x_data.get("duration") or 0
                format_opts = build_real_format_options(
                    variants,
                    platform="x",
                    duration_sec=dur,
                    source_audio_bitrate_kbps=128,
                )
                preferred = next((opt for opt in format_opts if opt.is_preferred), format_opts[0] if format_opts else None)
                main_dl_url = preferred.download_url if preferred and preferred.download_url else x_data["video_url"]
                formats_list = [
                    f"{opt.ext} {opt.quality}" + (f" ({opt.file_size_formatted})" if opt.file_size_formatted else "")
                    for opt in format_opts
                ]
                return MediaInfo(
                    url=url,
                    platform="x_twitter",
                    title=x_data.get("title", "X Video"),
                    thumbnail_url=x_data.get("thumbnail"),
                    duration=dur,
                    media_type="video",
                    formats=formats_list,
                    format_options=format_opts,
                    download_url=main_dl_url,
                    download_supported=True,
                    embed_supported=True,
                )
            else:
                return MediaInfo(
                    url=url,
                    platform="x_twitter",
                    title="X Post",
                    media_type="image",
                    formats=[],
                    format_options=[],
                    download_url=url,
                    download_supported=False,
                    embed_supported=True,
                    error="unsupported_x",
                    error_message="Unable to extract media from this X / Twitter post. Please ensure the post is public and contains supported media.",
                )
        except Exception:
            pass

    # 6. Universal yt-dlp extraction for videos and rich media
    from app.services.media_service import (
        _get_youtube_cookiefile,
        _get_instagram_cookiefile,
        _get_threads_cookiefile,
        _get_x_cookiefile,
        _get_reddit_cookiefile,
        get_youtube_player_clients,
    )
    is_yt = "youtube.com" in url or "youtu.be" in url
    is_ig = "instagram.com" in url or "instagr.am" in url
    is_threads = "threads.net" in url or "threads.com" in url
    is_x = "x.com" in url or "twitter.com" in url or "t.co" in url
    is_reddit = "reddit.com" in url or "redd.it" in url

    yt_cookie = _get_youtube_cookiefile() if is_yt else None
    has_yt_cookies = bool(yt_cookie)

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'format': 'bestvideo+bestaudio/best',
        'socket_timeout': 15,
        'extractor_args': {
            'youtube': {
                'player_client': get_youtube_player_clients(has_yt_cookies)
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    }

    if is_yt:
        if yt_cookie:
            ydl_opts['cookiefile'] = yt_cookie
        ydl_opts['retries'] = 3
        ydl_opts['fragment_retries'] = 3
        ydl_opts['sleep_interval'] = 3
        ydl_opts['sleep_interval_requests'] = 3
    elif is_ig:
        ig_cookie = _get_instagram_cookiefile()
        if ig_cookie:
            ydl_opts['cookiefile'] = ig_cookie
    elif is_threads:
        th_cookie = _get_threads_cookiefile()
        if th_cookie:
            ydl_opts['cookiefile'] = th_cookie
    elif is_x:
        x_cookie = _get_x_cookiefile()
        if x_cookie:
            ydl_opts['cookiefile'] = x_cookie
    elif is_reddit:
        rd_cookie = _get_reddit_cookiefile()
        if rd_cookie:
            ydl_opts['cookiefile'] = rd_cookie

    def _extract():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            if is_ig:
                try:
                    raw_info = ydl.extract_info(url, download=False, process=False)
                    if raw_info and raw_info.get('_type') == 'playlist':
                        return raw_info
                    elif raw_info:
                        return ydl.process_ie_result(raw_info, download=False)
                except Exception:
                    pass
            return ydl.extract_info(url, download=False)

    loop = asyncio.get_event_loop()
    try:
        info = await loop.run_in_executor(None, _extract)
        clean_platform_label = platform_name.replace('_', ' ').title()
        title = info.get('title') or info.get('description') or f"{clean_platform_label} Media"
        thumbnail = info.get('thumbnail') or (info.get('thumbnails', [{}])[-1].get('url') if info.get('thumbnails') else None)
        duration = info.get('duration', 0)
        
        # Check for Instagram Carousel (multi-slide playlist)
        entries = list(info.get('entries', [])) if (info and info.get('_type') == 'playlist') else []
        if is_ig and entries and len(entries) > 1:
            slides: list[SlideItem] = []
            for idx, e in enumerate(entries):
                slide_index = idx + 1
                slide_id = e.get('id') or f"slide_{slide_index}"
                slide_formats = e.get('formats', [])
                slide_has_video = bool(slide_formats and any(f.get('vcodec') != 'none' for f in slide_formats)) or bool(e.get('vcodec') and e.get('vcodec') != 'none')
                slide_type = "video" if slide_has_video else "image"
                
                # Thumbnail
                slide_thumb = e.get('thumbnail')
                if not slide_thumb and e.get('thumbnails'):
                    slide_thumb = e.get('thumbnails')[-1].get('url')
                
                if slide_has_video:
                    slide_dl_url = f"{url}#slide={slide_index}"
                    slide_fmt_opts = build_format_options(
                        duration_sec=int(e.get('duration') or duration or 30),
                        raw_formats=e.get('formats'),
                        max_height=e.get('height'),
                        max_width=e.get('width')
                    )
                else:
                    # Image slide: highest resolution direct candidate
                    slide_dl_url = (e.get('thumbnails', [{}])[-1].get('url') if e.get('thumbnails') else None) or e.get('url') or slide_thumb
                    slide_fmt_opts = build_image_format_options(slide_dl_url)
                
                slide_formats_formatted = [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in slide_fmt_opts]
                slides.append(SlideItem(
                    id=slide_id,
                    slide_index=slide_index,
                    media_type=slide_type,
                    title=f"Slide {slide_index}",
                    thumbnail_url=slide_thumb,
                    download_url=slide_dl_url,
                    formats=slide_formats_formatted,
                    format_options=slide_fmt_opts,
                ))

            cover_thumb = slides[0].thumbnail_url or thumbnail
            cover_dl = slides[0].download_url
            cover_fmt_opts = slides[0].format_options
            cover_formats = slides[0].formats
            has_videos = any(s.media_type == "video" for s in slides)
            has_images = any(s.media_type == "image" for s in slides)
            combined_type = "mixed" if (has_videos and has_images) else ("video" if has_videos else "image")

            return MediaInfo(
                url=url,
                platform=platform_name,
                title=title[:100],
                thumbnail_url=cover_thumb,
                duration=duration,
                media_type=combined_type,
                formats=cover_formats,
                format_options=cover_fmt_opts,
                download_url=cover_dl,
                download_supported=True,
                embed_supported=True,
                is_carousel=True,
                slide_count=len(slides),
                slides=slides,
            )

        # If a playlist had only 1 entry, unpack it as the primary item
        if entries and len(entries) == 1:
            info = entries[0]
            title = info.get('title') or info.get('description') or title
            thumbnail = info.get('thumbnail') or (info.get('thumbnails', [{}])[-1].get('url') if info.get('thumbnails') else thumbnail)
            duration = info.get('duration', duration)

        # Check if media is purely an image/photo post
        has_video_formats = bool(info.get('formats') and any(f.get('vcodec') != 'none' for f in info['formats']))
        has_audio_formats = bool(info.get('formats') and any(f.get('acodec') != 'none' for f in info['formats']))

        if is_yt and not (has_video_formats or has_audio_formats):
            video_id_match = re.search(r'(?:v=|\/|shorts\/)([0-9A-Za-z_-]{11})', url)
            video_id = video_id_match.group(1) if video_id_match else None
            logger.warning(
                "youtube_universal_extract_unsupported_video",
                platform="youtube",
                video_id=video_id,
                url=url,
                player_clients=get_youtube_player_clients(has_yt_cookies),
                reason="no_media_formats_returned",
            )
            return MediaInfo(
                url=url,
                platform="youtube",
                title=title[:100],
                thumbnail_url=thumbnail,
                duration=duration,
                media_type="video",
                formats=[],
                format_options=[],
                download_url=url,
                download_supported=False,
                embed_supported=True,
                error="unsupported_video",
                error_message="This video can't be downloaded right now due to YouTube restrictions.",
            )
        
        if not has_video_formats and thumbnail:
            if is_ig and re.search(r'c\d+\.\d+', thumbnail):
                try:
                    ig_data = await _scrape_instagram(url)
                    if ig_data.get("image_url") and not re.search(r'c\d+\.\d+', ig_data["image_url"]):
                        thumbnail = ig_data["image_url"]
                except Exception:
                    pass
            format_opts = build_image_format_options(thumbnail)
            formats = [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts]
            return MediaInfo(
                url=url,
                platform=platform_name,
                title=title[:100],
                thumbnail_url=thumbnail,
                duration=0,
                media_type="image",
                formats=formats,
                format_options=format_opts,
                download_url=thumbnail,
                download_supported=True,
                embed_supported=True,
            )

        direct_download_url = None
        if is_ig and info.get('formats'):
            best_with_audio = [
                f for f in info['formats']
                if f.get('url') and (
                    (f.get('vcodec') != 'none' and f.get('acodec') != 'none')
                    or str(f.get('format_id', '')).endswith(('-0', '-1', '-2', '-3'))
                    or str(f.get('format_id', '')) in ('0', '1', '2', '3')
                )
            ]
            if best_with_audio:
                direct_download_url = best_with_audio[-1].get('url')
        if not direct_download_url:
            direct_download_url = info.get('url')
        if not direct_download_url and info.get('formats'):
            best_with_audio = [
                f for f in info['formats']
                if f.get('url') and f.get('vcodec') != 'none' and f.get('acodec') != 'none'
            ]
            if best_with_audio:
                direct_download_url = best_with_audio[-1].get('url')
            else:
                best_fmt = [f for f in info['formats'] if f.get('url') and f.get('vcodec') != 'none']
                if best_fmt:
                    direct_download_url = best_fmt[-1].get('url')
                else:
                    direct_download_url = info['formats'][-1].get('url')

        if platform_name == "x_twitter" or "x.com" in url or "twitter.com" in url:
            raw_formats = info.get("formats") or []
            prog_variants = []
            for f in raw_formats:
                proto = str(f.get("protocol", "")).lower()
                ext = str(f.get("ext", "")).lower()
                f_url = f.get("url") or ""
                if ("http" in proto or ext == "mp4") and f.get("vcodec") != "none" and "m3u8" not in proto and "m3u8" not in f_url:
                    prog_variants.append({
                        "url": f_url,
                        "format_id": f.get("format_id"),
                        "width": f.get("width"),
                        "height": f.get("height"),
                        "bitrate": f.get("tbr") or f.get("vbr") or 0,
                        "codec": f.get("vcodec") or "h264",
                        "ext": "mp4",
                        "filesize": f.get("filesize") or f.get("filesize_approx"),
                    })
            if prog_variants:
                format_opts = build_real_format_options(
                    prog_variants,
                    platform="x",
                    duration_sec=duration,
                    source_audio_bitrate_kbps=128,
                )
            else:
                format_opts = build_real_format_options(
                    [{"url": direct_download_url or url, "ext": "mp4"}],
                    platform="x",
                    duration_sec=duration,
                    source_audio_bitrate_kbps=128,
                    is_single_file=True,
                )
        else:
            format_opts = build_format_options(
                duration_sec=duration,
                raw_formats=info.get('formats'),
                max_height=info.get('height'),
                max_width=info.get('width')
            )
        formats = [
            f"{opt.ext} {opt.quality}" + (f" ({opt.file_size_formatted})" if opt.file_size_formatted else "")
            for opt in format_opts
        ]

        return MediaInfo(
            url=url,
            platform=platform_name,
            title=title[:100],
            thumbnail_url=thumbnail,
            duration=duration,
            media_type="video",
            formats=formats,
            format_options=format_opts,
            download_url=direct_download_url or url,
            download_supported=True,
            embed_supported=True,
        )
    except Exception as e:
        if is_yt:
            video_id_match = re.search(r'(?:v=|\/|shorts\/)([0-9A-Za-z_-]{11})', url)
            video_id = video_id_match.group(1) if video_id_match else None
            logger.warning(
                "youtube_universal_extract_unsupported_video",
                platform="youtube",
                video_id=video_id,
                url=url,
                player_clients=get_youtube_player_clients(has_yt_cookies),
                raw_error=str(e),
            )
            return MediaInfo(
                url=url,
                platform="youtube",
                title="YouTube Video",
                media_type="video",
                formats=[],
                format_options=[],
                download_url=url,
                download_supported=False,
                embed_supported=True,
                error="unsupported_video",
                error_message="This video can't be downloaded right now due to YouTube restrictions.",
            )

        if is_ig:
            try:
                ig_data = await _scrape_instagram(url)
                if ig_data.get("is_image") and ig_data.get("image_url"):
                    format_opts = build_image_format_options(ig_data["image_url"])
                    return MediaInfo(
                        url=url,
                        platform="instagram",
                        title=ig_data.get("title", "Instagram Photo"),
                        thumbnail_url=ig_data["image_url"],
                        media_type="image",
                        formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                        format_options=format_opts,
                        download_url=ig_data["image_url"],
                        download_supported=True,
                        embed_supported=True,
                        muted=False,
                    )
                elif ig_data.get("video_url"):
                    format_opts = build_format_options(30)
                    return MediaInfo(
                        url=url,
                        platform="instagram",
                        title=ig_data.get("title", "Instagram Video"),
                        thumbnail_url=ig_data.get("thumbnail"),
                        duration=30,
                        media_type="video",
                        formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                        format_options=format_opts,
                        download_url=ig_data["video_url"],
                        download_supported=True,
                        embed_supported=True,
                        muted=True,
                    )
            except Exception:
                pass

        clean_platform_label = platform_name.replace('_', ' ').title()
        is_probable_image = (
            platform_name == "pinterest"
            or "pin" in url.lower()
            or any(url.lower().endswith(e) or f"{e}?" in url.lower() for e in (".jpg", ".jpeg", ".png", ".webp", ".gif"))
        )
        
        if is_probable_image:
            format_opts = build_image_format_options(url)
            formats = [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts]
            return MediaInfo(
                url=url,
                platform=platform_name,
                title=f"{clean_platform_label} Photo Post",
                thumbnail_url=url if any(url.lower().endswith(e) for e in (".jpg", ".jpeg", ".png", ".webp", ".gif")) else None,
                media_type="image",
                formats=formats,
                format_options=format_opts,
                download_url=url,
                download_supported=True,
                embed_supported=True,
            )

        format_opts = build_format_options(60)
        formats = [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts]
        return MediaInfo(
            url=url,
            platform=platform_name,
            title=f"{clean_platform_label} Media Content",
            media_type="video",
            formats=formats,
            format_options=format_opts,
            download_url=url,
            download_supported=True,
            embed_supported=True,
        )
