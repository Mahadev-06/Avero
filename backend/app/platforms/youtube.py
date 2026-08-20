from __future__ import annotations
import asyncio
import yt_dlp
from app.platforms.base import PlatformAdapter
from app.platforms.capabilities import PLATFORM_CAPABILITIES
from app.schemas.analyze import MediaInfo
from app.schemas.search import SearchResponse, SearchResult
from app.platforms.universal_extractor import build_format_options

import re

def normalize_youtube_url(url: str) -> str:
    """Normalize YouTube URLs (Shorts, youtu.be, mobile) to standard watch format."""
    shorts_match = re.search(r'(?:youtube\.com|youtu\.be)/shorts/([a-zA-Z0-9_\-]+)', url)
    if shorts_match:
        return f"https://www.youtube.com/watch?v={shorts_match.group(1)}"
    
    youtu_match = re.search(r'youtu\.be/([a-zA-Z0-9_\-]+)', url)
    if youtu_match:
        return f"https://www.youtube.com/watch?v={youtu_match.group(1)}"
    
    if "m.youtube.com" in url:
        return url.replace("m.youtube.com", "www.youtube.com")
        
    return url

class YouTubeAdapter(PlatformAdapter):
    name = "youtube"
    url_patterns = ["youtube.com", "youtu.be"]
    capabilities = PLATFORM_CAPABILITIES["youtube"]

    async def validate_url(self, url: str) -> bool:
        return any(p in url for p in self.url_patterns)

    async def analyze(self, url: str) -> MediaInfo:
        clean_url = normalize_youtube_url(url)
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'format': 'best',
            'extractor_args': {
                'youtube': {
                    'player_client': ['ios', 'android']
                }
            },
        }

        from app.services.media_service import _get_youtube_cookiefile
        cookie_file = _get_youtube_cookiefile()
        if cookie_file:
            ydl_opts['cookiefile'] = cookie_file

        def _extract():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(clean_url, download=False)

        loop = asyncio.get_event_loop()
        try:
            info = await loop.run_in_executor(None, _extract)
            title = info.get('title', 'YouTube Video')
            thumbnail = info.get('thumbnail') or (info.get('thumbnails', [{}])[-1].get('url') if info.get('thumbnails') else None)
            duration = info.get('duration', 0)
            
            direct_stream_url = info.get('url')
            if not direct_stream_url and info.get('formats'):
                best_fmt = [f for f in info['formats'] if f.get('url') and f.get('vcodec') != 'none']
                if best_fmt:
                    direct_stream_url = best_fmt[-1].get('url')
                else:
                    direct_stream_url = info['formats'][-1].get('url')

            format_opts = build_format_options(
                duration_sec=duration,
                raw_formats=info.get('formats'),
                max_height=info.get('height'),
                max_width=info.get('width')
            )
            formats = [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts]

            return MediaInfo(
                url=url,
                platform=self.name,
                title=title,
                thumbnail_url=thumbnail,
                duration=duration,
                media_type="video",
                formats=formats,
                format_options=format_opts,
                download_url=url,
                download_supported=True,
                embed_supported=True,
            )
        except Exception as e:
            format_opts = build_format_options(60)
            formats = [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts]
            return MediaInfo(
                url=url,
                platform=self.name,
                title="YouTube Video",
                media_type="video",
                formats=formats,
                format_options=format_opts,
                download_url=url,
                download_supported=True,
                embed_supported=True,
            )

    async def get_available_formats(self, url: str) -> list[str]:
        format_opts = build_format_options(60)
        return [f"{opt.ext} {opt.quality} ({opt.file_size_formatted})" for opt in format_opts]

    async def search(self, query: str, page: int, per_page: int) -> SearchResponse:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'skip_download': True,
        }

        def _search():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(f"ytsearch{per_page}:{query}", download=False)

        loop = asyncio.get_event_loop()
        try:
            info = await loop.run_in_executor(None, _search)
            entries = info.get('entries', [])
            results = []
            for entry in entries:
                if entry:
                    results.append(SearchResult(
                        id=entry.get('id', ''),
                        title=entry.get('title', 'Video'),
                        thumbnail_url=entry.get('thumbnail') or f"https://i.ytimg.com/vi/{entry.get('id')}/hqdefault.jpg",
                        channel=entry.get('uploader') or entry.get('channel') or 'YouTube Channel',
                        duration=entry.get('duration', 0),
                        url=f"https://www.youtube.com/watch?v={entry.get('id')}",
                        platform="youtube"
                    ))
            return SearchResponse(results=results, total=len(results), page=page, has_more=False)
        except Exception:
            return SearchResponse(results=[], total=0, page=page, has_more=False)
