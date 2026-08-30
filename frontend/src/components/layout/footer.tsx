"use client";

import Link from 'next/link';
import { AveroLogo } from '@/components/ui/avero-logo';
import { WordmarkFooter } from '@/registry/ruixenui/wordmark-footer';

export function Footer() {
  return (
    <footer
      style={{
        boxShadow: 'var(--nm-inset-sm)',
        marginTop: 'auto',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        borderTop: '1px solid rgba(255, 255, 255, 0.35)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="container" style={{ padding: '3.5rem 1.5rem 1.5rem 1.5rem', width: '100%' }}>
        <div className="footer-content" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '3rem' }}>
          
          {/* Left Side: Brand Logo, Description, Developer & Copyright Info */}
          <div style={{ maxWidth: '360px', flexShrink: 0 }}>
            <div style={{ marginBottom: '1.25rem' }}>
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
                marginBottom: '1.15rem',
              }}
            >
              Minimal, policy-compliant media utility platform. High-performance processing with zero bloat.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '1rem' }}>
              <div>
                <a
                  href="https://www.mahadevpatro.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-foreground transition-colors"
                  style={{
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: 'var(--text-color)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>Meet the Developer</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>↗</span>
                </a>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>
                © {new Date().getFullYear()} AVERO. All-in-One Media Downloader.
              </div>
            </div>
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
                  <Link href="/#faq" className="text-muted hover:text-foreground transition-colors" style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    FAQ &amp; Questions
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
                Legal &amp; Compliance
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

      {/* Interactive Giant Metallic Wordmark Anchored to Very Bottom */}
      <WordmarkFooter />
    </footer>
  );
}

export default Footer;
