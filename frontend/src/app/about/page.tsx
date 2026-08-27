import Link from 'next/link';
import { ArrowLeft, Globe, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'About Us — AVERO Video & Image Downloader',
  description: 'AVERO is a fast, free, and reliable online video and image downloader designed to help users save content from YouTube, TikTok, Instagram, Pinterest, Facebook, and X.',
};

export default function AboutPage() {
  return (
    <div style={{ paddingTop: 'clamp(5.5rem, 8vw, 8.5rem)', paddingBottom: 'clamp(3rem, 5vw, 5.5rem)', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div>
          {/* Breadcrumb Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>About Us</span>
          </div>

          {/* Page Title */}
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
              fontWeight: 850,
              letterSpacing: '-0.03em',
              color: 'var(--text-color)',
              marginBottom: '1.75rem',
            }}
          >
            About Us
          </h1>

          {/* Main Content Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              borderRadius: '24px',
              padding: 'clamp(1.75rem, 3.5vw, 2.75rem)',
              boxShadow: 'var(--nm-raised-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.35rem',
              fontSize: '1rem',
              lineHeight: 1.75,
              color: 'var(--text-muted)',
            }}
          >
            <p>
              <strong>AVERO</strong> is a fast, free, and reliable online video and image downloader designed to help users save their favorite content from the internet with ease. With just a few clicks, you can easily download content from popular platforms such as YouTube, TikTok, Instagram, Pinterest, Facebook, and X.
            </p>

            <p>
              We&apos;re here to make video, image, and music saving easy, secure, and accessible for everyone. That&apos;s why we&apos;ve built a platform that works across all devices and browsers, allowing you to download videos, photos, and music in high quality, anytime, anywhere. Our service supports a wide range of formats and resolutions, so you can save exactly what you need, the way you want it.
            </p>

            <p>
              We are committed to maintaining a secure, ad-light platform that respects privacy. AVERO is continuously updated to support the latest features from your favorite social media sites and to ensure compatibility across all devices and browsers.
            </p>

            <div style={{ marginTop: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)' }}>
                AVERO — Your Media, Your Way.
              </p>
            </div>
          </div>
        </div>

        {/* Meet the Developer Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-color)',
            border: '1px solid rgba(255, 255, 255, 0.65)',
            borderRadius: '24px',
            padding: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            boxShadow: 'var(--nm-raised-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)' }}>
              MEET THE DEVELOPER
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Creator &amp; Software Architect
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '22px',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)',
                border: '2px solid rgba(255, 255, 255, 0.7)',
                backgroundColor: 'var(--bg-color)',
              }}
            >
              <img
                src="https://mahadevpatro.dev/me.webp"
                alt="Mahadev Patro"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 850, color: 'var(--text-color)', margin: 0, letterSpacing: '-0.02em' }}>
                  Mahadev Patro
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--color-accent-500)',
                    backgroundColor: 'rgba(254, 198, 0, 0.12)',
                    padding: '0.15rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(254, 198, 0, 0.25)',
                  }}
                >
                  Full-Stack &amp; AI Engineer
                </span>
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Hi, I&apos;m Mahadev Patro — the creator of AVERO. I build AI-powered web applications, high-performance distributed systems, modern SaaS platforms, and custom software.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href="https://www.mahadevpatro.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="pill-btn-black"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.15rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 750,
                  textDecoration: 'none',
                }}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Visit My Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <a
                href="https://github.com/Mahadev-06"
                target="_blank"
                rel="noopener noreferrer"
                className="pill-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: 'var(--text-color)',
                }}
              >
                <span>GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>

              <a
                href="https://www.linkedin.com/in/mahadev-patro-a76267377"
                target="_blank"
                rel="noopener noreferrer"
                className="pill-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: 'var(--text-color)',
                }}
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Available for freelance &amp; custom software
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
