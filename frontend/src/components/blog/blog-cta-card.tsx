import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BlogCtaCardProps {
  platformName?: string;
  customHeadline?: string;
}

export function BlogCtaCard({ platformName = 'Social Media', customHeadline }: BlogCtaCardProps) {
  return (
    <div
      className="nm-result-card"
      style={{
        margin: '2.75rem 0 1.5rem 0',
        padding: 'clamp(1.75rem, 4vw, 2.5rem)',
        borderRadius: '28px',
        backgroundColor: 'var(--bg-color)',
        boxShadow: '10px 10px 26px var(--neumorph-dark), -10px -10px 26px var(--neumorph-light)',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <h3
        style={{
          fontSize: 'clamp(1.35rem, 3.5vw, 1.75rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-color)',
          lineHeight: 1.25,
          marginTop: 0,
          marginBottom: '0.75rem',
        }}
      >
        {customHeadline || `Ready to Save ${platformName} Media in Original HD?`}
      </h3>

      <p
        style={{
          fontSize: '0.96rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          maxWidth: '640px',
        }}
      >
        Use AVERO&apos;s clean, zero-tracking web utility to download public Reels, videos, and photos without watermarks, compression degradation, or account sign-ups.
      </p>

      {/* Action CTA Button */}
      <div>
        <Link
          href="/"
          className="pill-btn-black"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.85rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            textDecoration: 'none',
            borderRadius: 'var(--radius-full)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <span>Open AVERO Downloader</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

