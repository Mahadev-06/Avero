import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { getAllBlogPosts } from '@/lib/blog-data';
import { SITE_URL } from '@/lib/constants';
import { BlogCtaCard } from '@/components/blog/blog-cta-card';

export const metadata: Metadata = {
  title: 'Guides & Tutorials - Social Media Downloader Walkthroughs',
  description: 'In-depth, platform-specific guides on downloading videos, reels, and photos from Instagram, TikTok, Threads, X, Pinterest, Reddit, and Facebook without watermarks.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Guides & Tutorials | AVERO',
    description: 'In-depth, platform-specific guides on downloading videos, reels, and photos from Instagram, TikTok, Threads, X, Pinterest, Reddit, and Facebook.',
    url: `${SITE_URL}/blog`,
    siteName: 'AVERO',
    type: 'website',
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guides & Tutorials | AVERO',
    description: 'In-depth guides on downloading social media video, audio, and images in master quality.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${SITE_URL}/blog`,
      },
    ],
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <h1 className="sr-only">Social Media Download Guides &amp; Tutorials</h1>

      {/* Posts Grid */}
      <section style={{ paddingTop: 'clamp(5.5rem, 8vw, 6.75rem)', paddingBottom: '3rem' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {posts.map((post) => (
              <article
                key={post.slug}
                className="nm-result-card"
                style={{
                  borderRadius: '22px',
                  backgroundColor: 'var(--bg-color)',
                  boxShadow: 'var(--neumorph-raised-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.7)',
                  padding: '1.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-color)',
                        boxShadow: 'var(--neumorph-raised-sm)',
                        border: `1px solid ${post.badgeColor}40`,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        color: post.badgeColor,
                        textTransform: 'uppercase',
                      }}
                    >
                      {post.platformName}
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <h2
                    style={{
                      fontSize: '1.28rem',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: 'var(--text-color)',
                      lineHeight: 1.35,
                      marginBottom: '0.75rem',
                    }}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      style={{
                        color: 'inherit',
                        textDecoration: 'none',
                      }}
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p
                    style={{
                      fontSize: '0.92rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                      marginBottom: '1.5rem',
                    }}
                  >
                    {post.summary}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="pill-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.95rem',
                      fontSize: '0.8rem',
                      fontWeight: 750,
                      borderRadius: 'var(--radius-full)',
                      textDecoration: 'none',
                      color: 'var(--text-color)',
                    }}
                  >
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* CTA back to Home */}
          <BlogCtaCard
            platformName="All Social Media"
            customHeadline="Looking for the All-in-One Downloader?"
          />
        </div>
      </section>
    </div>
  );
}
