'use client';

import React from 'react';
import { SearchResult } from '@/lib/api-client';
import { SearchCard } from './search-card';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  onSelectMedia?: (url: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, onSelectMedia }) => {
  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          width: '100%',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              height: '320px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-neutral-200)',
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-neutral-500)' }}>
        <p style={{ fontSize: 'var(--font-size-lg)' }}>No results found.</p>
        <p style={{ fontSize: 'var(--font-size-sm)' }}>Try searching for a different keyword or public media title.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%',
      }}
    >
      {results.map((item) => (
        <SearchCard key={item.id} result={item} onSelectMedia={onSelectMedia} />
      ))}
    </div>
  );
};
