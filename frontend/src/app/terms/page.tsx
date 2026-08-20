import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — AVERO Video & Image Downloader',
  description: 'Terms and conditions governing the use of AVERO video and image downloading utilities.',
};

export default function TermsPage() {
  return (
    <div style={{ paddingTop: 'clamp(5.5rem, 8vw, 8.5rem)', paddingBottom: 'clamp(3rem, 5vw, 6rem)', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:underline">
            Home
          </Link>
          <span>&gt;</span>
          <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>Terms of Service</span>
        </div>

        {/* Page Title */}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
            fontWeight: 850,
            letterSpacing: '-0.03em',
            color: 'var(--text-color)',
            marginBottom: '0.5rem',
          }}
        >
          Terms of Service
        </h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2.25rem', fontWeight: 500 }}>
          Effective Date: August 2026 • Terms &amp; Conditions
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
          {/* 1. Acceptance */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or utilizing the services provided by <strong>AVERO</strong>, you agree to be bound by these Terms of Service. If you do not agree with any portion of these terms, please discontinue use of the platform immediately.
            </p>
          </section>

          {/* 2. Permitted Use */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              2. Permitted Use &amp; User Responsibilities
            </h2>
            <p style={{ marginBottom: '0.75rem' }}>
              AVERO is provided strictly as a technical conversion and downloading utility. You agree to use the service in compliance with all applicable local, national, and international laws.
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', listStyleType: 'disc' }}>
              <li>You may only download content for which you have explicit rights, license, copyright ownership, or express permission from the copyright owner for offline personal use.</li>
              <li>You agree not to use AVERO to distribute, sell, or commercially exploit copyrighted material without authorization.</li>
              <li>You agree not to engage in automated scraping, abuse, or intentional denial-of-service attacks against AVERO infrastructure.</li>
            </ul>
          </section>

          {/* 3. Third-Party Platforms */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              3. Third-Party Platforms &amp; Disclaimers
            </h2>
            <p>
              AVERO is an independent utility and is not affiliated with, sponsored by, or endorsed by YouTube, TikTok, Instagram, Pinterest, Meta, Facebook, X (Twitter), or any of their parent corporations. All trademarks, service marks, and logos referenced belong to their respective owners.
            </p>
          </section>

          {/* 4. Limitation of Liability */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              4. Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <p>
              AVERO is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. AVERO does not warrant that the service will be uninterrupted, error-free, or compatible with every third-party URL at all times. Under no circumstances shall AVERO be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use this service.
            </p>
          </section>

          {/* 5. DMCA and Intellectual Property */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              5. Copyright &amp; DMCA Compliance
            </h2>
            <p>
              AVERO strongly respects intellectual property rights. If you believe your copyrighted material is being accessed without permission, please consult our{' '}
              <Link href="/dmca" style={{ color: 'var(--color-accent-500)', fontWeight: 700, textDecoration: 'underline' }}>
                DMCA Notice
              </Link>{' '}
              to submit a takedown request.
            </p>
          </section>

          {/* 6. Modifications */}
          <section style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              6. Changes to Terms
            </h2>
            <p>
              We reserve the right to revise or modify these Terms of Service at any time. Continued use of the platform following the posting of any updates constitutes full acceptance of those changes.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
