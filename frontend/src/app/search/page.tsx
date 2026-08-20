"use client";

import { LiveSearch } from '@/components/search/live-search';
import { Badge } from '@/components/ui/badge';

export default function SearchPage() {
  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 2.5rem auto' }}>
        <Badge variant="outline" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Media Search Engine
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-balance" style={{ letterSpacing: '-0.02em', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
          Search & Discover YouTube Media
        </h1>
        <p className="text-muted text-pretty" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
          Search videos, music, and podcasts directly in AVERO. Copy links or download them in high resolution.
        </p>
      </div>

      <LiveSearch />
    </div>
  );
}
