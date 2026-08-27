import Link from 'next/link';
import { AveroLogo } from '@/components/ui/avero-logo';

export function Footer() {
  return (
    <footer
      style={{
        boxShadow: 'var(--nm-inset-sm)',
        marginTop: 'auto',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        borderTop: '1px solid rgba(255, 255, 255, 0.35)',
      }}
    >
      <div className="container" style={{ padding: '3.5rem 1.5rem 2.5rem 1.5rem' }}>
        <div className="footer-content" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '3rem' }}>
          
          {/* Left Side: Brand Logo & Description */}
          <div style={{ maxWidth: '340px', flexShrink: 0 }}>
            <div style={{ marginBottom: '1.35rem' }}>
              <AveroLogo height={26} />
            </div>
            <p
              style={{
                fontSize: '0.88rem',
                lineHeight: 1.65,
                color: 'var(--text-muted)',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              Minimal, policy-compliant media utility platform. High-performance processing with zero bloat.
            </p>
          </div>

          {/* Right Side: 3 Columns Always Placed Side-by-Side on the Right Edge */}
          <div className="footer-links-wrap" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '3.5rem', marginLeft: 'auto' }}>
            
            {/* Column 1: Supported Formats & Media */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                }}
              >
                Media Downloader
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <li>
                  <Link href="/" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Facebook Videos
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Instagram Reels
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    TikTok &amp; Reels
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Pinterest &amp; Reddit
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Threads &amp; X / Twitter
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Platform Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                }}
              >
                Platform
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <li>
                  <Link href="/" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    About Platform
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.mahadevpatro.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-foreground transition-colors"
                    style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>Meet the Developer</span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>↗</span>
                  </a>
                </li>
                <li>
                  <Link href="/#faq" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    FAQ & Questions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal & Compliance */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                }}
              >
                Legal & Compliance
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <li>
                  <Link href="/privacy" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/dmca" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    DMCA Notice
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div
        style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '1.25rem 1rem',
          textAlign: 'center',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0.45rem',
        }}
      >
        <span>© {new Date().getFullYear()} AVERO. All-in-One Media Downloader.</span>
        <span>•</span>
        <span>
          Crafted by{' '}
          <a
            href="https://www.mahadevpatro.dev/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-color)',
              fontWeight: 750,
              textDecoration: 'none',
              borderBottom: '1px dotted var(--color-accent-500)',
            }}
            className="hover:underline"
          >
            Mahadev Patro ↗
          </a>
        </span>
      </div>
    </footer>
  );
}
