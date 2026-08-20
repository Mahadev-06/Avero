import Link from 'next/link';

export const metadata = {
  title: 'DMCA Copyright Notice — AVERO Video & Image Downloader',
  description: 'AVERO Digital Millennium Copyright Act (DMCA) notice, copyright compliance policy, and procedures for submitting intellectual property takedown notices.',
};

export default function DMCAPage() {
  return (
    <div style={{ paddingTop: '8.5rem', paddingBottom: '6rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:underline">
            Home
          </Link>
          <span>&gt;</span>
          <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>DMCA Notice</span>
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
          DMCA Notice &amp; Copyright Policy
        </h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2.25rem', fontWeight: 500 }}>
          Effective Date: August 2026 • Digital Millennium Copyright Act Compliance
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
          {/* Overview */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              1. Overview &amp; Intellectual Property Respect
            </h2>
            <p>
              <strong>AVERO</strong> respects the intellectual property rights of artists, creators, musicians, photographers, and publishers. It is our strict policy to comply with the <strong>Digital Millennium Copyright Act (17 U.S.C. § 512)</strong>, international copyright treaties, and applicable intellectual property laws.
            </p>
            <p style={{ marginTop: '0.65rem' }}>
              AVERO operates exclusively as a technical media conversion and streaming utility. <strong>We do not host, store, replicate, or broadcast copyrighted video, photo, or audio content on our servers.</strong> All media processed through our platform is retrieved directly from publicly accessible third-party hosting networks (including YouTube, TikTok, Instagram, Pinterest, Facebook, and X) in direct response to user-initiated actions.
            </p>
          </section>

          {/* 2. Notice and Takedown Procedure */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              2. Submitting a DMCA Takedown Notice
            </h2>
            <p style={{ marginBottom: '0.75rem' }}>
              If you are a copyright owner, or an authorized representative thereof, and believe that content accessible or downloadable via our tool infringes upon your copyright, you may submit a formal notification containing the following mandatory elements:
            </p>
            <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', listStyleType: 'decimal' }}>
              <li>
                <strong>Identification of the Copyrighted Work:</strong> A clear description of the copyrighted work claimed to have been infringed (e.g., title, original artist, direct link to official work).
              </li>
              <li>
                <strong>Identification of Infringing URL(s):</strong> The specific URL(s) on the third-party platform that you are requesting to have blocked or disabled on AVERO.
              </li>
              <li>
                <strong>Contact Information:</strong> Your full legal name, company/organization name, physical mailing address, telephone number, and valid email address.
              </li>
              <li>
                <strong>Good Faith Statement:</strong> A statement asserting: <em>&quot;I have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.&quot;</em>
              </li>
              <li>
                <strong>Accuracy &amp; Perjury Statement:</strong> A statement under penalty of perjury asserting: <em>&quot;The information in this notification is accurate, and I declare under penalty of perjury that I am the copyright owner or authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.&quot;</em>
              </li>
              <li>
                <strong>Authorized Signature:</strong> A physical or electronic signature of the copyright owner or authorized agent.
              </li>
            </ol>
          </section>

          {/* 3. Notice Processing & Enforcement */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              3. Notice Review &amp; URL Disabling
            </h2>
            <p>
              Upon receiving a complete and legally valid DMCA notification containing all the statutory requirements specified above, AVERO will promptly review the submission and disable the specified URL(s) from being analyzed, processed, or downloaded through our service.
            </p>
          </section>

          {/* 4. Important Note Regarding Third-Party Hosts */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              4. Note on Third-Party Hosting Platforms
            </h2>
            <p>
              Because AVERO does not host any video, image, or audio files on its own infrastructure, disabling or filtering a URL on AVERO prevents users from converting that specific link on our site, but does <strong>not</strong> delete the content from the third-party hosting provider (e.g., YouTube, TikTok, Pinterest, or Instagram). To remove the source video or photo from the internet permanently, copyright owners must also submit a takedown request directly to the respective host platform.
            </p>
          </section>

          {/* 5. Repeat Infringer Policy */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
              5. Repeat Infringement Policy
            </h2>
            <p>
              In accordance with Section 512(i) of the DMCA, AVERO maintains an automated policy to restrict and block repeated abuse, automated scraping, or misuse of our conversion pipeline that infringes upon copyright terms.
            </p>
          </section>

          {/* 6. Legal Notice Links */}
          <section style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <p style={{ fontSize: '0.92rem' }}>
              For more information on platform terms and data practices, please review our{' '}
              <Link href="/terms" style={{ color: 'var(--color-accent-500)', fontWeight: 700, textDecoration: 'underline' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" style={{ color: 'var(--color-accent-500)', fontWeight: 700, textDecoration: 'underline' }}>
                Privacy Policy
              </Link>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
