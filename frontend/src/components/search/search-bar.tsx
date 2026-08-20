'use client';

import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, platform: string) => void;
  initialQuery?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [platform, setPlatform] = useState('youtube');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), platform);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: '0.75rem',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search public YouTube media by keyword or title..."
        style={{
          flex: 1,
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-300)',
          backgroundColor: 'var(--color-neutral-50)',
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-neutral-900)',
          outline: 'none',
        }}
      />
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-300)',
          backgroundColor: 'var(--color-neutral-50)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-medium)',
        }}
      >
        <option value="youtube">YouTube</option>
      </select>
      <button
        type="submit"
        className="pill-btn-black"
        style={{
          padding: '0.85rem 1.75rem',
          fontSize: 'var(--font-size-sm)',
          cursor: 'pointer',
        }}
      >
        Search
      </button>
    </form>
  );
};
