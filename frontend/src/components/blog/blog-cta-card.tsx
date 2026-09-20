import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';

interface BlogCtaCardProps {
  platformName?: string;
  customHeadline?: string;
}

export function BlogCtaCard({ platformName = 'Social Media', customHeadline }: BlogCtaCardProps) {
  return (
    <div
      className="nm-result-card"
      style={{
        margin: '2.5rem 0',
        padding: 'clamp(1.5rem, 4vw, 2.25rem)',
        borderRadius: '24px',
        backgroundColor: 'var(--bg-color)',
        boxShadow: 'var(--neumorph-raised-lg)',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle decorative background accent */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225, 48, 108, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', boxShadow: '2px 2px 5px var(--neumorph-dark), -2px -2px 5px var(--neumorph-light)', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-color)', marginBottom: '1rem' }}>
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>UNIFIED MEDIA DOWNLOADER</span>
      </div>

      <h3
        style={{
          fontSize: 'clamp(1.35rem, 3.5vw, 1.75rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-color)',
          lineHeight: 1.25,
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

      {/* Value Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-color)', fontWeight: 600 }}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>Zero Watermarks</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-color)', fontWeight: 600 }}>
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Original High Bitrate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-color)', fontWeight: 600 }}>
          <ShieldCheck className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <span>100% Free &amp; Private</span>
        </div>
      </div>

      {/* Action CTA Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Works instantly on iPhone, Android &amp; PC
        </span>
      </div>
    </div>
  );
}
