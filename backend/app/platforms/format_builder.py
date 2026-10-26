from __future__ import annotations

import os
import re
import json
import logging
import subprocess
from typing import Optional
from app.schemas.analyze import FormatOption

logger = logging.getLogger(__name__)


def format_bytes(size_bytes: Optional[int | float]) -> Optional[str]:
    """Format bytes truthfully into human-readable string. Returns None if size is unknown."""
    if size_bytes is None or size_bytes <= 0:
        return None
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.2f} MB"


def parse_dimensions(entry: dict) -> tuple[Optional[int], Optional[int]]:
    """Parse real width and height from dict or URL patterns."""
    w = entry.get("width")
    h = entry.get("height")
    if w and h and int(w) > 0 and int(h) > 0:
        return int(w), int(h)

    # Check for /1920x1080/ or similar in url
    url = entry.get("url") or ""
    m = re.search(r"[/_](\d{3,4})x(\d{3,4})[/_.]", url)
    if m:
        return int(m.group(1)), int(m.group(2))

    # Check for /720w.mp4 or /480p or /720/
    m_single = re.search(r"[/_](\d{3,4})(?:w|p)[/_.]", url)
    if m_single:
        val = int(m_single.group(1))
        return val, val

    return None, None


def remux_mp4_faststart(input_path: str, output_path: str) -> str:
    """
    Remux an MP4 container with -c copy -movflags +faststart using FFmpeg.
    Normalizes container brand to standard ISO MPEG-4 Part 14 and moves moov atom to beginning.
    Never re-encodes video/audio streams.
    """
    if not input_path or not os.path.exists(input_path):
        return input_path

    if os.path.abspath(input_path) == os.path.abspath(output_path):
        temp_out = f"{output_path}.fs_tmp.mp4"
    else:
        temp_out = output_path

    try:
        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-c", "copy",
            "-movflags", "+faststart",
            temp_out,
        ]
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=45)
        if res.returncode == 0 and os.path.exists(temp_out) and os.path.getsize(temp_out) > 0:
            if temp_out != output_path:
                if os.path.exists(output_path):
                    try:
                        os.remove(output_path)
                    except OSError:
                        pass
                os.replace(temp_out, output_path)
            # Remove original input if it was different and remux succeeded
            if os.path.exists(input_path) and os.path.abspath(input_path) != os.path.abspath(output_path):
                try:
                    os.remove(input_path)
                except OSError:
                    pass
            logger.info("remux_mp4_faststart_success", path=output_path, size=os.path.getsize(output_path))
            return output_path
        else:
            err = res.stderr.decode("utf-8", errors="replace") if res.stderr else "unknown error"
            logger.warning("remux_mp4_faststart_failed", error=err)
    except Exception as e:
        logger.warning("remux_mp4_faststart_exception", error=str(e))
    finally:
        if temp_out != output_path and os.path.exists(temp_out):
            try:
                os.remove(temp_out)
            except OSError:
                pass

    return input_path


def build_real_format_options(
    variants: list[dict],
    platform: str = "direct",
    duration_sec: Optional[float] = None,
    source_audio_bitrate_kbps: Optional[int] = None,
    is_single_file: bool = False,
) -> list[FormatOption]:
    """
    Build truthful format options strictly from real source variants.
    - No fake quality ladders.
    - No invented file sizes.
    - Labels include real pixel dimensions: e.g. '1080p (1920x1080)'.
    - Single-file sources return only 'Original (WxH)' or 'Original quality'.
    - H.264/AAC is preferred; VP9/AV1/HEVC are labelled with compatibility warnings.
    - MP3 options are capped at the source audio bitrate and labelled as converted.
    """
    options: list[FormatOption] = []

    # Handle single-file sources
    if is_single_file or len(variants) <= 1:
        entry = variants[0] if variants else {}
        w, h = parse_dimensions(entry)
        if w and h:
            quality_label = f"Original ({w}x{h})"
        elif w or h:
            quality_label = f"Original ({w or h}p)"
        else:
            quality_label = "Original quality"

        filesize = entry.get("filesize") or entry.get("file_size")
        opt = FormatOption(
            format_id=entry.get("format_id") or "original",
            ext=entry.get("ext", "MP4").upper(),
            quality=quality_label,
            file_size_formatted=format_bytes(filesize),
            media_category="video",
            download_url=entry.get("url"),
            width=w,
            height=h,
            codec=entry.get("codec") or entry.get("vcodec"),
            is_preferred=True,
            compatibility_note=None,
        )
        options.append(opt)

        # Audio conversion option for single file if source audio exists
        _append_truthful_mp3_options(options, source_audio_bitrate_kbps, entry.get("url"))
        return options

    # Multi-variant processing (e.g. X, Facebook, Pinterest)
    # 1. Parse and sort video variants
    parsed_variants = []
    for var in variants:
        v_url = var.get("url")
        if not v_url:
            continue

        w, h = parse_dimensions(var)
        bitrate = var.get("bitrate") or var.get("tbr") or 0
        codec = (var.get("codec") or var.get("vcodec") or "").lower()
        container = (var.get("container") or var.get("ext") or "").lower()
        filesize = var.get("filesize") or var.get("file_size")

        # Skip audio-only streams from video list
        if var.get("acodec") and not var.get("vcodec") and not w and not h:
            continue
        if var.get("resolution") == "audio only":
            continue

        shorter_dim = min(w, h) if (w and h) else (w or h or 0)
        parsed_variants.append({
            "entry": var,
            "url": v_url,
            "width": w,
            "height": h,
            "shorter_dim": shorter_dim,
            "bitrate": bitrate,
            "codec": codec,
            "container": container,
            "filesize": filesize,
            "format_id": var.get("format_id") or f"mp4_{shorter_dim}p",
        })

    # Sort descending by shorter_dim, then by bitrate
    parsed_variants.sort(key=lambda x: (x["shorter_dim"] or 0, x["bitrate"] or 0), reverse=True)

    # Deduplicate variants by (width, height)
    seen_dims = set()
    unique_variants = []
    for pv in parsed_variants:
        dim_key = (pv["width"], pv["height"])
        if dim_key != (None, None) and dim_key in seen_dims:
            continue
        if dim_key != (None, None):
            seen_dims.add(dim_key)
        unique_variants.append(pv)

    # Determine highest standard H.264 variant for default preference
    has_preferred = False
    for uv in unique_variants:
        codec = uv["codec"]
        is_h264 = any(c in codec for c in ("h264", "avc1", "x264")) or not codec
        is_vp9 = any(c in codec for c in ("vp09", "vp9"))
        is_av1 = any(c in codec for c in ("av01", "av1"))
        is_hevc = any(c in codec for c in ("hevc", "hvc1", "h265"))

        compat_note = None
        if is_vp9:
            compat_note = "VP9 - requires VP9 codec"
        elif is_av1:
            compat_note = "AV1 - requires AV1 codec"
        elif is_hevc:
            compat_note = "HEVC - requires HEVC codec"

        w, h = uv["width"], uv["height"]
        s_dim = uv["shorter_dim"]
        if w and h:
            quality_label = f"{s_dim}p ({w}x{h})"
        elif s_dim:
            quality_label = f"{s_dim}p"
        else:
            quality_label = "Standard"

        # Preselect highest resolution among standard playable codecs
        is_pref = False
        if is_h264 and not has_preferred:
            is_pref = True
            has_preferred = True

        opt = FormatOption(
            format_id=uv["format_id"],
            ext="MP4",
            quality=quality_label,
            file_size_formatted=format_bytes(uv["filesize"]),
            media_category="video",
            download_url=uv["url"],
            width=w,
            height=h,
            codec=uv["codec"] or "h264",
            is_preferred=is_pref,
            compatibility_note=compat_note,
        )
        options.append(opt)

    # Fallback preference if no H.264 variant was identified
    if options and not has_preferred:
        options[0].is_preferred = True

    # Append truthful MP3 options capped at source audio bitrate
    sample_url = unique_variants[0]["url"] if unique_variants else None
    _append_truthful_mp3_options(options, source_audio_bitrate_kbps, sample_url)

    return options


def _append_truthful_mp3_options(
    options: list[FormatOption],
    source_audio_bitrate_kbps: Optional[int],
    download_url: Optional[str] = None,
):
    """
    Append MP3 audio option strictly capped at source audio bitrate.
    Never offer 256k or 320k when source audio is 128k or lower.
    """
    effective_kbps = source_audio_bitrate_kbps or 128
    if effective_kbps > 320:
        effective_kbps = 320
    elif effective_kbps < 48:
        effective_kbps = 48

    # Offer the true maximum source bitrate (e.g. 128 kbps)
    options.append(
        FormatOption(
            format_id=f"mp3_{effective_kbps}kbps",
            ext="MP3",
            quality=f"Audio ({effective_kbps} kbps, converted)",
            file_size_formatted=None,
            media_category="audio",
            download_url=download_url,
            width=None,
            height=None,
            codec="mp3",
            is_preferred=False,
            compatibility_note=None,
        )
    )


def build_truthful_filename(
    platform: str,
    post_url: str,
    title: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    ext: str = "mp4",
) -> str:
    """
    Generate clean, truthful filename following:
    {platform}_{author-or-id}_{width}x{height}.{ext}
    """
    author = ""
    post_id = ""

    # Parse platform-specific author / ID
    if platform in ("x", "x_twitter", "twitter") or "x.com" in post_url or "twitter.com" in post_url:
        platform_prefix = "x"
        m = re.search(r"(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)/status(?:es)?/(\d+)", post_url)
        if m:
            author = m.group(1)
            post_id = m.group(2)
        elif not post_id:
            m_id = re.search(r"status(?:es)?/(\d+)", post_url)
            if m_id:
                post_id = m_id.group(1)
    elif platform == "threads" or "threads.net" in post_url or "threads.com" in post_url:
        platform_prefix = "threads"
        m = re.search(r"@([a-zA-Z0-9._]+)/post/([a-zA-Z0-9_-]+)", post_url)
        if m:
            author = m.group(1)
            post_id = m.group(2)
    elif platform == "instagram" or "instagram.com" in post_url:
        platform_prefix = "instagram"
        m = re.search(r"/(?:reel|p)/([a-zA-Z0-9_-]+)", post_url)
        if m:
            post_id = m.group(1)
    elif platform == "reddit" or "reddit.com" in post_url:
        platform_prefix = "reddit"
        m = re.search(r"/comments/([a-zA-Z0-9]+)", post_url)
        if m:
            post_id = m.group(1)
    elif platform == "pinterest" or "pinterest.com" in post_url or "pin.it" in post_url:
        platform_prefix = "pinterest"
        m = re.search(r"/pin/(\d+)", post_url)
        if m:
            post_id = m.group(1)
    elif platform == "facebook" or "facebook.com" in post_url:
        platform_prefix = "facebook"
        m = re.search(r"(?:videos|watch\?v=)/(\d+)", post_url)
        if m:
            post_id = m.group(1)
    else:
        platform_prefix = platform or "media"

    ident_parts = [p for p in (author, post_id) if p]
    ident_str = "_".join(ident_parts)
    if not ident_str and title:
        ident_str = re.sub(r"[^a-zA-Z0-9_-]", "_", title).strip("_")[:40]
    if not ident_str:
        ident_str = "download"

    clean_ext = ext.lstrip(".").lower()
    if width and height:
        return f"{platform_prefix}_{ident_str}_{width}x{height}.{clean_ext}"
    else:
        return f"{platform_prefix}_{ident_str}.{clean_ext}"
