"use client";

import { useState } from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';

interface MediaPreviewProps {
  url: string;
  thumbnailUrl?: string;
  title?: string;
  platform?: string;
  mediaType?: string;
}

export function MediaPreview({ url, thumbnailUrl, title, platform, mediaType }: MediaPreviewProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Robust YouTube Video ID extractor (supports watch?v=, Shorts, youtu.be, embed)
  const getYouTubeId = (link: string) => {
    const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const isImage = mediaType === 'image' || platform === 'pinterest' || anyImageExt(url, thumbnailUrl);
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

  function anyImageExt(...links: (string | undefined | null)[]) {
    return links.some((l) => l && (l.includes('pinimg.com') || l.includes('twimg.com') || l.includes('i.redd.it') || ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some((ext) => l.toLowerCase().includes(ext))));
  }

  // If this is an image/photo, render crisp image view directly (No play button overlay)
  if (isImage) {
    return (
      <div style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255, 255, 255, 0.4)', position: 'relative' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
          }}
        >
          {effectiveThumbnail ? (
            <img
              src={effectiveThumbnail}
              alt={title || 'Image preview'}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-color)',
                  boxShadow: '3px 3px 8px var(--neumorph-dark), -3px -3px 8px var(--neumorph-light)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImageIcon className="w-7 h-7 text-amber-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: '#0b0b0d', marginBottom: '1rem', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {/* 1. Active Video Player View (When user clicks Play or iframe is ready) */}
      {showPlayer ? (
        youtubeId ? (
          <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={title || 'YouTube video player'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            src={url}
            controls
            autoPlay
            poster={effectiveThumbnail || undefined}
            style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', backgroundColor: '#000000' }}
          >
            Your browser does not support the video tag.
          </video>
        )
      ) : (
        /* 2. High-Res Video Poster with Central Play Button Overlay */
        <div
          onClick={() => setShowPlayer(true)}
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            backgroundColor: '#111111',
          }}
        >
          {effectiveThumbnail ? (
            <img
              src={effectiveThumbnail}
              alt={title || 'Media poster'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Video className="w-7 h-7 text-white/50" />
              </div>
            </div>
          )}

          {/* Glowing Play Circle Button */}
          <div
            style={{
              position: 'absolute',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              transition: 'transform 0.2s ease',
            }}
          >
            ▶
          </div>
        </div>
      )}
    </div>
  );
}
