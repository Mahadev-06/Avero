"use client";

import Link from 'next/link';
import { QueueManager } from '@/components/media/queue-manager';
import { useQueueStore } from '@/stores/queue-store';
import { ArrowLeft } from 'lucide-react';

export default function QueuePage() {
  const items = useQueueStore((state) => state.items);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Top Left Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.75rem' }}>
        <Link href="/">
          <button
            type="button"
            className="pill-btn"
            style={{
              padding: '0.45rem 1.15rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-color)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Home</span>
          </button>
        </Link>
      </div>

      {/* Editorial Header Section */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 2.5rem auto' }}>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-balance" style={{ letterSpacing: '-0.02em', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
          Download Queue ({items.length})
        </h1>

        <p className="text-muted text-pretty" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
          Build a batch queue of videos, audio streams, and direct media URLs to download them all in one smooth workflow.
        </p>
      </div>

      <QueueManager />
    </div>
  );
}
