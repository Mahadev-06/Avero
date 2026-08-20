"use client";

import { useState } from 'react';
import { useQueueStore, QueueItem } from '@/stores/queue-store';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { triggerFileDownload } from '@/lib/utils';
import { Download, Trash2, Layers, Check, AlertCircle, Clock, Plus, Loader2, X } from 'lucide-react';

function getQueueItemPlatformIcon(url: string, platformName?: string) {
  const u = (url || '').toLowerCase();
  const p = (platformName || '').toLowerCase();

  // YouTube
  if (u.includes('youtu') || p.includes('youtube')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
        <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432"/>
      </svg>
    );
  }

  // Instagram
  if (u.includes('instagram.com') || u.includes('instagr.am') || p.includes('instagram')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="igQueueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD521" />
            <stop offset="25%" stopColor="#F50000" />
            <stop offset="50%" stopColor="#B900B4" />
            <stop offset="100%" stopColor="#7E00FF" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#igQueueGrad)"/>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none"/>
        <circle cx="12" cy="12" r="3.8" stroke="#FFFFFF" strokeWidth="1.8" fill="none"/>
        <circle cx="16.5" cy="7.5" r="1.1" fill="#FFFFFF"/>
      </svg>
    );
  }

  // TikTok
  if (u.includes('tiktok.com') || p.includes('tiktok')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#000000" />
        <path fill="#25F4EE" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.55-1.24 2.55.05.9.6 1.75 1.41 2.16.85.45 1.92.42 2.73-.06.77-.45 1.28-1.29 1.34-2.19.04-3.58.02-7.16.02-10.74z"/>
        <path fill="#FE2C55" d="M11.5 1.5c1.2 0 2.4 0 3.6 0 .07 1.4.58 2.8 1.6 3.8 1 1 2.4 1.5 3.8 1.6v3.6c-1.3-.05-2.6-.32-3.8-.88-.5-.23-1-.53-1.4-.84-.01 2.6.01 5.2-.02 7.8-.07 1.2-.48 2.5-1.2 3.5-1.2 1.7-3.2 2.8-5.3 2.9-1.3.07-2.5-.28-3.6-.92-1.8-1-3.1-3-3.3-5.1-.02-.4-.03-.9-.01-1.3.16-1.7 1-3.3 2.3-4.4 1.5-1.3 3.6-1.9 5.5-1.5.02 1.3-.04 2.6-.04 4-.9-.28-1.9-.2-2.7.33-.7.5-1.2 1.4-1.1 2.3.04.8.5 1.5 1.2 1.9.7.4 1.7.38 2.4-.05.7-.4 1.1-1.1 1.2-1.9.04-3.2.02-6.4.02-9.6z" opacity="0.85" />
        <path fill="#FFFFFF" d="M12 1c1.2 0 2.4 0 3.6 0 .07 1.4.58 2.8 1.6 3.8 1 1 2.4 1.5 3.8 1.6v3.6c-1.3-.05-2.6-.32-3.8-.88-.5-.23-1-.53-1.4-.84-.01 2.6.01 5.2-.02 7.8-.07 1.2-.48 2.5-1.2 3.5-1.2 1.7-3.2 2.8-5.3 2.9-1.3.07-2.5-.28-3.6-.92-1.8-1-3.1-3-3.3-5.1-.02-.4-.03-.9-.01-1.3.16-1.7 1-3.3 2.3-4.4 1.5-1.3 3.6-1.9 5.5-1.5.02 1.3-.04 2.6-.04 4-.9-.28-1.9-.2-2.7.33-.7.5-1.2 1.4-1.1 2.3.04.8.5 1.5 1.2 1.9.7.4 1.7.38 2.4-.05.7-.4 1.1-1.1 1.2-1.9.04-3.2.02-6.4.02-9.6z"/>
      </svg>
    );
  }

  // Pinterest
  if (u.includes('pinterest.com') || u.includes('pin.it') || u.includes('pinimg') || p.includes('pinterest')) {
    return (
      <img
        src="/pinterest-logo.png"
        alt="Pinterest"
        width={24}
        height={24}
        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'contain', display: 'block' }}
      />
    );
  }

  // Reddit
  if (u.includes('reddit.com') || u.includes('redd.it') || p.includes('reddit')) {
    return (
      <img
        src="/reddit-logo.png"
        alt="Reddit"
        width={24}
        height={24}
        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'contain', display: 'block' }}
      />
    );
  }

  // Threads
  if (u.includes('threads.net') || u.includes('threads.com') || p.includes('threads')) {
    return (
      <img
        src="/threads-logo.png"
        alt="Threads"
        width={24}
        height={24}
        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'contain', display: 'block' }}
      />
    );
  }

  // Facebook
  if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com') || p.includes('facebook')) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path fill="#FFFFFF" d="M15.5 12h-2.5v8h-3v-8h-2v-2.8h2v-1.8c0-2.3 1.4-3.6 3.5-3.6 1 0 1.9.08 2.1.1v2.5h-1.5c-1.1 0-1.4.5-1.4 1.3v1.5h2.8l-.5 2.8z"/>
      </svg>
    );
  }

  // X / Twitter
  if (u.includes('x.com') || u.includes('twitter.com') || u.includes('t.co') || p.includes('x') || p.includes('twitter')) {
    return (
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src="/x-logo.png"
          alt="X"
          width={15}
          height={15}
          style={{ width: '15px', height: '15px', objectFit: 'contain', display: 'block' }}
        />
      </div>
    );
  }

  // Default Direct Media
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#10B981" />
      <path fill="#FFFFFF" d="M12 16.5l4.5-4.5h-3V7.5h-3v4.5h-3l4.5 4.5zm-6 2h12v1.8H6v-1.8z"/>
    </svg>
  );
}

export function QueueManager() {
  const { items, clearCompleted, clearAll, removeItem, updateItem, addItems } = useQueueStore();
  const [newUrlInput, setNewUrlInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | null>(null);

  const completedItems = items.filter((i) => i.status === 'completed');
  const failedItems = items.filter((i) => i.status === 'failed');

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = newUrlInput.trim();
    if (!raw) return;

    setIsAdding(true);
    try {
      // Split by whitespace or newlines for multi-link paste
      const urls = raw.split(/\s+/).filter((u) => u.startsWith('http://') || u.startsWith('https://'));
      if (urls.length > 0) {
        await addItems(urls);
      } else {
        await addItems([raw]);
      }
      setNewUrlInput('');
    } catch (err) {
      console.error('Failed to add to queue', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartDownload = async (item: QueueItem) => {
    updateItem(item.id, { status: 'processing', progress: 5 });

    try {
      const { job_id } = await apiClient.startDownload(item.url, 'mp4', 'best');

      const sub = apiClient.subscribeProgress(job_id, (p) => {
        updateItem(item.id, { progress: Math.min(Math.round(p.percent), 99) });
      });

      const finalProgress = await sub.done;

      if (finalProgress.status === 'COMPLETED') {
        updateItem(item.id, { status: 'completed', progress: 100 });
        const fileUrl = apiClient.getDownloadFileUrl(job_id);
        const cleanTitle = (item.title || 'media_download').replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
        await triggerFileDownload(fileUrl, `${cleanTitle}.mp4`);
      } else {
        updateItem(item.id, { status: 'failed', error: 'Download processing failed' });
      }
    } catch (err: unknown) {
      console.error('Queue download error:', err);
      updateItem(item.id, { status: 'failed', error: 'Unable to process stream' });
    }
  };

  const handleDownloadAll = async () => {
    if (isBatchDownloading || items.length === 0) return;

    setIsBatchDownloading(true);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'completed') continue;
      setCurrentBatchIndex(i);
      await handleStartDownload(item);
    }
    setCurrentBatchIndex(null);
    setIsBatchDownloading(false);
  };

  // 1. EMPTY STATE: Editorial Aesthetic Card
  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'center' }}>
        <Card
          className="card-editorial"
          style={{
            padding: '3.5rem 2rem',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--card-bg)',
            border: '1.5px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Glowing Icon Badge */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-subtle)',
              border: '2px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            }}
          >
            <Layers className="w-8 h-8 text-muted-foreground" />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
            Your queue is empty
          </h2>

          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6, marginBottom: '2rem' }}>
            Paste video or audio links below to queue multiple files for smooth batch downloading.
          </p>

          {/* Quick Add Form inside Empty State */}
          <form onSubmit={handleAddLink} style={{ width: '100%', maxWidth: '520px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-color)',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.4rem 0.35rem 1.25rem',
                boxShadow: 'var(--nm-inset-sm)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                gap: '0.5rem',
              }}
            >
              <input
                type="text"
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                placeholder="Paste video or audio link here..."
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                  outline: 'none',
                  padding: '0.5rem 0',
                  border: 'none',
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setNewUrlInput(text.trim());
                  } catch (err) {
                    console.error('Paste error', err);
                  }
                }}
                className="pill-btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Paste
              </button>
              <button
                type="submit"
                disabled={isAdding || !newUrlInput.trim()}
                className="pill-btn-black"
                style={{
                  padding: '0.55rem 1.35rem',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: isAdding || !newUrlInput.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Add</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // 2. QUEUE HAS ITEMS: Aesthetic Editorial Batch Control Bar & Item Cards
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Batch Control Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem 1.5rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--nm-raised-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            className="pill-btn"
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              padding: '0.45rem 1.15rem',
              color: 'var(--text-color)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              cursor: 'default',
              pointerEvents: 'none',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '22px',
                height: '22px',
                padding: '0 0.35rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-accent-500)',
                color: '#000000',
                fontSize: '0.75rem',
                fontWeight: 900,
              }}
            >
              {items.length}
            </span>
            <span>Queued Items</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isBatchDownloading || items.every((i) => i.status === 'completed')}
              className="pill-btn"
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: isBatchDownloading || items.every((i) => i.status === 'completed') ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-color)',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid rgba(255, 255, 255, 0.75)',
                boxShadow: '3px 3px 8px var(--neumorph-dark), -3px -3px 8px var(--neumorph-light)',
              }}
            >
              {isBatchDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>
                    Downloading {currentBatchIndex !== null ? `${currentBatchIndex + 1}/${items.length}` : '...'}
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

          <button
            type="button"
            onClick={clearAll}
            className="pill-btn"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#ef4444',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className={showAddForm ? "pill-btn" : "pill-btn-black"}
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {showAddForm ? (
              <span>Close Add Bar</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Links</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Inline Link Adder in Queue */}
      {showAddForm && (
        <form
          onSubmit={handleAddLink}
          style={{
            marginBottom: '1.75rem',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid rgba(255, 255, 255, 0.65)',
            boxShadow: 'var(--nm-raised-md)',
          }}
        >
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Paste Video, Photo, or Audio Link(s) to Queue</span>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: '240px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-color)',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.5rem 0.35rem 1.25rem',
                boxShadow: 'var(--nm-inset-sm)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                gap: '0.45rem',
              }}
            >
              <input
                type="text"
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                placeholder="Paste YouTube, Instagram, TikTok, Pinterest, Facebook, X, or Direct URL..."
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                  outline: 'none',
                  border: 'none',
                  padding: '0.45rem 0',
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setNewUrlInput(text.trim());
                  } catch (err) {
                    console.error('Clipboard paste failed', err);
                  }
                }}
                className="pill-btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Paste
              </button>
            </div>

            <button
              type="submit"
              disabled={isAdding || !newUrlInput.trim()}
              className="pill-btn-black"
              style={{
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: isAdding || !newUrlInput.trim() ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0,
              }}
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Add to Queue</span>
            </button>
          </div>
        </form>
      )}

      {/* Queue Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {items.map((item) => {
          const isYouTube = item.url.includes('youtu');

          return (
            <Card
              key={item.id}
              className="card-editorial"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--card-bg)',
                boxShadow: 'var(--nm-raised-md)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                gap: '1.25rem',
                overflow: 'visible',
              }}
            >
              {/* Left: Platform Icon Badge & Title Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {getQueueItemPlatformIcon(item.url, item.platform)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: 'var(--text-color)',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={item.title || item.url}
                  >
                    {item.title || item.url}
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.2rem',
                      fontWeight: 600,
                      maxWidth: '380px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.url}
                  </div>
                </div>
              </div>

              {/* Middle: Progress Bar / Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '160px', justifyContent: 'flex-end' }}>
                {item.status === 'processing' && (
                  <div style={{ width: '140px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                      <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Loader2 className="w-3 h-3 animate-spin" /> Processing
                      </span>
                      <span className="tabular-nums">{item.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.progress}%`, height: '100%', backgroundColor: '#16a34a', transition: 'width 0.2s ease' }} />
                    </div>
                  </div>
                )}

                {item.status === 'completed' && (
                  <div
                    title="Ready to download"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e18',
                      color: '#16a34a',
                      border: '1px solid #22c55e40',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--neumorph-shadow)',
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                )}

                {item.status === 'failed' && (
                  <div
                    title="Download failed"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#ef444418',
                      color: '#ef4444',
                      border: '1px solid #ef444440',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--neumorph-shadow)',
                    }}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}

                {item.status === 'pending' && (
                  <div
                    title="Queued"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--neumorph-shadow)',
                    }}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Right: Actions (Start & Remove Buttons) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {item.status !== 'completed' && (
                  <button
                    type="button"
                    title="Start download"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--neumorph-primary-shadow)',
                    }}
                    onClick={() => handleStartDownload(item)}
                    disabled={item.status === 'processing'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  title="Remove from queue"
                  aria-label="Remove from queue"
                  className="pill-btn"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1px solid #ef444435',
                    backgroundColor: '#ef444410',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    flexShrink: 0,
                    boxShadow: 'var(--neumorph-shadow)',
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
