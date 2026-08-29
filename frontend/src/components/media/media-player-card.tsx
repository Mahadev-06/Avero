"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, ExternalLink, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
import { detectPlatform } from '@/lib/url-parser';

interface MediaPlayerCardProps {
  url: string;
  thumbnailUrl?: string;
  title?: string;
  platform?: string;
  mediaType?: string;
  duration?: number;
}

export function MediaPlayerCard({
  url,
  thumbnailUrl,
  title,
  platform,
  mediaType = "video",
  duration = 59,
}: MediaPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Extract YouTube ID if applicable
  const getYouTubeId = (link: string) => {
    const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const isImage = mediaType === 'image' || platform === 'pinterest' || /\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i.test(url) || (thumbnailUrl && /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(thumbnailUrl));
  const youtubeId = !isImage ? getYouTubeId(url) : null;
  const rawThumbnail = thumbnailUrl || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null);

  const isImageHostOrExt = (link: string | null | undefined): boolean => {
    if (!link || !link.startsWith('http')) return false;
    if (link.includes('reddit.com/r/') || link.includes('youtube.com/watch') || link.includes('instagram.com/p/')) return false;
    return (
      link.includes('ytimg.com') ||
      link.includes('pinimg.com') ||
      link.includes('twimg.com') ||
      link.includes('i.redd.it') ||
      link.includes('preview.redd.it') ||
      link.includes('cdninstagram.com') ||
      link.includes('tiktokcdn.com') ||
      ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].some((ext) => link.toLowerCase().includes(ext))
    );
  };

  const effectiveThumbnail = !imgError && isImageHostOrExt(rawThumbnail) ? rawThumbnail : null;

  // Platform Detection & Exact Brand Logos
  const getPlatformInfo = () => {
    const detected = detectPlatform(url);
    const p = (detected && detected !== 'Direct URL' && detected !== 'Direct Media') 
      ? detected 
      : (platform || detected || 'Media');
    const pLower = p.toLowerCase();

    if (pLower.includes('youtube')) {
      return {
        name: 'YouTube',
        logo: (
          <svg width="20" height="14" viewBox="0 0 24 17" fill="none" style={{ display: 'block' }}>
            <path d="M23.498 2.627a3.016 3.016 0 0 0-2.122-2.136C19.505 0 12 0 12 0s-7.505 0-9.377.491A3.016 3.016 0 0 0 .502 2.627C0 4.516 0 8.468 0 8.468s0 3.952.502 5.841a3.016 3.016 0 0 0 2.122 2.136c1.871.491 9.376.491 9.376.491s7.505 0 9.377-.491a3.016 3.016 0 0 0 2.122-2.136C24 12.42 24 8.468 24 8.468s0-3.952-.502-5.841z" fill="#FF0000"/>
            <path d="M9.545 12.068V4.869L15.818 8.47l-6.273 3.598z" fill="#FFFFFF"/>
          </svg>
        ),
      };
    }

    if (pLower.includes('instagram')) {
      return {
        name: 'Instagram',
        logo: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="mpCardIgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD521" />
                <stop offset="25%" stopColor="#F50000" />
                <stop offset="50%" stopColor="#B900B4" />
                <stop offset="100%" stopColor="#7E00FF" />
              </linearGradient>
            </defs>
            <rect width="24" height="24" rx="6" fill="url(#mpCardIgGrad)" />
            <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
            <circle cx="12" cy="12" r="3.8" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
            <circle cx="16.5" cy="7.5" r="1.1" fill="#FFFFFF" />
          </svg>
        ),
      };
    }

    if (pLower.includes('tiktok')) {
      return {
        name: 'TikTok',
        logo: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
            <path fill="#25F4EE" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.55-1.24 2.55.05.9.6 1.75 1.41 2.16.85.45 1.92.42 2.73-.06.77-.45 1.28-1.29 1.34-2.19.04-3.58.02-7.16.02-10.74z"/>
            <path fill="#FE2C55" d="M11.5 1.5c1.2 0 2.4 0 3.6 0 .07 1.4.58 2.8 1.6 3.8 1 1 2.4 1.5 3.8 1.6v3.6c-1.3-.05-2.6-.32-3.8-.88-.5-.23-1-.53-1.4-.84-.01 2.6.01 5.2-.02 7.8-.07 1.2-.48 2.5-1.2 3.5-1.2 1.7-3.2 2.8-5.3 2.9-1.3.07-2.5-.28-3.6-.92-1.8-1-3.1-3-3.3-5.1-.02-.4-.03-.9-.01-1.3.16-1.7 1-3.3 2.3-4.4 1.5-1.3 3.6-1.9 5.5-1.5.02 1.3-.04 2.6-.04 4-.9-.28-1.9-.2-2.7.33-.7.5-1.2 1.4-1.1 2.3.04.8.5 1.5 1.2 1.9.7.4 1.7.38 2.4-.05.7-.4 1.1-1.1 1.2-1.9.04-3.2.02-6.4.02-9.6z" opacity="0.85" />
            <path fill="#FFFFFF" d="M12 1c1.2 0 2.4 0 3.6 0 .07 1.4.58 2.8 1.6 3.8 1 1 2.4 1.5 3.8 1.6v3.6c-1.3-.05-2.6-.32-3.8-.88-.5-.23-1-.53-1.4-.84-.01 2.6.01 5.2-.02 7.8-.07 1.2-.48 2.5-1.2 3.5-1.2 1.7-3.2 2.8-5.3 2.9-1.3.07-2.5-.28-3.6-.92-1.8-1-3.1-3-3.3-5.1-.02-.4-.03-.9-.01-1.3.16-1.7 1-3.3 2.3-4.4 1.5-1.3 3.6-1.9 5.5-1.5.02 1.3-.04 2.6-.04 4-.9-.28-1.9-.2-2.7.33-.7.5-1.2 1.4-1.1 2.3.04.8.5 1.5 1.2 1.9.7.4 1.7.38 2.4-.05.7-.4 1.1-1.1 1.2-1.9.04-3.2.02-6.4.02-9.6z"/>
          </svg>
        ),
      };
    }

    if (pLower.includes('pinterest')) {
      return {
        name: 'Pinterest',
        logo: (
          <img src="/pinterest-logo.png" alt="Pinterest" width={18} height={18} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'contain', display: 'block' }} />
        ),
      };
    }

    if (pLower.includes('reddit')) {
      return {
        name: 'Reddit',
        logo: (
          <img src="/reddit-logo.png" alt="Reddit" width={18} height={18} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'contain', display: 'block' }} />
        ),
      };
    }

    if (pLower.includes('threads')) {
      return {
        name: 'Threads',
        logo: (
          <img src="/threads-logo.png" alt="Threads" width={18} height={18} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'contain', display: 'block' }} />
        ),
      };
    }

    if (pLower.includes('facebook')) {
      return {
        name: 'Facebook',
        logo: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
            <circle cx="12" cy="12" r="12" fill="#1877F2" />
            <path fill="#FFFFFF" d="M15.5 12h-2.5v8h-3v-8h-2v-2.8h2v-1.8c0-2.3 1.4-3.6 3.5-3.6 1 0 1.9.08 2.1.1v2.5h-1.5c-1.1 0-1.4.5-1.4 1.3v1.5h2.8l-.5 2.8z"/>
          </svg>
        ),
      };
    }

    if (pLower.includes('x') || pLower.includes('twitter')) {
      return {
        name: 'X (Twitter)',
        logo: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" style={{ display: 'block' }}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
      };
    }

    return {
      name: 'Web Media',
      logo: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" style={{ display: 'block' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    };
  };

  const platformInfo = getPlatformInfo();

  // Clean title: If title is a raw URL or empty, don't show the ugly URL in the middle!
  const hasValidTitle = Boolean(title && !title.startsWith('http://') && !title.startsWith('https://'));
  const cleanTitle = hasValidTitle ? title : `${platformInfo.name} Media`;

  // Simulated playback timer for audio/preview
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !showVideoModal) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, showVideoModal]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remaining = Math.max(0, duration - currentTime);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (youtubeId || url.includes('.mp4') || mediaType === 'video') {
      setShowVideoModal(true);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '360px',
        borderRadius: '26px',
        padding: '6px',
        backgroundColor: 'var(--bg-color)',
        boxShadow: 'inset 3px 3px 8px var(--neumorph-dark), inset -3px -3px 8px var(--neumorph-light)',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        className="group"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#141414',
        }}
      >
        {/* Background Thumbnail / Artwork */}
        {effectiveThumbnail ? (
          <img
            src={effectiveThumbnail}
            alt={cleanTitle}
            onError={() => setImgError(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.8s cubic-bezier(0.2, 0, 0, 1)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            className="group-hover:scale-105"
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1a1a1a',
            }}
          >
            {isImage ? (
              <ImageIcon className="w-12 h-12 text-white/30" />
            ) : (
              <VideoIcon className="w-12 h-12 text-white/30" />
            )}
          </div>
        )}

        {/* Ambient Dark Gradient Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.05) 45%, rgba(0, 0, 0, 0.9) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── TOP CONTROLS BAR (Platform Name + Logo ONLY) ── */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            zIndex: 10,
          }}
        >
          {/* Platform / Source Pill with Exact Logo */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {platformInfo.logo}
            </div>
            <span
              style={{
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              {platformInfo.name}
            </span>
          </div>
        </div>

        {/* ── CENTER PLAY BUTTON (For Video/Audio) ── */}
        {!isImage && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={handlePlayToggle}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(14px)',
                border: '2px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              }}
              className="hover:scale-110 active:scale-95"
            >
              {isPlaying && !showVideoModal ? (
                <Pause className="w-6 h-6 fill-white text-white" />
              ) : (
                <Play className="w-6 h-6 fill-white text-white ml-0.5" />
              )}
            </button>
          </div>
        )}

        {/* ── BOTTOM CONTROLS & CLEAN LINK FOOTER ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            zIndex: 10,
          }}
        >
          {/* Media Title (Only shown if human-readable, not raw URL) */}
          {hasValidTitle && (
            <h3
              style={{
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 700,
                lineHeight: 1.3,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
              }}
            >
              {cleanTitle}
            </h3>
          )}

          {!isImage && (
            <>
              {/* Duration Timestamps */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(remaining)}</span>
              </div>

              {/* Progress Scrubber */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '4px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPercent = (e.clientX - rect.left) / rect.width;
                  setCurrentTime(Math.max(0, Math.min(duration, clickPercent * duration)));
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${progressPercent}%`,
                    backgroundColor: '#ffffff',
                    borderRadius: '9999px',
                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                    transition: isPlaying ? 'width 1s linear' : 'width 0.2s ease',
                  }}
                />
              </div>
            </>
          )}

          {/* Direct Link & Source Button Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '2px',
            }}
          >
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '0.68rem',
                maxWidth: '190px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'monospace',
              }}
            >
              {url}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.2rem 0.55rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
              }}
              className="hover:bg-black/70"
            >
              <span>Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* ── VIDEO PLAYER MODAL / EMBED (When user clicks Play) ── */}
        {showVideoModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {youtubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={cleanTitle}
                style={{ width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={url}
                controls
                autoPlay
                poster={effectiveThumbnail || undefined}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              >
                Your browser does not support the video tag.
              </video>
            )}

            {/* Close Video Button */}
            <button
              type="button"
              onClick={() => {
                setShowVideoModal(false);
                setIsPlaying(false);
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 40,
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaPlayerCard;
