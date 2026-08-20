"use client";

import { useState, useCallback } from 'react';
import { apiClient, SearchResult } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Download, Copy, Check, Play } from 'lucide-react';

interface LiveSearchProps {
  onSelectVideoForDownload?: (url: string) => void;
}

function formatDurationSeconds(sec?: number): string {
  if (!sec) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function LiveSearch({ onSelectVideoForDownload }: LiveSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await apiClient.search(query.trim(), 'youtube', 1);
      setResults(res.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
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

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', marginBottom: '2rem' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--card-bg)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '0.4rem 0.5rem 0.4rem 1.25rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Search className="w-5 h-5 text-muted-foreground shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube videos, songs, podcasts..."
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              fontSize: '1.05rem',
              fontWeight: 500,
              color: 'var(--text-color)',
              outline: 'none',
              padding: '0.65rem 0',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.6rem 1.35rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--text-color)',
              color: 'var(--bg-color)',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              minHeight: '42px',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Searching...
              </>
            ) : (
              <>
                Search ➔
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 4, 4].map((i) => (
            <Card key={`skeleton-${i}`} className="card-editorial animate-pulse" style={{ height: '140px' }}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', height: '100%', borderRadius: 'var(--radius-md)' }} />
            </Card>
          ))}
        </div>
      )}

      {/* Empty / Initial State */}
      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)' }}>No video results found</h3>
          <p style={{ fontSize: '0.88rem' }}>Try searching with different keywords like "lofi beats" or "podcast".</p>
        </div>
      )}

      {/* Live Search Result Cards Grid */}
      {!loading && results.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <Badge variant="outline" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              YouTube Live Search Results ({results.length})
            </Badge>
            <span className="text-xs text-muted">Click Download Options to process file</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((res) => (
              <Card
                key={res.id}
                className="card-editorial"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '1rem',
                  padding: '1rem',
                  alignItems: 'flex-start',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--card-bg)',
                  border: '1.5px solid var(--border-color)',
                  overflow: 'visible',
                }}
              >
                {/* Thumbnail Box */}
                <div style={{ position: 'relative', width: '130px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={res.thumbnail_url}
                    alt={res.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    className="tabular-nums"
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.82)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.35rem',
                      borderRadius: '4px',
                    }}
                  >
                    {formatDurationSeconds(res.duration)}
                  </div>
                </div>

                {/* Video Info & Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <h4
                    className="text-balance"
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      lineHeight: 1.3,
                      color: 'var(--text-color)',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={res.title}
                  >
                    {res.title}
                  </h4>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
                    {res.channel}
                  </div>

                  {/* Button Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                    
                    {onSelectVideoForDownload ? (
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '0.3rem 0.65rem',
                          minHeight: '34px',
                        }}
                        onClick={() => onSelectVideoForDownload(res.url)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Download
                      </Button>
                    ) : (
                      <a href={res.url} target="_blank" rel="noopener noreferrer">
                        <Button
                          size="sm"
                          variant="outline"
                          style={{
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            padding: '0.3rem 0.65rem',
                            minHeight: '34px',
                          }}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" /> Open Link
                        </Button>
                      </a>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', minHeight: '34px' }}
                      onClick={() => handleCopyLink(res.id, res.url)}
                    >
                      {copiedId === res.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                        </>
                      )}
                    </Button>

                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
