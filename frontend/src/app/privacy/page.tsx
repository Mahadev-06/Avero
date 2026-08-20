import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — AVERO Video & Image Downloader',
  description: 'Learn how AVERO protects your privacy with our zero-log architecture, no-tracking commitment, and secure media processing.',
};

export default function PrivacyPage() {
  return (
    <div style={{ paddingTop: '8.5rem', paddingBottom: '6rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:underline">
            Home
          </Link>
          <span>&gt;</span>
          <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>Privacy Policy</span>
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
          Privacy Policy
        </h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2.25rem', fontWeight: 500 }}>
          Effective Date: August 2026 • Last Updated: August 2026
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
          {/* Intro */}
          <section>
            <p>
              At <strong>AVERO</strong>, we prioritize your privacy and are committed to transparency. This Privacy Policy outlines how AVERO operates as an online media utility, what data is processed when you use our services to download videos, photos, or audio from supported platforms (such as YouTube, TikTok, Instagram, Pinterest, Facebook, and X), and how your personal privacy is safeguarded.
            </p>
          </section>

          {/* 1. Zero-Log Architecture */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              1. Information We Do NOT Collect (Zero-Log Architecture)
            </h2>
            <p style={{ marginBottom: '0.75rem' }}>
              AVERO is engineered with a strict <strong>zero-log</strong> privacy architecture:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', listStyleType: 'disc' }}>
              <li><strong>No Account Required:</strong> You do not need to register, create an account, or provide personal details (such as names, emails, or passwords) to use AVERO.</li>
              <li><strong>No Activity Logging:</strong> We do not log, record, or track the links, URLs, or specific media files you submit or download.</li>
              <li><strong>No Search History Storage:</strong> Your video search queries and pasted links are processed ephemerally in-memory and are never stored in user-identifiable databases.</li>
              <li><strong>No Persistent Media Retention:</strong> Downloaded files are temporarily streamed through automated memory buffers and are purged automatically from temporary cache after completion.</li>
            </ul>
          </section>

          {/* 2. Information We Process */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              2. Information We Process Automatically
            </h2>
            <p style={{ marginBottom: '0.75rem' }}>
              When you interact with our utility, minimal technical data is handled strictly to provide the requested service:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', listStyleType: 'disc' }}>
              <li><strong>Submitted Media URLs:</strong> The URL you paste is sent to our backend engine exclusively to analyze available video streams, audio bitrates, and image resolutions for your download request.</li>
              <li><strong>Standard Server Handshakes:</strong> Like all web services, our servers receive standard, non-identifying HTTP request headers (such as browser user-agent and preferred language) to deliver compatible video streams and protect against automated DDoS flooding.</li>
            </ul>
          </section>

          {/* 3. Cookies and Local Storage */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              3. Cookies and Browser Local Storage
            </h2>
            <p style={{ marginBottom: '0.75rem' }}>
              We respect your browser environment:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', listStyleType: 'disc' }}>
              <li><strong>No Tracking Cookies:</strong> AVERO does not use invasive third-party tracking cookies or behavioral advertising pixels.</li>
              <li><strong>Client-Side LocalStorage:</strong> We utilize your browser&apos;s native <code>localStorage</code> solely for functional preferences, such as retaining your local UI preferences and visual settings. This data remains on your device and is never transmitted to third parties.</li>
            </ul>
          </section>

          {/* 4. Third-Party Platform Content */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              4. Third-Party Platforms and Links
            </h2>
            <p>
              AVERO facilitates downloading and analyzing authorized public media hosted on third-party platforms (including YouTube, TikTok, Instagram, Pinterest, Facebook, and X). We do not host original content or control third-party networks. When accessing content from these platforms, your interaction is subject to the respective platform&apos;s terms of service and privacy policies.
            </p>
          </section>

          {/* 5. Security Protocols */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              5. Security & Data Protection
            </h2>
            <p>
              We implement industry-standard encryption protocols, including TLS/HTTPS encryption for all data in transit, along with hardened Server-Side Request Forgery (SSRF) filters. These safeguards ensure your connection to AVERO is secure, encrypted, and protected from interception.
            </p>
          </section>

          {/* 6. Children's Privacy */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              6. Children&apos;s Privacy
            </h2>
            <p>
              AVERO is a general-utility website and is not directed to individuals under the age of 13. We do not knowingly solicit or collect personal identifiable information from children.
            </p>
          </section>

          {/* 7. Changes to Policy */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              7. Updates to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect platform enhancements, legal compliance updates, or new platform features. Any modifications will be posted directly on this page with an updated revision date.
            </p>
          </section>

          {/* 8. Contact & Legal */}
          <section style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              8. Contact & Legal Inquiries
            </h2>
            <p>
              If you have any questions or inquiries regarding this Privacy Policy, our data practices, or DMCA compliance, please refer to our{' '}
              <Link href="/dmca" style={{ color: 'var(--color-accent-500)', fontWeight: 700, textDecoration: 'underline' }}>
                DMCA Notice
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
