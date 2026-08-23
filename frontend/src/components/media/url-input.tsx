"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient, MediaInfo, DownloadProgress, SearchResult } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MediaPreview } from './media-preview';
import { triggerFileDownload } from '@/lib/utils';
import { Video, Music, Download, Clock, Search, Loader2, Copy, Check, Plus, Play, AlertCircle, Image as ImageIcon, Trash2, ArrowUpLeft, X, VolumeX } from 'lucide-react';
import { TextShimmerWave } from '@/components/core/text-shimmer-wave';

interface PlatformIcon {
  name: string;
  type: string;
  color: string;
  placeholder: string;
  svg: React.ReactNode;
}

const PLATFORM_ICONS: PlatformIcon[] = [
  {
    name: 'YouTube',
    type: 'youtube',
    color: '#FF0000',
    placeholder: 'Paste YouTube link...',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
        <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432"/>
      </svg>
    ),
  },
  {
    name: 'Instagram',
    type: 'instagram',
    color: '#E1306C',
    placeholder: 'Paste Instagram link...',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="igGradHighRes" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD521" />
            <stop offset="25%" stopColor="#F50000" />
            <stop offset="50%" stopColor="#B900B4" />
            <stop offset="100%" stopColor="#7E00FF" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#igGradHighRes)"/>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none"/>
        <circle cx="12" cy="12" r="3.8" stroke="#FFFFFF" strokeWidth="1.8" fill="none"/>
        <circle cx="16.5" cy="7.5" r="1.1" fill="#FFFFFF"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    type: 'tiktok',
    color: '#00F2FE',
    placeholder: 'Paste TikTok link...',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path fill="#25F4EE" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.55-1.24 2.55.05.9.6 1.75 1.41 2.16.85.45 1.92.42 2.73-.06.77-.45 1.28-1.29 1.34-2.19.04-3.58.02-7.16.02-10.74z"/>
        <path fill="#FE2C55" d="M11.5 1.5c1.2 0 2.4 0 3.6 0 .07 1.4.58 2.8 1.6 3.8 1 1 2.4 1.5 3.8 1.6v3.6c-1.3-.05-2.6-.32-3.8-.88-.5-.23-1-.53-1.4-.84-.01 2.6.01 5.2-.02 7.8-.07 1.2-.48 2.5-1.2 3.5-1.2 1.7-3.2 2.8-5.3 2.9-1.3.07-2.5-.28-3.6-.92-1.8-1-3.1-3-3.3-5.1-.02-.4-.03-.9-.01-1.3.16-1.7 1-3.3 2.3-4.4 1.5-1.3 3.6-1.9 5.5-1.5.02 1.3-.04 2.6-.04 4-.9-.28-1.9-.2-2.7.33-.7.5-1.2 1.4-1.1 2.3.04.8.5 1.5 1.2 1.9.7.4 1.7.38 2.4-.05.7-.4 1.1-1.1 1.2-1.9.04-3.2.02-6.4.02-9.6z" opacity="0.85" />
        <path fill="#FFFFFF" d="M12 1c1.2 0 2.4 0 3.6 0 .07 1.4.58 2.8 1.6 3.8 1 1 2.4 1.5 3.8 1.6v3.6c-1.3-.05-2.6-.32-3.8-.88-.5-.23-1-.53-1.4-.84-.01 2.6.01 5.2-.02 7.8-.07 1.2-.48 2.5-1.2 3.5-1.2 1.7-3.2 2.8-5.3 2.9-1.3.07-2.5-.28-3.6-.92-1.8-1-3.1-3-3.3-5.1-.02-.4-.03-.9-.01-1.3.16-1.7 1-3.3 2.3-4.4 1.5-1.3 3.6-1.9 5.5-1.5.02 1.3-.04 2.6-.04 4-.9-.28-1.9-.2-2.7.33-.7.5-1.2 1.4-1.1 2.3.04.8.5 1.5 1.2 1.9.7.4 1.7.38 2.4-.05.7-.4 1.1-1.1 1.2-1.9.04-3.2.02-6.4.02-9.6z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    type: 'facebook',
    color: '#1877F2',
    placeholder: 'Paste Facebook link...',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path fill="#FFFFFF" d="M15.5 12h-2.5v8h-3v-8h-2v-2.8h2v-1.8c0-2.3 1.4-3.6 3.5-3.6 1 0 1.9.08 2.1.1v2.5h-1.5c-1.1 0-1.4.5-1.4 1.3v1.5h2.8l-.5 2.8z"/>
      </svg>
    ),
  },
  {
    name: 'X / Twitter',
    type: 'x_twitter',
    color: '#FFFFFF',
    placeholder: 'Paste X (Twitter) link...',
    svg: (
      <img
        src="/x-logo.png"
        alt="X"
        width={20}
        height={20}
        style={{
          width: '20px',
          height: '20px',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    ),
  },
  {
    name: 'Pinterest',
    type: 'pinterest',
    color: '#E60023',
    placeholder: 'Paste Pinterest link...',
    svg: (
      <img
        src="/pinterest-logo.png"
        alt="Pinterest"
        width={22}
        height={22}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    ),
  },
  {
    name: 'Reddit',
    type: 'reddit',
    color: '#FF4500',
    placeholder: 'Paste Reddit link...',
    svg: (
      <img
        src="/reddit-logo.png"
        alt="Reddit"
        width={22}
        height={22}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    ),
  },
  {
    name: 'Threads',
    type: 'threads',
    color: '#FFFFFF',
    placeholder: 'Paste Threads link...',
    svg: (
      <img
        src="/threads-logo.png"
        alt="Threads"
        width={22}
        height={22}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    ),
  },
  {
    name: 'Direct Media',
    type: 'direct',
    color: '#10B981',
    placeholder: 'Paste direct media link (MP4, JPG)...',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#10B981" />
        <path fill="#FFFFFF" d="M12 16.5l4.5-4.5h-3V7.5h-3v4.5h-3l4.5 4.5zm-6 2h12v1.8H6v-1.8z"/>
      </svg>
    ),
  },
];

interface VideoResultItem {
  id: string;
  info: MediaInfo;
  downloadState: 'idle' | 'downloading' | 'completed' | 'failed';
  activeQuality?: string;
  progress: DownloadProgress | null;
}

const ROTATING_PLACEHOLDERS = [
  'Paste YouTube link here...',
  'Paste TikTok link here...',
  'Paste Instagram link here...',
  'Paste Pinterest link here...',
  'Paste Reddit link here...',
  'Paste Threads link here...',
  'Paste Facebook link here...',
  'Paste X (Twitter) link here...',
];

function formatDurationSeconds(sec?: number): string {
  if (!sec) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function decodeHtmlEntities(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

export function UrlInput() {
  const [inputValue, setInputValue] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformIcon | null>(null);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [results, setResults] = useState<VideoResultItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Batch Download State
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchDownloadIndex, setBatchDownloadIndex] = useState<number | null>(null);

  // Search Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-Rotating Placeholder Index for SlotText
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsContainerRef.current &&
        !suggestionsContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch YouTube autocomplete search suggestions with debounce
  useEffect(() => {
    if (!isSearchMode || !inputValue.trim() || inputValue.trim().startsWith('http')) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const list = await apiClient.getSearchSuggestions(inputValue.trim());
        if (list && list.length > 0) {
          setSuggestions(list);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 160);

    return () => clearTimeout(timer);
  }, [inputValue, isSearchMode]);

  // Auto-rotate placeholder index every 2.8 seconds (SlotText handles animation)
  useEffect(() => {
    if (inputValue || isSearchMode || selectedPlatform || isMultiMode) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [inputValue, isSearchMode, selectedPlatform, isMultiMode]);

  const activeSubscriptions = useRef<Map<string, { cancel: () => void }>>(new Map());
  const detectedUrls = inputValue.match(/(https?:\/\/[^\s]+)/g) || [];

  const handlePaste = async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      setInputValue((prev) => (prev ? `${prev}\n${clipboard}` : clipboard));
    } catch (err) {
      console.error('Clipboard error', err);
    }
  };

  const handleClearInput = () => {
    setInputValue('');
    setStatusMsg(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    handleExecuteSearch(suggestion);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleAnalyzeUrls = async (urlsToAnalyze: string[]) => {
    setAnalyzing(true);
    setSearchResults([]);
    setStatusMsg(`Analyzing ${urlsToAnalyze.length} link(s)...`);

    try {
      const res = await apiClient.analyzeUrls(urlsToAnalyze);
      const items: VideoResultItem[] = res.results.map((info, idx) => ({
        id: `video-${Date.now()}-${idx}`,
        info,
        downloadState: 'idle',
        progress: null,
      }));

      setResults(items);
      setStatusMsg('Ready to download');
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      const fallbackItems: VideoResultItem[] = urlsToAnalyze.map((url, idx) => ({
        id: `fallback-${Date.now()}-${idx}`,
        info: {
          url,
          platform: url.includes('youtu') ? 'youtube' : 'direct',
          title: url.includes('youtu') ? 'YouTube Media Video' : 'Media Video',
          media_type: 'video',
          download_supported: true,
          embed_supported: true,
          format_options: [
            { format_id: 'mp4_360p', ext: 'MP4', quality: '360P', file_size_formatted: '3.12 MB', media_category: 'video' as const },
            { format_id: 'mp4_480p', ext: 'MP4', quality: '480P', file_size_formatted: '5.18 MB', media_category: 'video' as const },
            { format_id: 'mp4_720p', ext: 'MP4', quality: '720P', file_size_formatted: '23.67 MB', media_category: 'video' as const },
            { format_id: 'mp4_1080p', ext: 'MP4', quality: '1080P', file_size_formatted: '39.07 MB', media_category: 'video' as const },
            { format_id: 'mp3_48kbps', ext: 'MP3', quality: '48KBPS', file_size_formatted: '353.33 KB', media_category: 'audio' as const },
            { format_id: 'mp3_128kbps', ext: 'MP3', quality: '128KBPS', file_size_formatted: '935.08 KB', media_category: 'audio' as const },
            { format_id: 'mp3_256kbps', ext: 'MP3', quality: '256KBPS', file_size_formatted: '953.17 KB', media_category: 'audio' as const },
          ],
        },
        downloadState: 'idle',
        progress: null,
      }));
      setResults(fallbackItems);
      setStatusMsg('Ready to download');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecuteSearch = async (queryText: string) => {
    setSearching(true);
    setResults([]);
    setStatusMsg(`Searching YouTube for "${queryText}"...`);

    try {
      const res = await apiClient.search(queryText, 'youtube', 1);
      setSearchResults(res.results || []);
      setStatusMsg(`Found ${res.results?.length || 0} search results`);
    } catch (err) {
      console.error('Search execution failed:', err);
      setSearchResults([]);
      setStatusMsg('Search failed. Try a direct video URL.');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (!inputValue.trim()) return;

    if (isSearchMode || (!inputValue.startsWith('http://') && !inputValue.startsWith('https://') && detectedUrls.length === 0)) {
      await handleExecuteSearch(inputValue.trim());
    } else {
      await handleAnalyzeUrls(detectedUrls);
    }
  };

  const handleSpecificDownload = useCallback(async (item: VideoResultItem, ext: string, quality: string) => {
    const isInstagram = item.info.platform === 'instagram' || item.info.url?.includes('instagram.com') || item.info.url?.includes('instagr.am');

    // If a direct media/stream URL was extracted (e.g. cdninstagram, fbcdn, v.redd.it, pinimg, or direct media extension), prefer it
    const isDirectStream = Boolean(
      item.info.download_url && (
        (item.info.muted && (item.info.download_url.includes('cdninstagram.com') || item.info.download_url.includes('fbcdn.net'))) ||
        (!isInstagram && (
          item.info.download_url.includes('v.redd.it') ||
          item.info.download_url.includes('pinimg.com') ||
          item.info.download_url.includes('lovethreads.net') ||
          /\.(mp4|webm|mp3|wav|m4a|ogg|flac|mov|jpg|jpeg|png|webp)(\?.*)?$/i.test(item.info.download_url)
        ))
      )
    );

    const targetUrl = (isDirectStream ? item.info.download_url : item.info.url) || item.info.download_url || item.info.url;

    if (!targetUrl) return;

    const fullFormat = `${ext} ${quality}`;

    setResults((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? { ...r, downloadState: 'downloading' as const, activeQuality: fullFormat, progress: null }
          : r
      )
    );

    try {
      const { job_id } = await apiClient.startDownload(targetUrl, ext.toLowerCase(), quality.toLowerCase());

      const subscription = apiClient.subscribeProgress(job_id, (progress) => {
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, progress } : r
          )
        );
      });

      activeSubscriptions.current.set(item.id, subscription);

      const finalProgress = await subscription.done;
      activeSubscriptions.current.delete(item.id);

      if (finalProgress.status === 'COMPLETED') {
        const cleanTitle = (item.info.title || 'mediaflow_download')
          .replace(/[^a-zA-Z0-9_\- ]/g, '')
          .trim()
          .replace(/\s+/g, '_')
          .slice(0, 60);

        let fileExt = ext.toLowerCase();
        if (fileExt === 'mp4' || fileExt === 'video' || quality.toLowerCase().includes('p')) {
          fileExt = 'mp4';
        } else if (fileExt === 'mp3' || fileExt === 'audio' || quality.toLowerCase().includes('kbps')) {
          fileExt = 'mp3';
        } else if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
          fileExt = 'mp4';
        }

        const filename = `${cleanTitle}_${quality.replace(/\s+/g, '_')}.${fileExt}`;
        const fileUrl = apiClient.getDownloadFileUrl(job_id, filename);

        // Reliable universal file download via Blob / triggerFileDownload
        await triggerFileDownload(fileUrl, filename);

        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, downloadState: 'completed' as const } : r
          )
        );
        const displayTitle = (item.info.title || 'media').trim();
        const shortTitle = displayTitle.length > 35 ? `${displayTitle.slice(0, 35)}...` : displayTitle;
        setStatusMsg(`Downloaded and saved: "${shortTitle}" (${quality})`);
        setTimeout(() => {
          setStatusMsg((current) => (current?.includes(shortTitle) ? null : current));
        }, 5000);
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, downloadState: 'failed' as const, progress: finalProgress } : r
          )
        );
        const errText = finalProgress.error || 'Download failed. Please retry.';
        setStatusMsg(errText.startsWith('Unfortunately') || errText.startsWith('Unable') || errText.startsWith('Access') || errText.startsWith('This media') ? errText : `Download failed: ${errText}`);
      }
    } catch (err) {
      console.error('Download error:', err);
      // Only fallback to direct file download if it is an actual media file URL (not a web page)
      const isDirectMedia = /\.(mp4|webm|mp3|wav|m4a|ogg|flac|mov)(\?.*)?$/i.test(targetUrl);
      if (isDirectMedia) {
        try {
          const cleanTitle = (item.info.title || 'mediaflow_download')
            .replace(/[^a-zA-Z0-9_\- ]/g, '')
            .trim()
            .replace(/\s+/g, '_');
          const filename = `${cleanTitle}_${quality}.${ext.toLowerCase()}`;
          await triggerFileDownload(targetUrl, filename);

          setResults((prev) =>
            prev.map((r) =>
              r.id === item.id ? { ...r, downloadState: 'completed' as const } : r
            )
          );
          const displayTitle = (item.info.title || 'media').trim();
          const shortTitle = displayTitle.length > 35 ? `${displayTitle.slice(0, 35)}...` : displayTitle;
          setStatusMsg(`Downloaded and saved: "${shortTitle}" (${quality})`);
          setTimeout(() => {
            setStatusMsg((current) => (current?.includes(shortTitle) ? null : current));
          }, 5000);
        } catch {
          setResults((prev) =>
            prev.map((r) =>
              r.id === item.id ? { ...r, downloadState: 'failed' as const } : r
            )
          );
          setStatusMsg('Download failed. Please check link and try again.');
        }
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, downloadState: 'failed' as const } : r
          )
        );
        setStatusMsg('Download error. Please retry or choose another format.');
      }
    }
  }, []);

  const getBestFormatForItem = useCallback((item: VideoResultItem) => {
    const formatOpts = item.info.format_options || [];
    const videoOpts = formatOpts.filter(
      (f) => f.media_category === 'video' || (!f.media_category && (f.ext.toLowerCase() === 'mp4' || f.quality.toLowerCase().includes('p')))
    );

    if (videoOpts.length > 0) {
      const sorted = [...videoOpts].sort((a, b) => {
        const getScore = (qStr: string) => {
          const q = (qStr || '').toLowerCase();
          if (q.includes('4k') || q.includes('2160')) return 2160;
          if (q.includes('2k') || q.includes('1440')) return 1440;
          if (q.includes('1080') || q.includes('full hd')) return 1080;
          if (q.includes('720') || q.includes('hd')) return 720;
          if (q.includes('480') || q.includes('sd')) return 480;
          if (q.includes('360')) return 360;
          if (q.includes('240')) return 240;
          if (q.includes('144')) return 144;
          const match = q.match(/(\d{3,4})/);
          if (match) return parseInt(match[1], 10);
          if (q.includes('best') || q.includes('original') || q.includes('max')) return 999;
          return 0;
        };
        return getScore(b.quality) - getScore(a.quality);
      });
      return { ext: sorted[0].ext || 'MP4', quality: sorted[0].quality || 'Best' };
    }

    const imageOpts = formatOpts.filter((f) => f.media_category === 'image');
    if (imageOpts.length > 0) {
      return { ext: imageOpts[0].ext || 'JPG', quality: imageOpts[0].quality || 'Original' };
    }

    return { ext: 'MP4', quality: 'Best' };
  }, []);

  const handleDownloadAllBestQuality = async () => {
    if (isBatchDownloading || results.length === 0) return;

    setIsBatchDownloading(true);
    const total = results.length;
    setStatusMsg(`Starting batch download: 1 of ${total}...`);

    for (let i = 0; i < total; i++) {
      const item = results[i];
      setBatchDownloadIndex(i);
      const { ext, quality } = getBestFormatForItem(item);

      const title = decodeHtmlEntities(item.info.title || `Media ${i + 1}`);
      setStatusMsg(`[${i + 1}/${total}] Downloading "${title}" in best quality (${quality})...`);

      try {
        // 1. Download the video and trigger the save prompt in the computer
        await handleSpecificDownload(item, ext, quality);
        setStatusMsg(`[${i + 1}/${total}] Saved "${title}". Moving to next video...`);

        // 2. Buffer pause so browser download manager registers and saves the file before next video starts
        if (i < total - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (e) {
        console.error(`Failed downloading item ${i + 1}:`, e);
      }
    }

    setBatchDownloadIndex(null);
    setIsBatchDownloading(false);
    setStatusMsg(`Finished downloading and saving all ${total} items!`);
  };

  const handleRemove = (id: string) => {
    const sub = activeSubscriptions.current.get(id);
    if (sub) {
      sub.cancel();
      activeSubscriptions.current.delete(id);
    }
    setResults((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length === 0) {
        setStatusMsg(null);
      }
      return next;
    });
  };

  const handleClearResults = () => {
    activeSubscriptions.current.forEach((sub) => sub.cancel());
    activeSubscriptions.current.clear();
    setResults([]);
    setStatusMsg(null);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setStatusMsg(null);
  };

  const handleSelectSearchResult = (url: string) => {
    setSearchResults([]);
    setStatusMsg(null);
    setInputValue(url);
    handleAnalyzeUrls([url]);
  };

  const handleCopyLink = useCallback(async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }, []);

  const overflowCount = PLATFORM_ICONS.length - 3;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      
      {/* 1. Smooth Rotating Loop Showcase of Pearl Buttons (Icon-Only, Clean) */}
      <div className="platform-marquee-container" title="Click any platform to select">
        <div className="platform-marquee-track">
          <div className="platform-marquee-group">
            {PLATFORM_ICONS.map((platform, idx) => {
              const isSelected = selectedPlatform?.type === platform.type;
              return (
                <button
                  key={`platform-pearl-1-${platform.type}-${idx}`}
                  type="button"
                  onClick={() => setSelectedPlatform(isSelected ? null : platform)}
                  className={`pearl-icon-btn ${isSelected ? 'selected' : ''}`}
                  title={`Filter ${platform.name}`}
                  aria-label={platform.name}
                >
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {platform.svg}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="platform-marquee-group" aria-hidden="true">
            {PLATFORM_ICONS.map((platform, idx) => {
              const isSelected = selectedPlatform?.type === platform.type;
              return (
                <button
                  key={`platform-pearl-2-${platform.type}-${idx}`}
                  type="button"
                  onClick={() => setSelectedPlatform(isSelected ? null : platform)}
                  className={`pearl-icon-btn ${isSelected ? 'selected' : ''}`}
                  tabIndex={-1}
                >
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {platform.svg}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Minimal Search & Paste Bar */}
      <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%' }}>
        {isMultiMode && !isSearchMode ? (
          /* Multi-URL Batch Textarea Container */
          <div
            className="input-bar-multi"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '22px',
              padding: '1.15rem 1.25rem 0.95rem 1.25rem',
              boxShadow: 'var(--nm-inset-md)',
              transition: 'border-radius 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <textarea
              rows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste multiple URLs (one per line)..."
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                fontSize: '0.98rem',
                lineHeight: 1.55,
                color: 'var(--text-color)',
                outline: 'none',
                resize: 'none',
                padding: '0.2rem 0',
                border: 'none',
                fontFamily: 'monospace',
                minHeight: '105px',
              }}
            />

            {/* Bottom Row Inside Multi Box: Helper Count + Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '0.75rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {inputValue.trim()
                  ? `${inputValue.trim().split('\n').filter(Boolean).length} URL(s) detected`
                  : 'Batch Download Mode'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {inputValue.trim() ? (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    title="Clear links"
                    className="pill-btn input-action-btn"
                    style={{
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      minHeight: '34px',
                      color: 'var(--text-color)',
                    }}
                  >
                    Clear All
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    title="Paste from clipboard"
                    className="pill-btn input-action-btn"
                    style={{
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      minHeight: '34px',
                    }}
                  >
                    Paste
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsMultiMode(false)}
                  title="Switch to single URL mode"
                  className="pill-btn input-action-btn"
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    minHeight: '34px',
                    color: 'var(--text-color)',
                  }}
                >
                  Single
                </button>

                <button
                  type="submit"
                  disabled={analyzing || searching || !inputValue.trim()}
                  aria-label="Process links"
                  className="pill-btn-black"
                  style={{
                    height: '36px',
                    minHeight: '36px',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 1.15rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: analyzing || searching ? 'wait' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {analyzing ? (
                    <>
                      <div className="spinner" style={{ color: '#ffffff' }}>
                        <div /><div /><div /><div /><div />
                        <div /><div /><div /><div /><div />
                      </div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Process</span>
                      <span style={{ fontSize: '0.95rem' }}>➔</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Single URL Input Pill Container */
          <div
            className="input-bar-inner"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: 'var(--radius-full)',
              padding: '0.6rem 0.75rem 0.6rem 1.85rem',
              boxShadow: 'var(--nm-inset-md)',
              transition: 'border-radius 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, textAlign: 'left' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onFocus={() => {
                  setIsInputFocused(true);
                  if (isSearchMode && suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setIsInputFocused(false)}
                placeholder={isSearchMode ? 'Type keywords (e.g. lofi hip hop, podcast)...' : (selectedPlatform ? selectedPlatform.placeholder : '')}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                  outline: 'none',
                  padding: '0.75rem 0',
                  position: 'relative',
                  zIndex: 2,
                  textAlign: 'left',
                }}
              />

              {/* Auto-Rotating Placeholder Powered Purely by SlotText */}
              {!inputValue && !isSearchMode && !selectedPlatform && !isMultiMode && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    zIndex: 1,
                    width: '100%',
                    color: 'var(--text-muted)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'left',
                    opacity: isInputFocused ? 0.35 : 1,
                  }}
                >
                  <span
                    key={placeholderIndex}
                    style={{
                      display: 'inline-block',
                      animation: 'textFadeIn 0.35s ease-out',
                    }}
                  >
                    {ROTATING_PLACEHOLDERS[placeholderIndex]}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.35rem' }}>
              {!analyzing && !searching && (
                inputValue.trim() ? (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    title="Clear link"
                    className="pill-btn input-action-btn"
                    style={{
                      padding: '0.45rem 0.95rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      minHeight: '38px',
                      color: 'var(--text-color)',
                    }}
                  >
                    Clear
                  </button>
                ) : (
                  !isSearchMode && (
                    <button
                      type="button"
                      onClick={handlePaste}
                      title="Paste from clipboard"
                      className="pill-btn input-action-btn"
                      style={{
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        minHeight: '38px',
                      }}
                    >
                      Paste
                    </button>
                  )
                )
              )}

              {!isSearchMode && !analyzing && !searching && (
                <button
                  type="button"
                  onClick={() => setIsMultiMode(!isMultiMode)}
                  title={isMultiMode ? "Switch to single URL mode" : "Switch to multi-URL batch mode"}
                  className="pill-btn input-action-btn"
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    minHeight: '38px',
                    color: 'var(--text-color)',
                  }}
                >
                  {isMultiMode ? 'Single' : 'Multi'}
                </button>
              )}

              <button
                type="submit"
                disabled={analyzing || searching}
                aria-label="Process link or search"
                className="pill-btn-black submit-action-btn"
                style={{
                  height: '44px',
                  minHeight: '44px',
                  width: analyzing || searching ? 'auto' : '44px',
                  minWidth: analyzing || searching ? '170px' : '44px',
                  borderRadius: 'var(--radius-full)',
                  padding: analyzing || searching ? '0 1.25rem' : '0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  fontSize: analyzing || searching ? '0.85rem' : '1.15rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  cursor: analyzing || searching ? 'wait' : 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                {analyzing || searching ? (
                  <>
                    <div className="spinner" style={{ color: '#ffffff' }}>
                      <div /><div /><div /><div /><div />
                      <div /><div /><div /><div /><div />
                    </div>
                    <span className="submit-btn-text">{isSearchMode ? 'Searching...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <span>➔</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live YouTube Autocomplete Suggestions Dropdown */}
        {isSearchMode && showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsContainerRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.75)',
              borderRadius: '20px',
              boxShadow: '10px 10px 30px var(--neumorph-dark), -10px -10px 30px var(--neumorph-light)',
              zIndex: 100,
              overflow: 'hidden',
              padding: '0.4rem 0',
              animation: 'textFadeIn 0.2s ease-out',
            }}
          >
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedSuggestionIndex;
              return (
                <div
                  key={`sug-${idx}`}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 1.4rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
                    color: 'var(--text-color)',
                    fontSize: '0.96rem',
                    fontWeight: 600,
                    transition: 'background-color 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', overflow: 'hidden' }}>
                    <Search className="w-4 h-4 text-muted flex-shrink-0" style={{ opacity: 0.55 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item}
                    </span>
                  </div>
                  <ArrowUpLeft className="w-3.5 h-3.5 text-muted flex-shrink-0" style={{ opacity: 0.45 }} />
                </div>
              );
            })}
          </div>
        )}
      </form>

      {/* Mode Switcher Pills (Paste Link vs Search Video) */}
      <div
        className="mode-switcher-row"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.85rem',
          marginTop: '1.75rem',
          marginBottom: '1rem',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsSearchMode(false);
            setIsMultiMode(false);
            setStatusMsg(null);
          }}
          className={!isSearchMode ? "pill-btn-black" : "pill-btn"}
          style={{
            padding: '0.55rem 1.45rem',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Paste Link
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSearchMode(true);
            setIsMultiMode(false);
            setStatusMsg(null);
          }}
          className={isSearchMode ? "pill-btn-black" : "pill-btn"}
          style={{
            padding: '0.55rem 1.45rem',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Search className="w-4 h-4" /> Search Video
        </button>
      </div>

      {/* Initial Input Error Message (when no cards are displayed yet) */}
      {statusMsg && !analyzing && !searching && results.length === 0 && searchResults.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.15rem', marginBottom: '0.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.75)',
              boxShadow: '4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-color)',
              letterSpacing: '-0.01em',
            }}
          >
            {statusMsg.toLowerCase().includes('failed') || statusMsg.toLowerCase().includes('error') ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#22c55e25', color: '#16a34a' }}>
                <Check className="w-3 h-3 text-emerald-600" />
              </span>
            )}
            <span>{statusMsg}</span>
          </div>
        </div>
      )}

      {/* 3. LIVE SEARCH RESULTS GRID */}
      {searchResults.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', height: '36px', padding: '0 1rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)' }}>
              LIVE SEARCH RESULTS ({searchResults.length})
            </div>
            <button
              type="button"
              className="pill-btn"
              style={{
                height: '36px',
                padding: '0 1rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#ef4444',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
              onClick={handleClearSearch}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Clear Search</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {searchResults.map((res) => (
              <Card
                key={`search-res-${res.id}`}
                className="card-editorial"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '1.15rem',
                  padding: '1.15rem',
                  alignItems: 'stretch',
                  borderRadius: '22px',
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid rgba(255, 255, 255, 0.65)',
                  boxShadow: '6px 6px 16px var(--neumorph-dark), -6px -6px 16px var(--neumorph-light)',
                  overflow: 'hidden',
                }}
              >
                {/* Thumbnail Box */}
                <div style={{ position: 'relative', width: '135px', minHeight: '85px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, boxShadow: '2px 2px 6px var(--neumorph-dark)' }}>
                  <img
                    src={res.thumbnail_url}
                    alt={decodeHtmlEntities(res.title)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    className="tabular-nums"
                    style={{
                      position: 'absolute',
                      bottom: '5px',
                      right: '5px',
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {formatDurationSeconds(res.duration)}
                  </div>
                </div>

                {/* Video Info & Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
                  <div>
                    <h4
                      className="text-balance"
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        lineHeight: 1.35,
                        color: 'var(--text-color)',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={decodeHtmlEntities(res.title)}
                    >
                      {decodeHtmlEntities(res.title)}
                    </h4>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
                      {res.channel}
                    </div>
                  </div>

                  {/* Button Actions Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill-btn"
                      style={{
                        color: '#16a34a',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '0.35rem 0.75rem',
                        minHeight: '32px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                      onClick={() => handleSelectSearchResult(res.url)}
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      className="pill-btn"
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.7rem',
                        minHeight: '32px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                      onClick={() => handleCopyLink(res.id, res.url)}
                    >
                      {copiedId === res.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 4. RICH 2-COLUMN FORMAT RESOLUTION TABLE RESULT CARD */}
      {results.length > 0 && (
        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', height: '36px', padding: '0 1rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)' }}>
                {isMultiMode ? `BATCH DOWNLOAD (${results.length})` : `PROCESSED MEDIA (${results.length})`}
              </div>

              {/* Download All (Best Quality) Sequential Download Button (White Neumorphic Style - Only shown for multi download) */}
              {results.length > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadAllBestQuality}
                  disabled={isBatchDownloading}
                  className="pill-btn"
                  style={{
                    height: '36px',
                    padding: '0 1.15rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--text-color)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: isBatchDownloading ? 'wait' : 'pointer',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(255, 255, 255, 0.75)',
                    backgroundColor: 'var(--bg-color)',
                    boxShadow: '3px 3px 8px var(--neumorph-dark), -3px -3px 8px var(--neumorph-light)',
                  }}
                >
                  {isBatchDownloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>
                        Downloading {batchDownloadIndex !== null ? `${batchDownloadIndex + 1}/${results.length}` : '...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download All (Best Quality)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              className="pill-btn"
              style={{
                height: '36px',
                padding: '0 1.15rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#ef4444',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-color)',
                boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)',
              }}
              onClick={handleClearResults}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Clear All</span>
            </button>
          </div>

          {results.map((item) => {
            const formatOpts = item.info.format_options || [];
            const isExplicitDirectImage = Boolean(
              item.info.url && (
                item.info.url.includes('i.redd.it') ||
                item.info.url.includes('preview.redd.it') ||
                item.info.url.includes('pinimg.com') ||
                item.info.url.includes('twimg.com') ||
                /\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i.test(item.info.url)
              )
            );

            const isImageMedia = item.info.media_type === 'image' || isExplicitDirectImage;

            const imageFormats = formatOpts.filter((f) => f.media_category === 'image');
            const videoFormats = formatOpts.filter((f) => f.media_category === 'video');
            const audioFormats = formatOpts.filter((f) => f.media_category === 'audio');

            const defaultImage = imageFormats.length > 0 ? imageFormats : [
              { format_id: 'jpg_original', ext: 'JPG', quality: 'Original High-Res', file_size_formatted: 'Master Quality', media_category: 'image' as const },
              { format_id: 'png_hd', ext: 'PNG', quality: 'Ultra-HD Lossless', file_size_formatted: 'Lossless', media_category: 'image' as const },
              { format_id: 'webp_hd', ext: 'WEBP', quality: 'Web-Optimized', file_size_formatted: 'Fast', media_category: 'image' as const },
            ];

            const defaultVideo = videoFormats.length > 0 ? videoFormats : [
              { format_id: 'mp4_720p', ext: 'MP4', quality: '720p', file_size_formatted: 'HD', media_category: 'video' as const },
              { format_id: 'mp4_480p', ext: 'MP4', quality: '480p', file_size_formatted: 'SD', media_category: 'video' as const },
              { format_id: 'mp4_360p', ext: 'MP4', quality: '360p', file_size_formatted: 'Fast', media_category: 'video' as const },
            ];

            const defaultAudio = audioFormats.length > 0 ? audioFormats : [
              { format_id: 'mp3_320kbps', ext: 'MP3', quality: '320KBPS', file_size_formatted: 'High Quality', media_category: 'audio' as const },
              { format_id: 'mp3_128kbps', ext: 'MP3', quality: '128KBPS', file_size_formatted: 'Standard', media_category: 'audio' as const },
            ];

            return (
              <div
                key={item.id}
                className="nm-result-card"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid rgba(255, 255, 255, 0.65)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  padding: '1.75rem',
                  boxShadow: '8px 8px 20px var(--neumorph-dark), -8px -8px 20px var(--neumorph-light)',
                }}
              >
                <div className="nm-result-grid">
                  {/* LEFT COLUMN: Media Preview + Title + Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'inset 2px 2px 6px var(--neumorph-dark), inset -2px -2px 6px var(--neumorph-light)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                      <MediaPreview
                        url={item.info.url}
                        thumbnailUrl={item.info.thumbnail_url}
                        title={decodeHtmlEntities(item.info.title)}
                        platform={item.info.platform}
                        mediaType={item.info.media_type}
                      />
                    </div>

                    <h3 className="text-balance" style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.35, color: 'var(--text-color)', margin: '0.15rem 0' }}>
                      {decodeHtmlEntities(item.info.title) || item.info.url}
                    </h3>

                    {item.info.duration ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <div
                          className="tabular-nums"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            height: '34px',
                            padding: '0 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--bg-color)',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                            boxShadow: '2px 2px 5px var(--neumorph-dark), -2px -2px 5px var(--neumorph-light)',
                            color: '#16a34a',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                          }}
                        >
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{formatDurationSeconds(item.info.duration || 59)}</span>
                        </div>
                      </div>
                    ) : null}

                    {item.info.muted && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          marginTop: '0.35rem',
                        }}
                      >
                        <VolumeX className="w-3.5 h-3.5 text-red-500" />
                        <span>Audio unavailable (no-login preview)</span>
                      </div>
                    )}

                    {/* Active Download Progress inside Card */}
                    {item.downloadState === 'downloading' && item.progress && (
                      <div style={{ marginTop: '0.85rem', width: '100%' }}>
                        <div className="nm-progress-track">
                          <div
                            className="nm-progress-fill"
                            style={{
                              width: `${Math.max(item.progress.percent, 3)}%`,
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.55rem' }}>
                          <TextShimmerWave
                            className="text-xs font-extrabold"
                            duration={1.2}
                            spread={1}
                            style={{
                              // @ts-expect-error CSS variable
                              '--base-color': 'var(--text-color)',
                              '--base-gradient-color': 'var(--color-accent-500)',
                            }}
                          >
                            {item.progress.status === 'CONVERTING'
                              ? 'Processing file...'
                              : `Downloading (${item.activeQuality || 'Media'})...`}
                          </TextShimmerWave>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            {item.progress.speed && (
                              <span className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                ⚡ {item.progress.speed}
                              </span>
                            )}
                            <div
                              className="tabular-nums"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--bg-color)',
                                border: '1px solid rgba(255, 255, 255, 0.7)',
                                boxShadow: '2px 2px 4px var(--neumorph-dark), -2px -2px 4px var(--neumorph-light)',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                color: 'var(--color-accent-500)',
                              }}
                            >
                              {item.progress.percent.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: FORMAT RESOLUTION TABLES */}
                  <div style={{ width: '100%', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                      
                      {/* SUB-COLUMN 1: IMAGE OR VIDEO OPTIONS */}
                      {isImageMedia ? (
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '2px 2px 4px var(--neumorph-dark), -2px -2px 4px var(--neumorph-light)' }}>
                              <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <span>High-Resolution Image Formats</span>
                          </div>

                          <div
                            style={{
                              border: '1px solid rgba(255, 255, 255, 0.5)',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              backgroundColor: 'var(--bg-color)',
                              boxShadow: 'inset 2px 2px 5px var(--neumorph-dark), inset -2px -2px 5px var(--neumorph-light)',
                            }}
                          >
                            {defaultImage.map((opt, idx) => (
                              <div
                                key={opt.format_id}
                                className="nm-format-row"
                                style={{
                                  borderBottom: idx === defaultImage.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                                }}
                              >
                                <div className="nm-format-info">
                                  <span className="nm-format-badge">
                                    {opt.ext}
                                  </span>

                                  <span className="nm-format-quality">
                                    {opt.quality}
                                  </span>

                                  {opt.file_size_formatted && (
                                    <span className="nm-format-size tabular-nums">
                                      {opt.file_size_formatted}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="pill-btn nm-format-btn"
                                  onClick={() => handleSpecificDownload(item, opt.ext, opt.quality)}
                                  disabled={item.downloadState === 'downloading'}
                                >
                                  {item.downloadState === 'downloading' && item.activeQuality === `${opt.ext} ${opt.quality}` ? (
                                    <>
                                      <div className="uiverse-spinner spinner-emerald" style={{ color: '#16a34a', marginRight: '3px' }}>
                                        <div /><div /><div /><div /><div /><div /><div /><div /><div /><div />
                                      </div>
                                      <span>Downloading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-3.5 h-3.5" /> <span>Download Image</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '2px 2px 4px var(--neumorph-dark), -2px -2px 4px var(--neumorph-light)' }}>
                                <Video className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <span>Video Formats</span>
                            </div>

                            <div
                              style={{
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                backgroundColor: 'var(--bg-color)',
                                boxShadow: 'inset 2px 2px 5px var(--neumorph-dark), inset -2px -2px 5px var(--neumorph-light)',
                              }}
                            >
                              {defaultVideo.map((opt, idx) => (
                                <div
                                  key={opt.format_id}
                                  className="nm-format-row"
                                  style={{
                                    borderBottom: idx === defaultVideo.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                                  }}
                                >
                                  <div className="nm-format-info">
                                    <span className="nm-format-badge">
                                      {opt.ext}
                                    </span>

                                    <span className="nm-format-quality">
                                      {opt.quality}
                                    </span>

                                    {opt.file_size_formatted && (
                                      <span className="nm-format-size tabular-nums">
                                        {opt.file_size_formatted}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="pill-btn nm-format-btn"
                                    onClick={() => handleSpecificDownload(item, opt.ext, opt.quality)}
                                    disabled={item.downloadState === 'downloading'}
                                  >
                                    {item.downloadState === 'downloading' && item.activeQuality === `${opt.ext} ${opt.quality}` ? (
                                      <>
                                        <div className="uiverse-spinner spinner-emerald" style={{ color: '#16a34a', marginRight: '3px' }}>
                                          <div /><div /><div /><div /><div /><div /><div /><div /><div /><div />
                                        </div>
                                        <span>Downloading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-3.5 h-3.5" /> <span>Download</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* SUB-COLUMN 2: MUSIC / AUDIO OPTIONS */}
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '2px 2px 4px var(--neumorph-dark), -2px -2px 4px var(--neumorph-light)' }}>
                                <Music className="w-3.5 h-3.5 text-amber-600" />
                              </div>
                              <span>Audio / MP3</span>
                            </div>

                            <div
                              style={{
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                backgroundColor: 'var(--bg-color)',
                                boxShadow: 'inset 2px 2px 5px var(--neumorph-dark), inset -2px -2px 5px var(--neumorph-light)',
                              }}
                            >
                              {defaultAudio.map((opt, idx) => (
                                <div
                                  key={opt.format_id}
                                  className="nm-format-row"
                                  style={{
                                    borderBottom: idx === defaultAudio.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                                  }}
                                >
                                  <div className="nm-format-info">
                                    <span className="nm-format-badge">
                                      {opt.ext}
                                    </span>

                                    <span className="nm-format-quality">
                                      {opt.quality}
                                    </span>

                                    {opt.file_size_formatted && (
                                      <span className="nm-format-size tabular-nums">
                                        {opt.file_size_formatted}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="pill-btn nm-format-btn"
                                    style={{
                                      color: '#16a34a',
                                      fontWeight: 800,
                                      fontSize: '0.78rem',
                                      padding: '0.35rem 0.85rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      minHeight: '32px',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                    onClick={() => handleSpecificDownload(item, opt.ext, opt.quality)}
                                    disabled={item.downloadState === 'downloading'}
                                  >
                                    {item.downloadState === 'downloading' && item.activeQuality === `${opt.ext} ${opt.quality}` ? (
                                      <>
                                        <div className="uiverse-spinner spinner-emerald" style={{ color: '#16a34a', marginRight: '3px' }}>
                                          <div /><div /><div /><div /><div /><div /><div /><div /><div /><div />
                                        </div>
                                        <span>Downloading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-3.5 h-3.5" /> <span>Download</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                    </div>

                    {/* Clean Inline Notification Bar */}
                    {statusMsg && (
                      <div style={{ marginTop: '1.25rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.65rem',
                            padding: '0.55rem 1rem',
                            borderRadius: '14px',
                            backgroundColor: 'var(--bg-color)',
                            border: '1px solid rgba(255, 255, 255, 0.75)',
                            boxShadow: 'inset 2px 2px 5px var(--neumorph-dark), inset -2px -2px 5px var(--neumorph-light)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--text-color)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            {statusMsg.toLowerCase().includes('failed') || statusMsg.toLowerCase().includes('error') ? (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#22c55e25', color: '#16a34a', flexShrink: 0 }}>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              </span>
                            )}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                              {statusMsg}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setStatusMsg(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
