import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Sparkles, User, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/blog-data';
import { SITE_URL } from '@/lib/constants';
import { BlogCtaCard } from '@/components/blog/blog-cta-card';
import { BlogFaqAccordion } from '@/components/blog/blog-faq-accordion';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | AVERO Guides',
      description: 'The requested guide could not be located.',
    };
  }

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const ogImageUrl = `${SITE_URL}/og-image.png`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: `${post.metaTitle} | AVERO`,
      description: post.metaDescription,
      url: postUrl,
      siteName: 'AVERO',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.metaTitle} | AVERO`,
      description: post.metaDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  // 1. Article / BlogPosting Schema
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url: postUrl,
    inLanguage: 'en-US',
    author: {
      '@type': 'Organization',
      name: post.author,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AVERO',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  };

  // 2. FAQPage Schema for Rich Search Results
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // 3. BreadcrumbList Schema
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
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <article style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Schema Injections */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero Header */}
      <header
        style={{
          paddingTop: 'clamp(5rem, 8vw, 6.5rem)',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="container" style={{ maxWidth: '820px' }}>
          {/* Breadcrumbs Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
            }}
          >
            <Link
              href="/"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href="/blog"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            >
              Blog
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>{post.platformName}</span>
          </div>

          {/* Platform Badge & Meta Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '1.15rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-color)',
                boxShadow: '2px 2px 5px var(--neumorph-dark), -2px -2px 5px var(--neumorph-light)',
                border: `1px solid ${post.badgeColor}40`,
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: post.badgeColor,
                textTransform: 'uppercase',
              }}
            >
              {post.platformName} GUIDE
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readTime}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Updated {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Primary H1 targeting real search query */}
          <h1
            style={{
              fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)',
              fontWeight: 850,
              letterSpacing: '-0.03em',
              lineHeight: 1.18,
              color: 'var(--text-color)',
              marginBottom: '1.25rem',
            }}
          >
            {post.title}
          </h1>

          {/* Lead Summary */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2.5vw, 1.2rem)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {post.summary}
          </p>
        </div>
      </header>

      {/* Main Content Body */}
      <main style={{ paddingTop: '2.5rem' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          {/* Quick Highlight CTA Banner */}
          <div
            style={{
              padding: '1rem 1.35rem',
              borderRadius: '16px',
              backgroundColor: 'rgba(225, 48, 108, 0.05)',
              border: '1px solid rgba(225, 48, 108, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '2.5rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-color)' }}>
                Need to download an Instagram video immediately?
              </span>
            </div>
            <Link
              href="/"
              className="pill-btn-black"
              style={{
                fontSize: '0.78rem',
                fontWeight: 750,
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>Go to Downloader</span>
              <span>➔</span>
            </Link>
          </div>

          {/* Render Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {post.sections.map((sec, secIdx) => (
              <section key={secIdx}>
                <h2
                  style={{
                    fontSize: 'clamp(1.35rem, 3.2vw, 1.7rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-color)',
                    marginBottom: '1rem',
                    lineHeight: 1.3,
                  }}
                >
                  {sec.heading}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                  {sec.paragraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      style={{
                        fontSize: '1.02rem',
                        lineHeight: 1.75,
                        color: 'var(--text-color)',
                        margin: 0,
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Callout box if present */}
                {sec.callout && (
                  <div
                    style={{
                      margin: '1.5rem 0',
                      padding: '1.15rem 1.35rem',
                      borderRadius: '16px',
                      backgroundColor: 'var(--bg-color)',
                      boxShadow: 'var(--nm-inset-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.65)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                    }}
                  >
                    {sec.callout.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" style={{ marginTop: '2px' }} />
                    ) : sec.callout.type === 'tip' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" style={{ marginTop: '2px' }} />
                    ) : (
                      <Info className="w-5 h-5 text-sky-500 flex-shrink-0" style={{ marginTop: '2px' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.25rem' }}>
                        {sec.callout.title}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {sec.callout.text}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips list if present */}
                {sec.tips && sec.tips.length > 0 && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      paddingLeft: '0.5rem',
                    }}
                  >
                    {sec.tips.map((tip, tIdx) => (
                      <div key={tIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: post.badgeColor,
                            marginTop: '0.65rem',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--text-color)' }}>
                          {tip}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Dedicated In-Content Call To Action Card linking to Homepage Tool */}
          <BlogCtaCard
            platformName={post.platformName}
            customHeadline={`Download ${post.platformName} Reels & Photos in 1080p HD`}
          />

          {/* Platform Specific FAQ Section (matches FAQPage schema) */}
          <BlogFaqAccordion faqs={post.faqs} platformName={post.platformName} />

          {/* Footer Navigation Back to Blog */}
          <div
            style={{
              paddingTop: '2rem',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <Link
              href="/blog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-color)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all guides</span>
            </Link>

            <Link
              href="/"
              className="pill-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.55rem 1.15rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                textDecoration: 'none',
                color: 'var(--text-color)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <span>Back to AVERO Home</span>
            </Link>
          </div>
        </div>
      </main>
    </article>
  );
}
