"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient, MediaInfo, SlideItem, FormatOption, DownloadProgress, SearchResult } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MediaPreview } from './media-preview';
import { MediaPlayerCard } from './media-player-card';
import { triggerFileDownload } from '@/lib/utils';
import { Video, Music, Download, Clock, Search, Loader2, Copy, Check, Plus, Play, AlertCircle, Image as ImageIcon, Trash2, ArrowUpLeft, X, VolumeX, Clipboard, Layers, Archive } from 'lucide-react';
import { TextShimmerWave } from '@/components/core/text-shimmer-wave';
import { motion, AnimatePresence } from 'motion/react';

import {
  detectPlatform,
  getSocialPlatform,
  isSocialMediaUrl,
  validateSocialMediaInput,
  extractAndValidateSocialUrls,
} from '@/lib/url-parser';
import { useMediaQuery } from '@/hooks/use-media-query';

interface PlatformIcon {
  name: string;
  type: string;
  color: string;
  placeholder: string;
  svg: React.ReactNode;
}

const PLATFORM_ICONS: PlatformIcon[] = [
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
    color: '#000000',
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
    name: 'X (Twitter)',
    type: 'x_twitter',
    color: '#000000',
    placeholder: 'Paste X (Twitter) link...',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-color)', display: 'block' }}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    type: 'youtube',
    color: '#FF0000',
    placeholder: 'Paste YouTube link...',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          fill="#FF0000"
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
        />
        <path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export function getSocialMediaPlatform(url: string): PlatformIcon | null {
  if (!url || typeof url !== 'string') return null;
  const platformName = getSocialPlatform(url);
  if (!platformName) return null;

  switch (platformName) {
    case 'Instagram':
      return PLATFORM_ICONS.find((p) => p.type === 'instagram') || null;
    case 'TikTok':
      return PLATFORM_ICONS.find((p) => p.type === 'tiktok') || null;
    case 'YouTube':
      return PLATFORM_ICONS.find((p) => p.type === 'youtube') || null;
    case 'Pinterest':
      return PLATFORM_ICONS.find((p) => p.type === 'pinterest') || null;
    case 'Reddit':
      return PLATFORM_ICONS.find((p) => p.type === 'reddit') || null;
    case 'Threads':
      return PLATFORM_ICONS.find((p) => p.type === 'threads') || null;
    case 'Facebook':
      return PLATFORM_ICONS.find((p) => p.type === 'facebook') || null;
    case 'X / Twitter':
      return PLATFORM_ICONS.find((p) => p.type === 'x_twitter') || null;
    default:
      return null;
  }
}

export { isSocialMediaUrl };

export function getCleanSocialDisplayLabel(url: string): string | null {
  const platform = getSocialMediaPlatform(url);
  if (!platform) return null;
  return `${platform.name} Link`;
}

export interface RecentDownloadItem {
  id: string;
  title: string;
  url: string;
  platform: string;
  thumbnail_url?: string;
  media_type?: string;
  format?: string;
  quality?: string;
  timestamp: number;
}

const RECENT_DOWNLOADS_KEY = 'avero_recent_downloads';
const MAX_RECENT_DOWNLOADS = 25;

export function getRecentDownloadsFromStorage(): RecentDownloadItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_DOWNLOADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentDownloadToStorage(item: Omit<RecentDownloadItem, 'id' | 'timestamp'>): RecentDownloadItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getRecentDownloadsFromStorage();
    // Keep different qualities/formats or posts; only replace exact duplicate (same url + same quality + same format)
    const filtered = current.filter(
      (x) =>
        !(
          x.url === item.url &&
          (x.quality || '') === (item.quality || '') &&
          (x.format || '') === (item.format || '')
        )
    );
    const newItem: RecentDownloadItem = {
      ...item,
      id: `recent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_DOWNLOADS);
    localStorage.setItem(RECENT_DOWNLOADS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save recent download to storage:', err);
    return [];
  }
}

export function removeRecentDownloadFromStorage(id: string): RecentDownloadItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getRecentDownloadsFromStorage();
    const updated = current.filter((x) => x.id !== id);
    localStorage.setItem(RECENT_DOWNLOADS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearRecentDownloadsFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_DOWNLOADS_KEY);
  } catch {}
}

interface VideoResultItem {
  id: string;
  info: MediaInfo;
  downloadState: 'idle' | 'downloading' | 'completed' | 'failed';
  activeQuality?: string;
  progress: DownloadProgress | null;
}

const ROTATING_PLACEHOLDERS = [
  'Paste TikTok link...',
  'Paste Instagram link...',
  'Paste Pinterest link...',
  'Paste Reddit link...',
  'Paste Threads link...',
  'Paste Facebook link...',
  'Paste X (Twitter) link...',
  'Paste YouTube link...',
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

function ButtonSpinner({ className = 'spinner-mono', size = 'normal' }: { className?: string; size?: 'sm' | 'normal' }) {
  return (
    <div
      className={`uiverse-spinner ${className} ${size === 'sm' ? 'uiverse-spinner-sm' : ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <div /><div /><div /><div /><div /><div /><div /><div /><div /><div />
    </div>
  );
}

export function UrlInput() {
  const [inputValue, setInputValue] = useState('');
  const [displayValue, setDisplayValue] = useState('');
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
  const [activeMediaTabs, setActiveMediaTabs] = useState<Record<string, 'video' | 'audio'>>({});

  // Recent Downloads State (persisted via localStorage)
  const [recentDownloads, setRecentDownloads] = useState<RecentDownloadItem[]>([]);

  useEffect(() => {
    setRecentDownloads(getRecentDownloadsFromStorage());
  }, []);

  // Batch Download State
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchDownloadIndex, setBatchDownloadIndex] = useState<number | null>(null);

  // Screen width detector for exact responsive button widths
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Clipboard Auto-Detection Prompt State
  const [clipboardPrompt, setClipboardPrompt] = useState<{ url: string; platformName: string } | null>(null);
  const lastDetectedClipboardUrl = useRef<string>('');
  const clipboardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const detectionDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-Rotating Placeholder Index for SlotText
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Live Detected Social Media Platform Icon (Favicon detector)
  const detectedPlatformIcon = isSearchMode ? null : getSocialMediaPlatform(inputValue.trim().split('\n')[0]);
  const detectedSocialIconsInMulti = isMultiMode
    ? (Array.from(
        new Map(
          inputValue
            .split('\n')
            .map((u) => {
              const p = getSocialMediaPlatform(u);
              return p ? [p.type, p] : null;
            })
            .filter(Boolean) as [string, PlatformIcon][]
        ).values()
      ) as PlatformIcon[])
    : [];

  // Clipboard Auto-Detection Function (extracts URLs and checks validity)
  const handleCheckClipboard = useCallback(async (immediate: boolean = false) => {
    if (analyzing || searching || isBatchDownloading || isSearchMode) return;

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return;

      if (navigator.permissions?.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
          if (perm.state === 'denied') return;
        } catch {
          // Permissions query not supported for clipboard-read in some browsers
        }
      }

      const raw = await navigator.clipboard.readText();
      const text = (raw || '').trim();
      if (!text) return;

      // Extract any URL present in the copied string
      const urlMatch = text.match(/https?:\/\/[^\s<>"']+/i);
      const candidateUrl = urlMatch ? urlMatch[0] : (text.startsWith('http') ? text : '');

      if (candidateUrl && isSocialMediaUrl(candidateUrl)) {
        if (candidateUrl === lastDetectedClipboardUrl.current || inputValue.includes(candidateUrl)) {
          return;
        }

        const platform = getSocialMediaPlatform(candidateUrl);
        const platformName = platform?.name || 'Social';

        // 350ms delay on window focus so user sees "Paste" first, then watches it smoothly expand & slide left
        const delay = immediate ? 0 : 350;

        if (detectionDelayTimerRef.current) {
          clearTimeout(detectionDelayTimerRef.current);
        }

        detectionDelayTimerRef.current = setTimeout(() => {
          setClipboardPrompt({ url: candidateUrl, platformName });

          if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
          clipboardTimerRef.current = setTimeout(() => {
            setClipboardPrompt(null);
          }, 8000);
        }, delay);
      }
    } catch {
      // Silently ignore permissions or background restrictions
    }
  }, [analyzing, searching, isBatchDownloading, isSearchMode, inputValue]);

  // Trigger clipboard auto-detection on focus, visibility change, and pointer entry
  useEffect(() => {
    const onFocus = () => handleCheckClipboard(false);
    const onBlur = () => {
      // Reset so returning from another tab with a copied link detects freshly
      lastDetectedClipboardUrl.current = '';
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleCheckClipboard(false);
      } else {
        lastDetectedClipboardUrl.current = '';
      }
    };
    const onPointer = () => handleCheckClipboard(false);

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointerenter', onPointer, { passive: true });

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointerenter', onPointer);
      if (detectionDelayTimerRef.current) clearTimeout(detectionDelayTimerRef.current);
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    };
  }, [handleCheckClipboard]);

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

  // Auto-dismiss status, warning, and error messages after 5 seconds
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!statusMsg) return;

    // Do NOT auto-dismiss ongoing operational messages while actively running
    const isOngoingAction =
      analyzing ||
      searching ||
      isBatchDownloading ||
      statusMsg.startsWith('Analyzing') ||
      statusMsg.startsWith('Searching') ||
      statusMsg.startsWith('Starting batch download') ||
      statusMsg.includes('Downloading "');

    if (isOngoingAction) {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
      return;
    }

    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }

    statusTimerRef.current = setTimeout(() => {
      setStatusMsg(null);
    }, 5000);

    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, [statusMsg, analyzing, searching, isBatchDownloading]);

  const activeSubscriptions = useRef<Map<string, { cancel: () => void }>>(new Map());
  const detectedUrls = inputValue.match(/(https?:\/\/[^\s]+)/g) || (inputValue.startsWith('http') ? [inputValue] : []);

  const handlePaste = async () => {
    try {
      if (clipboardPrompt?.url) {
        handleAcceptClipboardPrompt();
        return;
      }

      if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return;
      const raw = await navigator.clipboard.readText();
      const clipboard = (raw || '').trim();
      if (!clipboard) return;

      if (isSearchMode) {
        setInputValue(clipboard);
        setDisplayValue(clipboard);
        return;
      }

      if (isMultiMode) {
        const result = extractAndValidateSocialUrls(clipboard);
        if (result.hasHarmful) {
          setStatusMsg(result.harmfulReason || 'Harmful or unsafe link blocked.');
          return;
        }
        if (result.validUrls.length === 0) {
          setStatusMsg(
            result.skippedCount > 0
              ? 'Only social media links (Instagram, TikTok, YouTube, X, Reddit, Threads, Pinterest, Facebook) are supported.'
              : 'Text detected. Only social media links can be pasted in this bar.'
          );
          return;
        }
        setInputValue((prev) => (prev ? `${prev}\n${result.validUrls.join('\n')}` : result.validUrls.join('\n')));
        setDisplayValue('');
        if (result.skippedCount > 0) {
          setStatusMsg(`Added ${result.validUrls.length} social link(s). Skipped ${result.skippedCount} non-social or invalid item(s).`);
        } else if (statusMsg && !analyzing && !searching) {
          setStatusMsg(null);
        }
        return;
      }

      // Single link mode:
      const validation = validateSocialMediaInput(clipboard);
      if (!validation.isValid) {
        setStatusMsg(validation.errorMessage || 'Only social media links are supported.');
        return;
      }

      const targetUrl = validation.cleanUrl || clipboard;
      setInputValue(targetUrl);
      const label = getCleanSocialDisplayLabel(targetUrl);
      setDisplayValue(label || targetUrl);
      if (statusMsg && !analyzing && !searching) setStatusMsg(null);
    } catch (err) {
      console.error('Clipboard error', err);
    }
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (isSearchMode) return;
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    if (!pastedText) return;

    const validation = validateSocialMediaInput(pastedText);
    if (!validation.isValid) {
      setStatusMsg(validation.errorMessage || 'Only social media links are supported.');
      return;
    }

    const targetUrl = validation.cleanUrl || pastedText;
    setInputValue(targetUrl);
    const label = getCleanSocialDisplayLabel(targetUrl);
    setDisplayValue(label || targetUrl);
    if (statusMsg && !analyzing && !searching) setStatusMsg(null);
  };

  const handleInputDrop = (e: React.DragEvent<HTMLInputElement>) => {
    if (isSearchMode) return;
    e.preventDefault();
    const droppedText = e.dataTransfer.getData('text').trim();
    if (!droppedText) return;

    const validation = validateSocialMediaInput(droppedText);
    if (!validation.isValid) {
      setStatusMsg(validation.errorMessage || 'Only social media links are supported.');
      return;
    }

    const targetUrl = validation.cleanUrl || droppedText;
    setInputValue(targetUrl);
    const label = getCleanSocialDisplayLabel(targetUrl);
    setDisplayValue(label || targetUrl);
    if (statusMsg && !analyzing && !searching) setStatusMsg(null);
  };

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    if (!pastedText) return;

    const result = extractAndValidateSocialUrls(pastedText);
    if (result.hasHarmful) {
      setStatusMsg(result.harmfulReason || 'Harmful or unsafe link blocked. Only valid social media links are allowed.');
      return;
    }
    if (result.validUrls.length === 0) {
      setStatusMsg(
        result.skippedCount > 0
          ? 'Only social media links (Instagram, TikTok, YouTube, X, Reddit, Threads, Pinterest, Facebook) are supported.'
          : 'Text detected. Only social media links can be pasted in this bar.'
      );
      return;
    }

    setInputValue((prev) => (prev ? `${prev}\n${result.validUrls.join('\n')}` : result.validUrls.join('\n')));
    if (result.skippedCount > 0) {
      setStatusMsg(`Added ${result.validUrls.length} social link(s). Skipped ${result.skippedCount} non-social or invalid item(s).`);
    } else if (statusMsg && !analyzing && !searching) {
      setStatusMsg(null);
    }
  };

  const handleTextareaDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const droppedText = e.dataTransfer.getData('text').trim();
    if (!droppedText) return;

    const result = extractAndValidateSocialUrls(droppedText);
    if (result.hasHarmful) {
      setStatusMsg(result.harmfulReason || 'Harmful or unsafe link blocked.');
      return;
    }
    if (result.validUrls.length === 0) {
      setStatusMsg(
        result.skippedCount > 0
          ? 'Only social media links (Instagram, TikTok, YouTube, X, Reddit, Threads, Pinterest, Facebook) are supported.'
          : 'Text detected. Only social media links can be pasted in this bar.'
      );
      return;
    }

    setInputValue((prev) => (prev ? `${prev}\n${result.validUrls.join('\n')}` : result.validUrls.join('\n')));
    if (result.skippedCount > 0) {
      setStatusMsg(`Added ${result.validUrls.length} social link(s). Skipped ${result.skippedCount} non-social or invalid item(s).`);
    } else if (statusMsg && !analyzing && !searching) {
      setStatusMsg(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (statusMsg && !analyzing && !searching) setStatusMsg(null);

    if (!val.trim()) {
      setInputValue('');
      setDisplayValue('');
      return;
    }

    if (isSocialMediaUrl(val.trim())) {
      setInputValue(val.trim());
      const label = getCleanSocialDisplayLabel(val.trim());
      setDisplayValue(label || val.trim());
    } else {
      setInputValue(val);
      setDisplayValue(val);
    }
  };

  const handleClearInput = () => {
    setInputValue('');
    setDisplayValue('');
    setStatusMsg(null);
    setSuggestions([]);
    setShowSuggestions(false);
    lastDetectedClipboardUrl.current = '';
    if (detectionDelayTimerRef.current) {
      clearTimeout(detectionDelayTimerRef.current);
      detectionDelayTimerRef.current = null;
    }
    if (clipboardTimerRef.current) {
      clearTimeout(clipboardTimerRef.current);
      clipboardTimerRef.current = null;
    }
    setClipboardPrompt(null);
  };

  const handleAcceptClipboardPrompt = () => {
    if (!clipboardPrompt) return;
    const url = clipboardPrompt.url;
    lastDetectedClipboardUrl.current = url;
    setClipboardPrompt(null);
    if (detectionDelayTimerRef.current) {
      clearTimeout(detectionDelayTimerRef.current);
      detectionDelayTimerRef.current = null;
    }
    if (clipboardTimerRef.current) {
      clearTimeout(clipboardTimerRef.current);
      clipboardTimerRef.current = null;
    }

    if (isMultiMode) {
      setInputValue((prev) => (prev ? `${prev}\n${url}` : url));
      setDisplayValue('');
    } else {
      setInputValue(url);
      const label = getCleanSocialDisplayLabel(url);
      setDisplayValue(label || url);
    }
  };

  const handleDismissClipboardPrompt = () => {
    if (clipboardPrompt) {
      lastDetectedClipboardUrl.current = clipboardPrompt.url;
    }
    if (detectionDelayTimerRef.current) {
      clearTimeout(detectionDelayTimerRef.current);
      detectionDelayTimerRef.current = null;
    }
    if (clipboardTimerRef.current) {
      clearTimeout(clipboardTimerRef.current);
      clipboardTimerRef.current = null;
    }
    setClipboardPrompt(null);
  };

  const handleDownloadAgain = async (recentItem: RecentDownloadItem) => {
    setInputValue(recentItem.url);
    const label = getCleanSocialDisplayLabel(recentItem.url);
    setDisplayValue(label || recentItem.url);
    await handleAnalyzeUrls([recentItem.url]);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setDisplayValue(suggestion);
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
      const unsupportedItem = items.find((item) => item.info.error === 'unsupported_video' || (item.info.download_supported === false && item.info.platform === 'youtube'));
      if (unsupportedItem && items.length === 1) {
        setStatusMsg(unsupportedItem.info.error_message || "This video can't be downloaded right now due to YouTube restrictions.");
      } else {
        setStatusMsg('Ready to download');
      }
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

    if (isSearchMode) {
      await handleExecuteSearch(inputValue.trim());
      return;
    }

    const trimmed = inputValue.trim();

    if (isMultiMode) {
      const result = extractAndValidateSocialUrls(trimmed);
      if (result.hasHarmful) {
        setStatusMsg(result.harmfulReason || 'Harmful or unsafe link blocked.');
        return;
      }
      if (result.validUrls.length === 0) {
        setStatusMsg('Only social media links (Instagram, TikTok, YouTube, X, Reddit, Threads, Pinterest, Facebook) are supported.');
        return;
      }
      if (result.skippedCount > 0) {
        setStatusMsg(`Skipped ${result.skippedCount} unsupported non-social link(s) or text.`);
      }
      await handleAnalyzeUrls(result.validUrls);
      return;
    }

    // Single link mode:
    const validation = validateSocialMediaInput(trimmed);
    if (!validation.isValid) {
      setStatusMsg(validation.errorMessage || 'Only social media links are supported.');
      return;
    }

    await handleAnalyzeUrls([validation.cleanUrl || trimmed]);
  };

  const handleSpecificDownload = useCallback(async (item: VideoResultItem, ext: string, quality: string, mediaCategory?: string) => {
    // Determine category from explicit argument, matching format_option, or item media_type
    const matchedOpt = item.info.format_options?.find(
      (opt) => opt.ext.toLowerCase() === ext.toLowerCase() && opt.quality.toLowerCase() === quality.toLowerCase()
    );
    const resolvedCategory = mediaCategory || matchedOpt?.media_category || (
      ['jpg', 'jpeg', 'png', 'webp'].includes(ext.toLowerCase()) || item.info.media_type === 'image'
        ? 'image'
        : (['mp3', 'wav', 'm4a', 'audio'].includes(ext.toLowerCase()) ? 'audio' : 'video')
    );

    const isInstagram = item.info.platform === 'instagram' || item.info.url?.includes('instagram.com') || item.info.url?.includes('instagr.am');
    const isImageFormat = resolvedCategory === 'image' || ['jpg', 'jpeg', 'png', 'webp'].includes(ext.toLowerCase()) || item.info.media_type === 'image';

    // If a direct media/stream URL was extracted (e.g. cdninstagram, fbcdn, v.redd.it, pinimg, or direct media extension), prefer it
    const isDirectStream = Boolean(
      item.info.download_url && (
        isImageFormat ||
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
      const { job_id } = await apiClient.startDownload(targetUrl, ext.toLowerCase(), quality.toLowerCase(), resolvedCategory);

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
        let fileExt = ext.toLowerCase();
        if (resolvedCategory === 'image') {
          // For image options, the extension must be the option's own ext (jpg, png, webp), lowercased
          fileExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'jpg';
        } else if (resolvedCategory === 'audio') {
          fileExt = fileExt === 'wav' ? 'wav' : 'mp3';
        } else {
          fileExt = fileExt === 'webm' ? 'webm' : 'mp4';
        }

        let filename: string;
        const isThreads = item.info.platform === 'threads' || (item.info.url && (item.info.url.includes('threads.net') || item.info.url.includes('threads.com')));
        if (isThreads) {
          const urlToParse = item.info.url || '';
          const canonMatch = urlToParse.match(/@([a-zA-Z0-9._]+)\/post\/([a-zA-Z0-9_-]+)/);
          let author = canonMatch ? canonMatch[1] : '';
          let postId = canonMatch ? canonMatch[2] : '';
          if (!author && item.info.title) {
            const titleMatch = item.info.title.match(/@([a-zA-Z0-9._]+)/);
            if (titleMatch) author = titleMatch[1];
          }
          if (!postId && urlToParse) {
            const shareMatch = urlToParse.match(/share\/([a-zA-Z0-9_-]+)/);
            if (shareMatch) postId = shareMatch[1];
          }
          author = author.replace(/[^a-zA-Z0-9._-]/g, '') || (resolvedCategory === 'video' ? 'video' : 'photo');
          postId = postId.replace(/[^a-zA-Z0-9._-]/g, '') || 'post';
          const cleanQual = quality.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
          const baseName = `threads_${author}_${postId}_${cleanQual}`;
          filename = `${baseName.slice(0, 55)}.${fileExt}`;
        } else {
          const cleanTitle = (item.info.title || 'mediaflow_download')
            .replace(/[^a-zA-Z0-9_\- ]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .slice(0, 60);
          filename = `${cleanTitle}_${quality.replace(/\s+/g, '_')}.${fileExt}`;
        }
        const fileUrl = apiClient.getDownloadFileUrl(job_id, filename);

        // Reliable universal file download via Blob / triggerFileDownload
        await triggerFileDownload(fileUrl, filename);

        // Save to recent downloads storage locally in the browser
        const updatedRecents = saveRecentDownloadToStorage({
          title: item.info.title || 'Media Download',
          url: item.info.url || targetUrl,
          platform: item.info.platform || 'direct',
          thumbnail_url: item.info.thumbnail_url,
          media_type: item.info.media_type,
          format: ext,
          quality: quality,
        });
        setRecentDownloads(updatedRecents);

        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, downloadState: 'completed' as const } : r
          )
        );
        setTimeout(() => {
          setResults((prev) =>
            prev.map((r) => (r.id === item.id && r.downloadState === 'completed' ? { ...r, downloadState: 'idle' as const } : r))
          );
        }, 5000);
        const displayTitle = (item.info.title || 'media').trim();
        const shortTitle = displayTitle.length > 35 ? `${displayTitle.slice(0, 35)}...` : displayTitle;
        setStatusMsg(`Downloaded and saved: "${shortTitle}" (${quality})`);
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, downloadState: 'failed' as const, progress: finalProgress } : r
          )
        );
        setTimeout(() => {
          setResults((prev) =>
            prev.map((r) => (r.id === item.id && r.downloadState === 'failed' ? { ...r, downloadState: 'idle' as const } : r))
          );
        }, 5000);
        const errText = finalProgress.error || 'Download failed. Please retry.';
        setStatusMsg(
          finalProgress.error_code === 'unsupported_video' ||
          errText.startsWith('This video') ||
          errText.startsWith('Unfortunately') ||
          errText.startsWith('Unable') ||
          errText.startsWith('Access') ||
          errText.startsWith('This media')
            ? errText
            : `Download failed: ${errText}`
        );
      }
    } catch (err) {
      console.error('Download error:', err);
      // Only fallback to direct file download if it is an actual media file URL (not a web page)
      const isDirectMedia = /\.(mp4|webm|mp3|wav|m4a|ogg|flac|mov)(\?.*)?$/i.test(targetUrl);
      if (isDirectMedia) {
        try {
          let filename: string;
          const isThreadsDirect = item.info.platform === 'threads' || (item.info.url && (item.info.url.includes('threads.net') || item.info.url.includes('threads.com')));
          if (isThreadsDirect) {
            const urlToParse = item.info.url || '';
            const canonMatch = urlToParse.match(/@([a-zA-Z0-9._]+)\/post\/([a-zA-Z0-9_-]+)/);
            let author = canonMatch ? canonMatch[1] : '';
            let postId = canonMatch ? canonMatch[2] : '';
            if (!author && item.info.title) {
              const titleMatch = item.info.title.match(/@([a-zA-Z0-9._]+)/);
              if (titleMatch) author = titleMatch[1];
            }
            if (!postId && urlToParse) {
              const shareMatch = urlToParse.match(/share\/([a-zA-Z0-9_-]+)/);
              if (shareMatch) postId = shareMatch[1];
            }
            author = author.replace(/[^a-zA-Z0-9._-]/g, '') || (resolvedCategory === 'video' ? 'video' : 'photo');
            postId = postId.replace(/[^a-zA-Z0-9._-]/g, '') || 'post';
            const cleanQual = quality.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
            const baseName = `threads_${author}_${postId}_${cleanQual}`;
            filename = `${baseName.slice(0, 55)}.${ext.toLowerCase()}`;
          } else {
            const cleanTitle = (item.info.title || 'mediaflow_download')
              .replace(/[^a-zA-Z0-9_\- ]/g, '')
              .trim()
              .replace(/\s+/g, '_');
            filename = `${cleanTitle}_${quality}.${ext.toLowerCase()}`;
          }
          await triggerFileDownload(targetUrl, filename);

          // Save to recent downloads storage locally in the browser
          const updatedRecents = saveRecentDownloadToStorage({
            title: item.info.title || 'Media Download',
            url: item.info.url || targetUrl,
            platform: item.info.platform || 'direct',
            thumbnail_url: item.info.thumbnail_url,
            media_type: item.info.media_type,
            format: ext,
            quality: quality,
          });
          setRecentDownloads(updatedRecents);

          setResults((prev) =>
            prev.map((r) =>
              r.id === item.id ? { ...r, downloadState: 'completed' as const } : r
            )
          );
          setTimeout(() => {
            setResults((prev) =>
              prev.map((r) => (r.id === item.id && r.downloadState === 'completed' ? { ...r, downloadState: 'idle' as const } : r))
            );
          }, 5000);
          const displayTitle = (item.info.title || 'media').trim();
          const shortTitle = displayTitle.length > 35 ? `${displayTitle.slice(0, 35)}...` : displayTitle;
          setStatusMsg(`Downloaded and saved: "${shortTitle}" (${quality})`);
        } catch {
          setResults((prev) =>
            prev.map((r) =>
              r.id === item.id ? { ...r, downloadState: 'failed' as const } : r
            )
          );
          setTimeout(() => {
            setResults((prev) =>
              prev.map((r) => (r.id === item.id && r.downloadState === 'failed' ? { ...r, downloadState: 'idle' as const } : r))
            );
          }, 5000);
          setStatusMsg('Download failed. Please check link and try again.');
        }
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, downloadState: 'failed' as const } : r
          )
        );
        setTimeout(() => {
          setResults((prev) =>
            prev.map((r) => (r.id === item.id && r.downloadState === 'failed' ? { ...r, downloadState: 'idle' as const } : r))
          );
        }, 5000);
        setStatusMsg('Download error. Please retry or choose another format.');
      }
    }
  }, []);

  const handleSlideDownload = useCallback(
    async (item: VideoResultItem, slide: SlideItem, opt: FormatOption) => {
      const isVideo = slide.media_type === 'video';
      const targetUrl = isVideo
        ? (slide.download_url || `${item.info.url}#slide=${slide.slide_index}`)
        : (slide.download_url || item.info.url);
      const slideExt = opt.ext.toLowerCase();
      const slideQuality = opt.quality.toLowerCase();
      const slideCategory = opt.media_category;

      const fullFormat = `Slide ${slide.slide_index} (${opt.ext} ${opt.quality})`;
      setResults((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, downloadState: 'downloading' as const, activeQuality: fullFormat, progress: null }
            : r
        )
      );

      try {
        const { job_id } = await apiClient.startDownload(
          targetUrl,
          slideExt,
          slideQuality,
          slideCategory,
          slide.slide_index,
          false,
          item.info.url
        );

        const subscription = apiClient.subscribeProgress(job_id, (progress) => {
          setResults((prev) =>
            prev.map((r) => (r.id === item.id ? { ...r, progress } : r))
          );
        });

        activeSubscriptions.current.set(item.id, subscription);
        const finalProgress = await subscription.done;
        activeSubscriptions.current.delete(item.id);

        if (finalProgress.status === 'COMPLETED') {
          let fileExt = opt.ext.toLowerCase();
          if (slideCategory === 'image') {
            fileExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'jpg';
          } else if (slideCategory === 'audio') {
            fileExt = fileExt === 'wav' ? 'wav' : 'mp3';
          } else {
            fileExt = fileExt === 'webm' ? 'webm' : 'mp4';
          }

          let filename = '';
          if (item.info.platform === 'threads' || item.info.url.includes('threads.net') || item.info.url.includes('threads.com')) {
            let author = '';
            let postId = '';
            const match = item.info.url.match(/@([^/]+)\/post\/([^/?]+)/);
            if (match) {
              author = match[1];
              postId = match[2];
            } else {
              const shareMatch = item.info.url.match(/share\/([^/?]+)/);
              postId = shareMatch ? shareMatch[1] : 'post';
              author = 'threads';
            }
            author = author.replace(/[^a-zA-Z0-9._-]/g, '') || 'threads';
            postId = postId.replace(/[^a-zA-Z0-9._-]/g, '') || 'post';
            filename = `threads_${author}_${postId}_slide_${String(slide.slide_index).padStart(2, '0')}.${fileExt}`;
          } else {
            const cleanTitle = (item.info.title || 'carousel')
              .replace(/[^a-zA-Z0-9_\- ]/g, '')
              .trim()
              .replace(/\s+/g, '_')
              .slice(0, 40);
            filename = `${cleanTitle}_slide_${String(slide.slide_index).padStart(2, '0')}.${fileExt}`;
          }
          const fileUrl = apiClient.getDownloadFileUrl(job_id, filename);
          await triggerFileDownload(fileUrl, filename);

          setResults((prev) =>
            prev.map((r) => (r.id === item.id ? { ...r, downloadState: 'completed' as const } : r))
          );
          setTimeout(() => {
            setResults((prev) =>
              prev.map((r) => (r.id === item.id && r.downloadState === 'completed' ? { ...r, downloadState: 'idle' as const } : r))
            );
          }, 5000);
          setStatusMsg(`Downloaded Slide ${slide.slide_index} (${opt.ext} ${opt.quality})`);
        } else {
          setResults((prev) =>
            prev.map((r) => (r.id === item.id ? { ...r, downloadState: 'failed' as const, progress: finalProgress } : r))
          );
          setTimeout(() => {
            setResults((prev) =>
              prev.map((r) => (r.id === item.id && r.downloadState === 'failed' ? { ...r, downloadState: 'idle' as const } : r))
            );
          }, 5000);
          const errText = finalProgress.error || 'Download failed. Please retry.';
          setStatusMsg(errText.startsWith('This') || errText.startsWith('Unable') ? errText : `Download failed: ${errText}`);
        }
      } catch (err) {
        console.error('Slide download error:', err);
        setResults((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, downloadState: 'failed' as const } : r))
        );
        setTimeout(() => {
          setResults((prev) =>
            prev.map((r) => (r.id === item.id && r.downloadState === 'failed' ? { ...r, downloadState: 'idle' as const } : r))
          );
        }, 5000);
        setStatusMsg('Download error. Please check link and try again.');
      }
    },
    []
  );

  const handleCarouselZipDownload = useCallback(async (item: VideoResultItem) => {
    const targetUrl = item.info.url;
    setResults((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? { ...r, downloadState: 'downloading' as const, activeQuality: 'All Slides (ZIP)', progress: null }
          : r
      )
    );

    try {
      const { job_id } = await apiClient.startDownload(
        targetUrl,
        'zip',
        'best',
        'carousel_zip',
        undefined,
        true,
        item.info.url
      );

      const subscription = apiClient.subscribeProgress(job_id, (progress) => {
        setResults((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, progress } : r))
        );
      });

      activeSubscriptions.current.set(item.id, subscription);
      const finalProgress = await subscription.done;
      activeSubscriptions.current.delete(item.id);

      if (finalProgress.status === 'COMPLETED') {
        let filename = finalProgress.filename;
        if (!filename) {
          if (item.info.platform === 'threads' || item.info.url.includes('threads.net') || item.info.url.includes('threads.com')) {
            let author = '';
            let postId = '';
            const match = item.info.url.match(/@([^/]+)\/post\/([^/?]+)/);
            if (match) {
              author = match[1];
              postId = match[2];
            } else {
              const shareMatch = item.info.url.match(/share\/([^/?]+)/);
              postId = shareMatch ? shareMatch[1] : 'post';
              author = 'threads';
            }
            author = author.replace(/[^a-zA-Z0-9._-]/g, '') || 'threads';
            postId = postId.replace(/[^a-zA-Z0-9._-]/g, '') || 'post';
            filename = `threads_${author}_${postId}_all_slides.zip`;
          } else {
            const cleanTitle = (item.info.title || 'carousel')
              .replace(/[^a-zA-Z0-9_\- ]/g, '')
              .trim()
              .replace(/\s+/g, '_')
              .slice(0, 40);
            filename = `${cleanTitle}_all_slides.zip`;
          }
        }
        const fileUrl = apiClient.getDownloadFileUrl(job_id, filename);
        await triggerFileDownload(fileUrl, filename);

        setResults((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, downloadState: 'completed' as const } : r))
        );
        setTimeout(() => {
          setResults((prev) =>
            prev.map((r) => (r.id === item.id && r.downloadState === 'completed' ? { ...r, downloadState: 'idle' as const } : r))
          );
        }, 5000);
        setStatusMsg(`Downloaded All Slides ZIP (${item.info.slide_count} slides)`);
      } else {
        setResults((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, downloadState: 'failed' as const, progress: finalProgress } : r))
        );
        setTimeout(() => {
          setResults((prev) =>
            prev.map((r) => (r.id === item.id && r.downloadState === 'failed' ? { ...r, downloadState: 'idle' as const } : r))
          );
        }, 5000);
        const errText = finalProgress.error || 'ZIP packaging failed.';
        setStatusMsg(errText);
      }
    } catch (err) {
      console.error('ZIP download error:', err);
      setResults((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, downloadState: 'failed' as const } : r))
      );
      setTimeout(() => {
        setResults((prev) =>
          prev.map((r) => (r.id === item.id && r.downloadState === 'failed' ? { ...r, downloadState: 'idle' as const } : r))
        );
      }, 5000);
      setStatusMsg('Download error. Please check connection and try again.');
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
      
      {/* 1. Smooth Rotating Loop Showcase of Pearl Badges (Icon-Only, Clean, Purely Decorative) */}
      <div className="platform-marquee-container" aria-hidden="true">
        <div className="platform-marquee-track">
          <div className="platform-marquee-group">
            {PLATFORM_ICONS.map((platform, idx) => (
              <div
                key={`platform-pearl-1-${platform.type}-${idx}`}
                className="pearl-icon-badge"
              >
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {platform.type === 'x_twitter' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" style={{ display: 'block' }}>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ) : (
                    platform.svg
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="platform-marquee-group" aria-hidden="true">
            {PLATFORM_ICONS.map((platform, idx) => (
              <div
                key={`platform-pearl-2-${platform.type}-${idx}`}
                className="pearl-icon-badge"
              >
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {platform.type === 'x_twitter' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" style={{ display: 'block' }}>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ) : (
                    platform.svg
                  )}
                </div>
              </div>
            ))}
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
            onMouseEnter={() => handleCheckClipboard(true)}
          >
            <textarea
              rows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPaste={handleTextareaPaste}
              onDrop={handleTextareaDrop}
              onFocus={() => handleCheckClipboard(true)}
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
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {detectedSocialIconsInMulti.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.35rem' }}>
                    {detectedSocialIconsInMulti.map((icon) => (
                      <span
                        key={icon.type}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-color)',
                          boxShadow: '1px 1px 3px var(--neumorph-dark), -1px -1px 3px var(--neumorph-light)',
                        }}
                        title={`Detected: ${icon.name}`}
                      >
                        {icon.svg}
                      </span>
                    ))}
                  </div>
                )}
                <span>
                  {inputValue.trim()
                    ? `${inputValue.trim().split('\n').filter(Boolean).length} URL(s) detected`
                    : 'Batch Download Mode'}
                </span>
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
                  <motion.button
                    type="button"
                    onClick={clipboardPrompt ? handleAcceptClipboardPrompt : handlePaste}
                    title={clipboardPrompt ? `Click to paste detected ${clipboardPrompt.platformName} link` : "Paste from clipboard"}
                    className="pill-btn input-action-btn paste-motion-btn"
                    animate={{
                      width: clipboardPrompt ? (isMobile ? 104 : 124) : (isMobile ? 54 : 66),
                    }}
                    transition={{
                      duration: 0.38,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                      color: 'var(--text-color)',
                      fontWeight: 700,
                      fontSize: isMobile ? '0.72rem' : '0.78rem',
                      minHeight: isMobile ? '30px' : '34px',
                      height: isMobile ? '30px' : '34px',
                      padding: 0,
                      flexShrink: 0,
                      cursor: 'pointer',
                      transformOrigin: 'right center',
                    }}
                  >
                    <AnimatePresence initial={false} mode="popLayout">
                      {clipboardPrompt ? (
                        <motion.span
                          key="detected-multi"
                          initial={{ x: 36, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -36, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                            color: 'var(--text-color)',
                          }}
                        >
                          Link detected
                        </motion.span>
                      ) : (
                        <motion.span
                          key="paste-multi"
                          initial={{ x: 36, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -36, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                            color: 'var(--text-color)',
                          }}
                        >
                          Paste
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
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
            onMouseEnter={() => handleCheckClipboard(true)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: 'var(--radius-full)',
              padding: detectedPlatformIcon ? '0.6rem 0.75rem 0.6rem 1.15rem' : '0.6rem 0.75rem 0.6rem 1.85rem',
              boxShadow: 'var(--nm-inset-md)',
              transition: 'border-radius 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease',
            }}
          >
            {/* Live Social Media URL Detector Favicon */}
            {detectedPlatformIcon && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-color)',
                  boxShadow: '2px 2px 5px var(--neumorph-dark), -2px -2px 5px var(--neumorph-light)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  marginRight: '0.65rem',
                  flexShrink: 0,
                  animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 3,
                }}
                title={`Detected: ${detectedPlatformIcon.name}`}
              >
                {detectedPlatformIcon.svg}
              </div>
            )}

            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, textAlign: 'left' }}>
              <input
                className="url-main-input"
                type="text"
                value={displayValue || inputValue}
                onChange={handleInputChange}
                onPaste={handleInputPaste}
                onDrop={handleInputDrop}
                onKeyDown={handleInputKeyDown}
                onFocus={() => {
                  setIsInputFocused(true);
                  if (isSearchMode && suggestions.length > 0) setShowSuggestions(true);
                  handleCheckClipboard(true);
                }}
                onBlur={() => setIsInputFocused(false)}
                placeholder={isSearchMode ? 'Type keywords (e.g. lofi hip hop, podcast)...' : ''}
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
              {!inputValue && !isSearchMode && !isMultiMode && (
                <div
                  aria-hidden="true"
                  className="url-placeholder-wrapper"
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
                    className="url-placeholder-text"
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

            <div className="input-bar-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.35rem' }}>
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
                    <motion.button
                      type="button"
                      onClick={clipboardPrompt ? handleAcceptClipboardPrompt : handlePaste}
                      title={clipboardPrompt ? `Click to paste detected ${clipboardPrompt.platformName} link` : "Paste from clipboard"}
                      className="pill-btn input-action-btn paste-motion-btn"
                      animate={{
                        width: clipboardPrompt ? (isMobile ? 104 : 124) : (isMobile ? 54 : 66),
                      }}
                      transition={{
                        duration: 0.38,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-color)',
                        fontWeight: 700,
                        fontSize: isMobile ? '0.72rem' : '0.82rem',
                        minHeight: isMobile ? '32px' : '38px',
                        height: isMobile ? '32px' : '38px',
                        padding: 0,
                        flexShrink: 0,
                        cursor: 'pointer',
                        transformOrigin: 'right center',
                      }}
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {clipboardPrompt ? (
                          <motion.span
                            key="detected-single"
                            initial={{ x: 36, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -36, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              userSelect: 'none',
                              whiteSpace: 'nowrap',
                              color: 'var(--text-color)',
                            }}
                          >
                            Link detected
                          </motion.span>
                        ) : (
                          <motion.span
                            key="paste-single"
                            initial={{ x: 36, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -36, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              userSelect: 'none',
                              whiteSpace: 'nowrap',
                              color: 'var(--text-color)',
                            }}
                          >
                            Paste
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
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

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.90 }}
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
                  <span style={{ display: 'inline-block', transition: 'transform 0.12s ease' }}>➔</span>
                )}
              </motion.button>
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
          <Search className="w-4 h-4" /> Search yt video
        </button>
      </div>

      {/* Initial Input Error / Status Message Pill */}
      {statusMsg && !analyzing && !searching && results.length === 0 && searchResults.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.15rem', marginBottom: '0.25rem', transition: 'all 0.25s ease' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.45rem 0.85rem 0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.75)',
              boxShadow: '4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-color)',
              letterSpacing: '-0.01em',
              maxWidth: '90vw',
            }}
          >
            {statusMsg.toLowerCase().includes('failed') || statusMsg.toLowerCase().includes('error') || statusMsg.toLowerCase().includes('blocked') || statusMsg.toLowerCase().includes('unsupported') || statusMsg.toLowerCase().includes('skipped') || statusMsg.toLowerCase().includes('detected') || statusMsg.toLowerCase().includes('invalid') || statusMsg.toLowerCase().includes('only social') ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#22c55e25', color: '#16a34a', flexShrink: 0 }}>
                <Check className="w-3 h-3 text-emerald-600" />
              </span>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{statusMsg}</span>
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
                marginLeft: '0.25rem',
              }}
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
              <div style={{ display: 'inline-flex', alignItems: 'center', height: '36px', padding: '0 1rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-color)' }}>
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
                      <ButtonSpinner className="spinner-mono" size="sm" />
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
              <span>{results.length > 1 ? 'Clear All' : 'Clear'}</span>
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

            const isUnsupported = item.info.error === 'unsupported_video' || (item.info.download_supported === false && item.info.platform === 'youtube');

            if (item.info.is_carousel && item.info.slides && item.info.slides.length > 1) {
              const slides = item.info.slides;
              const isDownloadingZip = item.downloadState === 'downloading' && item.activeQuality === 'All Slides (ZIP)';
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  {/* Top Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'var(--bg-color)',
                          boxShadow: '2px 2px 5px var(--neumorph-dark), -2px -2px 5px var(--neumorph-light)',
                        }}
                      >
                        <Layers className="w-5 h-5" style={{ color: "var(--text-color)" }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: 'var(--text-color)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '380px',
                            }}
                          >
                            {decodeHtmlEntities(item.info.title) || (item.info.platform === 'threads' ? 'Threads Carousel' : 'Instagram Carousel')}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.15rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              backgroundColor: 'var(--bg-color)',
                              color: 'var(--text-color)',
                              border: '1px solid rgba(255, 255, 255, 0.65)',
                              boxShadow: 'inset 1px 1px 3px var(--neumorph-dark), inset -1px -1px 3px var(--neumorph-light)',
                              flexShrink: 0,
                              lineHeight: 1.2,
                            }}
                          >
                            {slides.length} slides
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Download individual photos/videos or download all at once
                        </span>
                      </div>
                    </div>

                    {/* Download All (ZIP) Button */}
                    <button
                      type="button"
                      className="pill-btn"
                      onClick={() => handleCarouselZipDownload(item)}
                      disabled={item.downloadState === 'downloading'}
                      style={{
                        height: '40px',
                        padding: '0 1.25rem',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: 'var(--text-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        cursor: item.downloadState === 'downloading' ? 'wait' : 'pointer',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(255, 255, 255, 0.65)',
                        backgroundColor: 'var(--bg-color)',
                        boxShadow: '3px 3px 8px var(--neumorph-dark), -3px -3px 8px var(--neumorph-light)',
                        flexShrink: 0,
                      }}
                    >
                      {isDownloadingZip ? (
                        <>
                          <ButtonSpinner className="spinner-mono" />
                          <span>
                            {item.progress && item.progress.eta
                              ? item.progress.eta
                              : 'Packaging ZIP archive...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4" style={{ color: 'var(--text-color)' }} />
                          <span>Download All (ZIP)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Active Download Progress Bar */}
                  {item.downloadState === 'downloading' && item.progress && (
                    <div style={{ width: '100%', padding: '0.5rem 0' }}>
                      <div className="nm-progress-track">
                        <div
                          className="nm-progress-fill"
                          style={{
                            width: `${Math.max(item.progress.percent, 3)}%`,
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-color)' }}>
                          {item.progress.eta || item.activeQuality || 'Downloading...'}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-color)' }} className="tabular-nums">
                          {item.progress.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Slide Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: '1.15rem',
                      width: '100%',
                    }}
                  >
                    {slides.map((slide) => {
                      const isSlideVideo = slide.media_type === 'video';
                      const slideOpts = slide.format_options && slide.format_options.length > 0
                        ? slide.format_options
                        : isSlideVideo
                        ? [
                            { format_id: 'mp4_hd', ext: 'MP4', quality: 'HD Video', file_size_formatted: '', media_category: 'video' as const },
                            { format_id: 'mp3_audio', ext: 'MP3', quality: 'Audio', file_size_formatted: '', media_category: 'audio' as const },
                          ]
                        : [
                            { format_id: 'jpg_orig', ext: 'JPG', quality: 'Original', file_size_formatted: '', media_category: 'image' as const },
                            { format_id: 'png_hd', ext: 'PNG', quality: 'HD Lossless', file_size_formatted: '', media_category: 'image' as const },
                            { format_id: 'webp_hd', ext: 'WEBP', quality: 'Web-Optimized', file_size_formatted: '', media_category: 'image' as const },
                          ];

                      return (
                        <div
                          key={slide.id || slide.slide_index}
                          style={{
                            backgroundColor: 'var(--bg-color)',
                            border: '1px solid rgba(255, 255, 255, 0.65)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            padding: '0.75rem',
                            boxShadow: '3px 3px 10px var(--neumorph-dark), -3px -3px 10px var(--neumorph-light)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                          }}
                        >
                          {/* Slide Media Thumbnail Container */}
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              aspectRatio: '1 / 1',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              backgroundColor: '#111',
                            }}
                          >
                            {slide.thumbnail_url ? (
                              <img
                                src={slide.thumbnail_url}
                                alt={`Slide ${slide.slide_index}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#666',
                                }}
                              >
                                {isSlideVideo ? <Video className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                              </div>
                            )}

                            {/* Top Left: Slide Index Badge */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                padding: '0.2rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                lineHeight: 1,
                              }}
                            >
                              Slide {slide.slide_index}
                            </div>

                            {/* Top Right: Photo / Video Badge */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                lineHeight: 1,
                              }}
                            >
                              {isSlideVideo ? (
                                <>
                                  <Video className="w-3 h-3 text-white" />
                                  <span>Video</span>
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-3 h-3 text-white" />
                                  <span>Photo</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Format Options List for Slide */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {slideOpts.map((opt) => {
                              const isThisDownloading =
                                item.downloadState === 'downloading' &&
                                item.activeQuality === `Slide ${slide.slide_index} (${opt.ext} ${opt.quality})`;

                              return (
                                <button
                                  key={opt.format_id || `${opt.ext}_${opt.quality}`}
                                  type="button"
                                  className="pill-btn nm-format-btn"
                                  onClick={() => handleSlideDownload(item, slide, opt)}
                                  disabled={item.downloadState === 'downloading'}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    width: '100%',
                                    backgroundColor: 'var(--bg-color)',
                                    border: '1px solid rgba(255, 255, 255, 0.6)',
                                    boxShadow: '1px 1px 3px var(--neumorph-dark), -1px -1px 3px var(--neumorph-light)',
                                    cursor: item.downloadState === 'downloading' ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--text-color)' }}>{opt.ext}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{opt.quality}</span>
                                  </span>

                                  {isThisDownloading ? (
                                    <ButtonSpinner className="spinner-mono" size="sm" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" style={{ color: 'var(--text-color)' }} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

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
                  {/* LEFT COLUMN: Modern Media Player Card (Inspired by MusicPlayerCard) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                    <MediaPlayerCard
                      url={item.info.url}
                      thumbnailUrl={item.info.thumbnail_url}
                      title={decodeHtmlEntities(item.info.title) || item.info.url}
                      platform={item.info.platform}
                      mediaType={item.info.media_type}
                      duration={item.info.duration || 59}
                    />

                    {isUnsupported && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>Restricted on YouTube</span>
                      </div>
                    )}

                    {item.info.muted && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 700,
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
                            className="[--base-color:var(--text-color)] [--base-gradient-color:var(--text-muted)] text-xs font-extrabold"
                            duration={1}
                            spread={1}
                            zDistance={1}
                            scaleDistance={1.1}
                            rotateYDistance={20}
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
                                border: '1px solid rgba(255, 255, 255, 0.65)',
                                boxShadow: '2px 2px 4px var(--neumorph-dark), -2px -2px 4px var(--neumorph-light)',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                color: 'var(--text-color)',
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
                      
                      {isUnsupported ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '2.5rem 1.5rem',
                            borderRadius: '20px',
                            backgroundColor: 'var(--bg-color)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            boxShadow: 'inset 2px 2px 6px var(--neumorph-dark), inset -2px -2px 6px var(--neumorph-light)',
                            gap: '0.85rem',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              boxShadow: '2px 2px 5px var(--neumorph-dark), -2px -2px 5px var(--neumorph-light)',
                            }}
                          >
                            <AlertCircle className="w-6 h-6" />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-color)' }}>
                              Unavailable for Download
                            </span>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: 0, lineHeight: 1.45 }}>
                              {item.info.error_message || "This video can't be downloaded right now due to YouTube restrictions."}
                            </p>
                          </div>
                        </div>
                      ) : isImageMedia ? (
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
                                  onClick={() => handleSpecificDownload(item, opt.ext, opt.quality, opt.media_category)}
                                  disabled={item.downloadState === 'downloading'}
                                >
                                  {item.downloadState === 'downloading' && item.activeQuality === `${opt.ext} ${opt.quality}` ? (
                                    <>
                                      <ButtonSpinner className="spinner-mono" size="sm" />
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
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
                          {/* SIDE BY SIDE TABS FOR VIDEO & AUDIO WITH FLOATING PILL ANIMATION */}
                          <div
                            style={{
                              position: 'relative',
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px',
                              borderRadius: '9999px',
                              backgroundColor: 'var(--bg-color)',
                              boxShadow: 'inset 3px 3px 6px var(--neumorph-dark), inset -3px -3px 6px var(--neumorph-light)',
                              border: '1px solid rgba(255, 255, 255, 0.5)',
                              marginBottom: '1rem',
                              width: 'fit-content',
                              userSelect: 'none',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveMediaTabs((prev) => ({ ...prev, [item.id]: 'video' }))}
                              style={{
                                position: 'relative',
                                zIndex: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.45rem 1.25rem',
                                borderRadius: '9999px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: (activeMediaTabs[item.id] || 'video') === 'video' ? 'var(--text-color)' : 'var(--text-muted)',
                                transition: 'color 0.2s ease',
                              }}
                            >
                              {(activeMediaTabs[item.id] || 'video') === 'video' && (
                                <motion.div
                                  layoutId={`active-format-pill-${item.id}`}
                                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '9999px',
                                    backgroundColor: 'var(--bg-color)',
                                    boxShadow: '4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)',
                                    border: '1px solid rgba(255, 255, 255, 0.75)',
                                    zIndex: -1,
                                  }}
                                />
                              )}
                              <Video className="w-4 h-4 text-emerald-600" />
                              <span>Video Formats</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveMediaTabs((prev) => ({ ...prev, [item.id]: 'audio' }))}
                              style={{
                                position: 'relative',
                                zIndex: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.45rem 1.25rem',
                                borderRadius: '9999px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: (activeMediaTabs[item.id] || 'video') === 'audio' ? 'var(--text-color)' : 'var(--text-muted)',
                                transition: 'color 0.2s ease',
                              }}
                            >
                              {(activeMediaTabs[item.id] || 'video') === 'audio' && (
                                <motion.div
                                  layoutId={`active-format-pill-${item.id}`}
                                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '9999px',
                                    backgroundColor: 'var(--bg-color)',
                                    boxShadow: '4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)',
                                    border: '1px solid rgba(255, 255, 255, 0.75)',
                                    zIndex: -1,
                                  }}
                                />
                              )}
                              <Music className="w-4 h-4 text-amber-600" />
                              <span>Audio / MP3</span>
                            </button>
                          </div>

                          {/* Render Active Tab's Table with Smooth Transition Animation */}
                          <AnimatePresence mode="wait" initial={false}>
                            {(activeMediaTabs[item.id] || 'video') === 'video' ? (
                              <motion.div
                                key={`video-tab-${item.id}`}
                                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
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
                                      onClick={() => handleSpecificDownload(item, opt.ext, opt.quality, opt.media_category)}
                                      disabled={item.downloadState === 'downloading'}
                                    >
                                      {item.downloadState === 'downloading' && item.activeQuality === `${opt.ext} ${opt.quality}` ? (
                                        <>
                                          <div className="uiverse-spinner spinner-mono" style={{ marginRight: '3px' }}>
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
                              </motion.div>
                            ) : (
                              <motion.div
                                key={`audio-tab-${item.id}`}
                                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
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
                                      onClick={() => handleSpecificDownload(item, opt.ext, opt.quality, opt.media_category)}
                                      disabled={item.downloadState === 'downloading'}
                                    >
                                      {item.downloadState === 'downloading' && item.activeQuality === `${opt.ext} ${opt.quality}` ? (
                                        <>
                                          <div className="uiverse-spinner spinner-mono" style={{ marginRight: '3px' }}>
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
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
                            {statusMsg.toLowerCase().includes('failed') || statusMsg.toLowerCase().includes('error') || statusMsg.toLowerCase().includes('blocked') || statusMsg.toLowerCase().includes('unsupported') || statusMsg.toLowerCase().includes('skipped') || statusMsg.toLowerCase().includes('detected') || statusMsg.toLowerCase().includes('invalid') || statusMsg.toLowerCase().includes('only social') ? (
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

      {/* 5. Recent Downloads Section (Stored locally in Browser via localStorage) */}
      {recentDownloads.length > 0 && results.length === 0 && searchResults.length === 0 && !analyzing && !searching && (
        <div
          style={{
            padding: '1.25rem 1.45rem',
            backgroundColor: 'var(--bg-color)',
            borderRadius: '20px',
            boxShadow: 'var(--nm-raised-md)',
            border: '1px solid rgba(255, 255, 255, 0.55)',
            textAlign: 'left',
            animation: 'fadeIn 0.3s ease-out',
            width: '100%',
            maxWidth: '680px',
            margin: '2.5rem auto 0 auto',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem',
            }}
          >
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 750,
                color: 'var(--text-color)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Recent downloads
            </h3>
            <button
              type="button"
              onClick={() => {
                clearRecentDownloadsFromStorage();
                setRecentDownloads([]);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
              }}
            >
              {recentDownloads.length === 1 ? 'Clear' : 'Clear all'}
            </button>
          </div>

          <div
            style={{
              height: '1px',
              backgroundColor: 'rgba(0, 0, 0, 0.07)',
              marginBottom: '0.85rem',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentDownloads.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--nm-inset-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  gap: '0.65rem',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-color)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                  {item.quality && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        padding: '0.12rem 0.4rem',
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}
                    >
                      {item.quality}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadAgain(item)}
                    className="pill-btn-black"
                    style={{
                      height: '28px',
                      minHeight: '28px',
                      padding: '0 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Download again
                  </button>
                  {recentDownloads.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = removeRecentDownloadFromStorage(item.id);
                        setRecentDownloads(updated);
                      }}
                      title="Remove from history"
                      aria-label="Remove item"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
