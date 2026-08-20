import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'About Us — AVERO Video & Image Downloader',
  description: 'AVERO is a fast, free, and reliable online video and image downloader designed to help users save content from YouTube, TikTok, Instagram, Pinterest, Facebook, and X.',
};

export default function AboutPage() {
  return (
    <div style={{ paddingTop: '8.5rem', paddingBottom: '5.5rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>
        
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
            fontSize: 'clamp(2.2rem, 4vw, 3rem)',
            fontWeight: 850,
            letterSpacing: '-0.03em',
            color: 'var(--text-color)',
            marginBottom: '2rem',
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
    </div>
  );
}
