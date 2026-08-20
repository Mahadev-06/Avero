import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy — AVERO Video & Image Downloader',
  description: 'Learn about how AVERO uses minimal browser storage solely for functional preferences with zero third-party tracking.',
};

export default function CookiePolicyPage() {
  return (
    <div style={{ paddingTop: '8.5rem', paddingBottom: '6rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:underline">
            Home
          </Link>
          <span>&gt;</span>
          <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>Cookie Policy</span>
        </div>

        {/* Page Title */}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.2rem, 4vw, 3rem)',
            fontWeight: 850,
            letterSpacing: '-0.03em',
            color: 'var(--text-color)',
            marginBottom: '0.5rem',
          }}
        >
          Cookie Policy
        </h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2.25rem', fontWeight: 500 }}>
          Effective Date: August 2026 • Browser Storage &amp; Cookie Disclosure
        </p>

        {/* Content Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-color)',
            border: '1px solid rgba(255, 255, 255, 0.65)',
            borderRadius: '24px',
            padding: 'clamp(1.75rem, 3.5vw, 2.75rem)',
            boxShadow: 'var(--nm-raised-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            fontSize: '0.98rem',
            lineHeight: 1.75,
            color: 'var(--text-muted)',
          }}
        >
          {/* 1. What are Cookies */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              1. What Are Cookies and Local Storage?
            </h2>
            <p>
              Cookies and browser local storage are small text fragments stored on your device by your web browser when you visit a website. They are commonly used to remember preferences, facilitate navigation, and improve web performance.
            </p>
          </section>

          {/* 2. How AVERO Uses Browser Storage */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              2. How AVERO Uses Local Storage
            </h2>
            <p style={{ marginBottom: '0.75rem' }}>
              <strong>AVERO does not use third-party tracking cookies or advertising pixels.</strong> We only utilize client-side browser storage (such as <code>localStorage</code>) for necessary functional features:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', listStyleType: 'disc' }}>
              <li><strong>Download Queue Persistence:</strong> Saving the links added to your active batch queue locally on your machine so they persist when you refresh or navigate across pages.</li>
              <li><strong>UI Preferences:</strong> Remembering your visual display choices and functional interface settings.</li>
            </ul>
          </section>

          {/* 3. Managing Cookies */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              3. Managing Your Browser Storage
            </h2>
            <p>
              You can easily clear your browser cache and local storage at any time through your browser&apos;s settings. Doing so will simply reset your active download queue items and return the application to its default state.
            </p>
          </section>

          {/* 4. Related Policies */}
          <section style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <p style={{ fontSize: '0.92rem' }}>
              For complete details on our data protection commitments, please read our{' '}
              <Link href="/privacy" style={{ color: 'var(--color-accent-500)', fontWeight: 700, textDecoration: 'underline' }}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" style={{ color: 'var(--color-accent-500)', fontWeight: 700, textDecoration: 'underline' }}>
                Terms of Service
              </Link>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
