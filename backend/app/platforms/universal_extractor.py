from __future__ import annotations
import asyncio
import re
from urllib.parse import urlparse
import httpx
import yt_dlp
from app.core.security.ssrf import resolve_and_check, SSRFBlockedError
from app.schemas.analyze import MediaInfo, FormatOption

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
                "image_url": url,
                "is_image": True,
            }

        crawler_headers = {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        title = "Reddit Post"
        thumb_img = None

        # 1. Social Crawler OpenGraph Fetch (Bypasses JS Challenge)
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers=crawler_headers) as client:
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
                        "image_url": img_match.group(1),
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
                        "image_url": thumb_img,
                        "is_image": True,
                    }
    except Exception:
        pass

    return {}


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
        }

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif")):
        return {
            "title": "Instagram Photo",
            "image_url": url,
            "is_image": True,
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
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
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
                        }
        except Exception:
            pass

    # Tier 2: OpenGraph social crawler
    try:
        crawler_headers = {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=8.0, headers=crawler_headers) as client:
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
                }
            if og_img and not thumbnail_img:
                thumbnail_img = og_img.group(1).replace("&amp;", "&")
    except Exception:
        pass

    return {
        "title": title,
        "video_url": url,
        "thumbnail": thumbnail_img,
        "is_image": False,
    }


async def _scrape_threads(url: str) -> dict:
    """Scrape Threads post for image or video with multi-tier extraction."""
    parsed = urlparse(url)
    if parsed.hostname:
        resolve_and_check(parsed.hostname)

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".mp4", ".m4v", ".mov", ".webm")) or "cdninstagram.com" in url or "fbcdn.net" in url:
        return {
            "title": "Threads Video",
            "video_url": url,
            "is_image": False,
        }

    if any(url.lower().endswith(ext) or f"{ext}?" in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif")):
        return {
            "title": "Threads Photo",
            "image_url": url,
            "is_image": True,
        }

    crawler_headers = {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    
    title = "Threads Video"
    thumbnail_img = None

    try:
        # 1. Social Crawler OpenGraph & Embedded Script Scraping
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers=crawler_headers) as client:
            resp = await client.get(url)
            html = resp.text
            
            og_vid = re.search(r'<meta\s+property=["\']og:video(?::secure_url)?["\']\s+content=["\']([^"\']+)["\']', html)
            og_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
            og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)
            
            if og_title:
                raw_title = og_title.group(1).replace("&amp;", "&")
                if raw_title and not any(k in raw_title for k in ("Log in", "Threads •", "Threads &#x2022;")):
                    title = raw_title
            
            if og_vid:
                return {
                    "title": title,
                    "video_url": og_vid.group(1).replace("&amp;", "&"),
                    "thumbnail": og_img.group(1).replace("&amp;", "&") if og_img else None,
                    "is_image": False,
                }

            # Search for embedded video in HTML or JSON script tags
            mp4_matches = re.findall(r'https?:\\?/\\?/[^"\'\\ ]+?(?:cdninstagram\.com|fbcdn\.net)[^"\'\\ ]*?\.mp4[^"\'\\ ]*', html)
            if mp4_matches:
                clean_url = mp4_matches[0].replace(r"\u0026", "&").replace(r"\/", "/")
                return {
                    "title": title,
                    "video_url": clean_url,
                    "thumbnail": og_img.group(1).replace("&amp;", "&") if og_img else None,
                    "is_image": False,
                }

            if og_img:
                img_url = og_img.group(1).replace("&amp;", "&")
                if not any(img_url.endswith(e) for e in ("favicon.ico", "threads_logo.png", "kHwIMM5b8PW.webp")):
                    thumbnail_img = img_url
                    # Only treat as image if no video indicator exists
                    if not any(k in html.lower() for k in ("video_versions", "playback_url", "videoobject", "playable")):
                        return {
                            "title": title if title != "Threads Video" else "Threads Photo",
                            "image_url": img_url,
                            "is_image": True,
                        }

        # 2. lovethreads.net API fallback
        async with httpx.AsyncClient(follow_redirects=True, timeout=8.0) as client:
            endpoint = "https://lovethreads.net/api/ajaxSearch"
            data = {"q": url, "t": "media", "lang": "en"}
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
                    v_match = re.search(r'href=["\'](https?://[^"\']+)["\'][^>]*title=["\']Download Video["\']', data_html)
                    p_match = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', data_html)
                    if v_match:
                        return {
                            "title": title or "Threads Video",
                            "video_url": v_match.group(1),
                            "thumbnail": p_match.group(1) if p_match else thumbnail_img,
                            "is_image": False,
                        }
                    elif p_match and not any(k in data_html.lower() for k in ("download video", "video", ".mp4")):
                        return {
                            "title": title or "Threads Photo",
                            "image_url": p_match.group(1),
                            "is_image": True,
                        }
    except Exception:
        pass

    # Default to Video so that video format options are displayed and handled properly
    return {
        "title": title,
        "video_url": url,
        "thumbnail": thumbnail_img,
        "is_image": False,
    }

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
        except Exception:
            pass

    # 4. Threads photo/video handler
    if "threads.net" in url or "threads.com" in url:
        try:
            th_data = await _scrape_threads(url)
            if th_data.get("is_image") and th_data.get("image_url"):
                format_opts = build_image_format_options(th_data["image_url"])
                return MediaInfo(
                    url=url,
                    platform="threads",
                    title=th_data.get("title", "Threads Photo"),
                    thumbnail_url=th_data["image_url"],
                    media_type="image",
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=th_data["image_url"],
                    download_supported=True,
                    embed_supported=True,
                )
            else:
                video_url = th_data.get("video_url") or url
                thumbnail = th_data.get("thumbnail") or th_data.get("image_url")
                format_opts = build_format_options(30)
                return MediaInfo(
                    url=url,
                    platform="threads",
                    title=th_data.get("title", "Threads Video"),
                    thumbnail_url=thumbnail,
                    duration=30,
                    media_type="video",
                    formats=[f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts],
                    format_options=format_opts,
                    download_url=video_url,
                    download_supported=True,
                    embed_supported=True,
                )
        except Exception:
            pass

    # 5. Instagram photo/video handler
    if "instagram.com" in url or "instagr.am" in url:
        try:
            ig_data = await _scrape_instagram(url)
            if ig_data.get("video_url") and ("cdninstagram.com" in ig_data["video_url"] or "fbcdn.net" in ig_data["video_url"]):
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
                )
            elif ig_data.get("is_image") and ig_data.get("image_url"):
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
                )
        except Exception:
            pass

    # 6. Universal yt-dlp extraction for videos and rich media
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'format': 'bestvideo+bestaudio/best',
        'socket_timeout': 15,
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'android']
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    }

    from app.services.media_service import _get_youtube_cookiefile, _get_instagram_cookiefile
    if "youtube.com" in url or "youtu.be" in url:
        cookie_file = _get_youtube_cookiefile()
        if cookie_file:
            ydl_opts['cookiefile'] = cookie_file
            ydl_opts['extractor_args']['youtube']['player_client'] = ['web', 'mweb', 'android', 'ios']
        ydl_opts['retries'] = 3
        ydl_opts['fragment_retries'] = 3
        ydl_opts['sleep_interval'] = 1
        ydl_opts['sleep_interval_requests'] = 1
    elif "instagram.com" in url or "instagr.am" in url:
        ig_cookie = _get_instagram_cookiefile()
        if ig_cookie:
            ydl_opts['cookiefile'] = ig_cookie

    def _extract():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            return ydl.extract_info(url, download=False)

    loop = asyncio.get_event_loop()
    try:
        info = await loop.run_in_executor(None, _extract)
        clean_platform_label = platform_name.replace('_', ' ').title()
        title = info.get('title') or info.get('description') or f"{clean_platform_label} Media"
        thumbnail = info.get('thumbnail') or (info.get('thumbnails', [{}])[-1].get('url') if info.get('thumbnails') else None)
        duration = info.get('duration', 0)
        
        # Check if media is purely an image/photo post
        has_video_formats = bool(info.get('formats') and any(f.get('vcodec') != 'none' for f in info['formats']))
        
        if not has_video_formats and thumbnail:
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

        direct_download_url = info.get('url')
        if not direct_download_url and info.get('formats'):
            best_fmt = [f for f in info['formats'] if f.get('url') and f.get('vcodec') != 'none']
            if best_fmt:
                direct_download_url = best_fmt[-1].get('url')
            else:
                direct_download_url = info['formats'][-1].get('url')

        format_opts = build_format_options(
            duration_sec=duration,
            raw_formats=info.get('formats'),
            max_height=info.get('height'),
            max_width=info.get('width')
        )
        formats = [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts]

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
    except Exception:
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
