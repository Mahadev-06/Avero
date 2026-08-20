import Link from 'next/link';
import { UrlInput } from '@/components/media/url-input';
import { HowItWorksGuide } from '@/components/media/how-it-works-guide';
import { AdSlot } from '@/components/layout/ad-slot';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/core/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaticonIcons } from '@/components/ui/icons';
import { TextLoop } from '@/components/core/text-loop';
import { AveroLogo } from '@/components/ui/avero-logo';
import { SocialShareButton } from '@/components/ui/social-share';
import { 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  FileVideo, 
  FileAudio, 
  FileCode,
  Shield,
  FileText,
  Lock,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export default function Home() {
  const faqs = [
    {
      id: 'faq-1',
      q: 'Is AVERO free to use?',
      a: 'Yes, AVERO is 100% free with no registration or subscription required for analyzing and downloading public media files.',
    },
    {
      id: 'faq-2',
      q: 'Which video & image platforms are supported?',
      a: 'AVERO supports YouTube, TikTok, Instagram Reels & Photos, Pinterest Pins, Reddit Posts & Videos, Threads, Facebook, X (Twitter), as well as direct MP4, WebM, MP3, JPG, and PNG media links.',
    },
    {
      id: 'faq-3',
      q: 'How does batch / multi-video downloading work?',
      a: 'Toggle to "Multi Mode" in the search bar, paste multiple URLs (one per line), and click process. AVERO analyzes all links at once and lets you download each video in your chosen resolution.',
    },
    {
      id: 'faq-4',
      q: 'Is my privacy and security protected?',
      a: 'Yes. AVERO uses SSL encryption, operates without storing user logs or tracking data, and automatically purges all temporary download files after 60 minutes.',
    },
  ];

  const toolsList = [
    {
      title: 'YouTube Downloader',
      desc: 'Save YouTube videos & Shorts in 1080p, 720p, 480p MP4 or convert to MP3 audio.',
      href: '/youtube-downloader',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
          <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432"/>
        </svg>
      ),
    },
    {
      title: 'Instagram Downloader',
      desc: 'Download Instagram Reels, video posts, carousel galleries, and story clips.',
      href: '/instagram-downloader',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="igToolGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFD521" />
              <stop offset="25%" stopColor="#F50000" />
              <stop offset="50%" stopColor="#B900B4" />
              <stop offset="100%" stopColor="#7E00FF" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#igToolGrad)"/>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none"/>
          <circle cx="12" cy="12" r="3.8" stroke="#FFFFFF" strokeWidth="1.8" fill="none"/>
          <circle cx="16.5" cy="7.5" r="1.1" fill="#FFFFFF"/>
        </svg>
      ),
    },
    {
      title: 'TikTok Downloader',
      desc: 'Save trending TikTok videos in high-resolution, watermark-free MP4 format.',
      href: '/tiktok-downloader',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#000000" />
          <path fill="#25F4EE" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.55-1.24 2.55.05.9.6 1.75 1.41 2.16.85.45 1.92.42 2.73-.06.77-.45 1.28-1.29 1.34-2.19.04-3.58.02-7.16.02-10.74z"/>
          <path fill="#FE2C55" d="M11.5 1.5c1.2 0 2.4 0 3.6 0 .07 1.4.58 2.8 1.6 3.8 1 1 2.4 1.5 3.8 1.6v3.6c-1.3-.05-2.6-.32-3.8-.88-.5-.23-1-.53-1.4-.84-.01 2.6.01 5.2-.02 7.8-.07 1.2-.48 2.5-1.2 3.5-1.2 1.7-3.2 2.8-5.3 2.9-1.3.07-2.5-.28-3.6-.92-1.8-1-3.1-3-3.3-5.1-.02-.4-.03-.9-.01-1.3.16-1.7 1-3.3 2.3-4.4 1.5-1.3 3.6-1.9 5.5-1.5.02 1.3-.04 2.6-.04 4-.9-.28-1.9-.2-2.7.33-.7.5-1.2 1.4-1.1 2.3.04.8.5 1.5 1.2 1.9.7.4 1.7.38 2.4-.05.7-.4 1.1-1.1 1.2-1.9.04-3.2.02-6.4.02-9.6z" opacity="0.85" />
          <path fill="#FFFFFF" d="M12 1c1.2 0 2.4 0 3.6 0 .07 1.4.58 2.8 1.6 3.8 1 1 2.4 1.5 3.8 1.6v3.6c-1.3-.05-2.6-.32-3.8-.88-.5-.23-1-.53-1.4-.84-.01 2.6.01 5.2-.02 7.8-.07 1.2-.48 2.5-1.2 3.5-1.2 1.7-3.2 2.8-5.3 2.9-1.3.07-2.5-.28-3.6-.92-1.8-1-3.1-3-3.3-5.1-.02-.4-.03-.9-.01-1.3.16-1.7 1-3.3 2.3-4.4 1.5-1.3 3.6-1.9 5.5-1.5.02 1.3-.04 2.6-.04 4-.9-.28-1.9-.2-2.7.33-.7.5-1.2 1.4-1.1 2.3.04.8.5 1.5 1.2 1.9.7.4 1.7.38 2.4-.05.7-.4 1.1-1.1 1.2-1.9.04-3.2.02-6.4.02-9.6z"/>
        </svg>
      ),
    },
    {
      title: 'Pinterest Downloader',
      desc: 'Save Pinterest pins, full-resolution photos, GIFs, and idea video clips.',
      href: '/',
      icon: (
        <img
          src="/pinterest-logo.png"
          alt="Pinterest"
          width={28}
          height={28}
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'contain' }}
        />
      ),
    },
    {
      title: 'Reddit Downloader',
      desc: 'Download Reddit videos with merged audio, photo galleries, and media posts.',
      href: '/',
      icon: (
        <img
          src="/reddit-logo.png"
          alt="Reddit"
          width={28}
          height={28}
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'contain' }}
        />
      ),
    },
    {
      title: 'Threads Downloader',
      desc: 'Save Threads videos, photo posts, and multimedia links in master quality.',
      href: '/',
      icon: (
        <img
          src="/threads-logo.png"
          alt="Threads"
          width={28}
          height={28}
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'contain' }}
        />
      ),
    },
    {
      title: 'Facebook Downloader',
      desc: 'Download Facebook public videos, Watch streams, and Reels in Full HD quality.',
      href: '/',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#1877F2" />
          <path fill="#FFFFFF" d="M15.5 12h-2.5v8h-3v-8h-2v-2.8h2v-1.8c0-2.3 1.4-3.6 3.5-3.6 1 0 1.9.08 2.1.1v2.5h-1.5c-1.1 0-1.4.5-1.4 1.3v1.5h2.8l-.5 2.8z"/>
        </svg>
      ),
    },
    {
      title: 'X / Twitter Downloader',
      desc: 'Save X video clips, animated GIFs, and high-resolution photo posts.',
      href: '/',
      icon: (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/x-logo.png"
            alt="X"
            width={18}
            height={18}
            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
          />
        </div>
      ),
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* 1. HERO SECTION */}
      <section className="hero-section" style={{ paddingTop: '9.5rem', paddingBottom: '4.5rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          
          {/* Main Headline (H1) with 3D TextLoop Animation */}
          <h1
            className="hero-title"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.1rem, 4.3vw, 3.65rem)',
              fontWeight: 850,
              letterSpacing: '-0.035em',
              marginBottom: '3rem',
              lineHeight: 1.22,
              display: 'inline-flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.28em',
              color: 'var(--text-color)',
            }}
          >
            <span>Free</span>
            <TextLoop
              className="overflow-y-clip"
              interval={1.85}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.8,
              }}
              variants={{
                initial: {
                  y: '80%',
                  rotateX: 85,
                  opacity: 0,
                  filter: 'blur(3px)',
                },
                animate: {
                  y: '0%',
                  rotateX: 0,
                  opacity: 1,
                  filter: 'blur(0px)',
                },
                exit: {
                  y: '-80%',
                  rotateX: -85,
                  opacity: 0,
                  filter: 'blur(3px)',
                },
              }}
            >
              <span>YouTube</span>
              <span>TikTok</span>
              <span>Instagram</span>
              <span>Pinterest</span>
              <span>Reddit</span>
              <span>Threads</span>
              <span>Facebook</span>
              <span>X (Twitter)</span>
            </TextLoop>
            <span>Video & Image Downloader</span>
          </h1>

          {/* Search & Paste Bar Component */}
          <UrlInput />

        </div>
      </section>

      {/* Flaticon-style Trust Badges Bar */}
      <section style={{ boxShadow: 'var(--nm-inset-sm)', borderTop: '1px solid rgba(255, 255, 255, 0.3)', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'var(--bg-color)', padding: '1.25rem 0' }}>
        <div className="container trust-badges-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-color)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap className="w-4 h-4 text-amber-500" /> <strong>Fast Processing</strong>
          </span>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles className="w-4 h-4 text-purple-500" /> <strong>100% Free & Unlimited</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone className="w-4 h-4 text-blue-500" /> <strong>iOS, Android & Desktop</strong>
          </span>
        </div>
      </section>

      {/* Ad Placement */}
      <div className="container" style={{ margin: '2.5rem auto 1.5rem auto' }}>
        <AdSlot placement="hero-bottom" />
      </div>

      {/* 2. POPULAR MEDIA TOOLS DIRECTORY */}
      <section style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)', marginBottom: '0.75rem' }}>
              TOOLS ECOSYSTEM
            </div>
            <h2 className="text-3xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              Explore Dedicated Downloader Tools
            </h2>
          </div>

          <div className="tools-grid">
            {toolsList.map((tool) => (
              <Link key={tool.title} href={tool.href} style={{ textDecoration: 'none' }}>
                <Card className="card-editorial h-full transition-transform hover:-translate-y-1" style={{ cursor: 'pointer', borderRadius: '18px' }}>
                  <CardHeader>
                    <div style={{ marginBottom: '0.5rem' }}>{tool.icon}</div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription>{tool.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SUPPORTED FORMATS & QUALITY MATRIX TABLE */}
      <section style={{ paddingTop: '1rem', paddingBottom: '3.5rem' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)', marginBottom: '0.75rem' }}>
              FORMAT SUPPORT
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              Supported Output Formats & Resolutions
            </h2>
          </div>

          {/* Desktop Table View (>= 769px) */}
          <div
            className="desktop-format-table table-responsive-container"
            style={{
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '8px 8px 20px var(--neumorph-dark), -8px -8px 20px var(--neumorph-light)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
                  <th style={{ padding: '1.15rem 1.4rem', fontWeight: 800, borderBottom: '1px solid rgba(0, 0, 0, 0.07)', borderTopLeftRadius: '24px' }}>Media Type</th>
                  <th style={{ padding: '1.15rem 1.4rem', fontWeight: 800, borderBottom: '1px solid rgba(0, 0, 0, 0.07)' }}>Format</th>
                  <th style={{ padding: '1.15rem 1.4rem', fontWeight: 800, borderBottom: '1px solid rgba(0, 0, 0, 0.07)' }}>Available Qualities</th>
                  <th style={{ padding: '1.15rem 1.4rem', fontWeight: 800, borderBottom: '1px solid rgba(0, 0, 0, 0.07)', borderTopRightRadius: '24px' }}>Compatibility</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '1.15rem 1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                    <FileVideo className="w-4 h-4 text-blue-500" /> Video
                  </td>
                  <td style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>MP4 (H.264 + AAC)</td>
                  <td style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>1080p Full HD, 720p HD, 480p, 360p</td>
                  <td style={{ padding: '1.15rem 1.4rem', color: '#16a34a', fontWeight: 700, borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>Universal (Windows, Mac, iOS, Android)</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.15rem 1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                    <FileAudio className="w-4 h-4 text-amber-500" /> Audio
                  </td>
                  <td style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>MP3 / M4A</td>
                  <td style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>320kbps High Quality, 192kbps, 128kbps</td>
                  <td style={{ padding: '1.15rem 1.4rem', color: '#16a34a', fontWeight: 700, borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>Universal</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.15rem 1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottomLeftRadius: '24px' }}>
                    <FileCode className="w-4 h-4 text-purple-500" /> Direct Media
                  </td>
                  <td style={{ padding: '1.15rem 1.4rem' }}>Original (WebM, WAV, OGG, PNG)</td>
                  <td style={{ padding: '1.15rem 1.4rem' }}>Original Resolution</td>
                  <td style={{ padding: '1.15rem 1.4rem', color: '#16a34a', fontWeight: 700, borderBottomRightRadius: '24px' }}>Native Browser Save</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (<= 768px) */}
          <div className="mobile-format-cards">
            {/* Card 1: Video */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '20px',
                padding: '1.25rem',
                boxShadow: '4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-color)' }}>
                  <FileVideo className="w-5 h-5 text-blue-500" />
                  <span>Video Formats</span>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.08)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                  }}
                >
                  Universal MP4
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0, 0, 0, 0.04)', paddingBottom: '0.4rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Format:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-color)', textAlign: 'right' }}>MP4 (H.264 + AAC)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0, 0, 0, 0.04)', paddingBottom: '0.4rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Qualities:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-color)', textAlign: 'right' }}>1080p, 720p, 480p, 360p</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '0.1rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Support:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>Windows, Mac, iOS, Android</span>
                </div>
              </div>
            </div>

            {/* Card 2: Audio */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '20px',
                padding: '1.25rem',
                boxShadow: '4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-color)' }}>
                  <FileAudio className="w-5 h-5 text-amber-500" />
                  <span>Audio & Music</span>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.08)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                  }}
                >
                  Universal MP3
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0, 0, 0, 0.04)', paddingBottom: '0.4rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Format:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-color)', textAlign: 'right' }}>MP3 / M4A</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0, 0, 0, 0.04)', paddingBottom: '0.4rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Bitrate:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-color)', textAlign: 'right' }}>320kbps, 192kbps, 128kbps</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '0.1rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Support:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>All Players & Devices</span>
                </div>
              </div>
            </div>

            {/* Card 3: Direct Media */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '20px',
                padding: '1.25rem',
                boxShadow: '4px 4px 10px var(--neumorph-dark), -4px -4px 10px var(--neumorph-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-color)' }}>
                  <FileCode className="w-5 h-5 text-purple-500" />
                  <span>Direct Media & Images</span>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.08)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                  }}
                >
                  Lossless
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0, 0, 0, 0.04)', paddingBottom: '0.4rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Format:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-color)', textAlign: 'right' }}>Original (JPG, PNG, WebM)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0, 0, 0, 0.04)', paddingBottom: '0.4rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Quality:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-color)', textAlign: 'right' }}>Full Original Resolution</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '0.1rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Support:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>Native Browser Save</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 5-STEP VISUAL HOW-TO GUIDE */}
      <HowItWorksGuide />

      {/* 5. FAQ ACCORDION SECTION */}
      <section id="faq" style={{ paddingTop: '2rem', paddingBottom: '4rem', scrollMarginTop: '2rem' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)', marginBottom: '0.75rem' }}>
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="text-3xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>
              Everything You Need to Know
            </h2>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-color)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              boxShadow: '8px 8px 20px var(--neumorph-dark), -8px -8px 20px var(--neumorph-light)',
              padding: '1.25rem',
            }}
          >
            <Accordion
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              variants={{
                expanded: {
                  opacity: 1,
                  scale: 1,
                },
                collapsed: {
                  opacity: 0,
                  scale: 0.95,
                },
              }}
            >
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    overflow: 'hidden',
                    boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                  }}
                >
                  <AccordionTrigger
                    style={{
                      padding: '1.15rem 1.4rem',
                      fontSize: '1.02rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      cursor: 'pointer',
                      gap: '1rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-color)', textAlign: 'left', flex: 1 }}>
                      {faq.q}
                    </span>
                    <ChevronDown className="w-5 h-5 shrink-0 transition-transform duration-200 ease-out text-[var(--text-color)] group-data-expanded:rotate-180" style={{ color: 'var(--text-color)', flexShrink: 0 }} />
                  </AccordionTrigger>
                  <AccordionContent className="origin-top">
                    <div style={{ padding: '0 1.4rem 1.25rem 1.4rem' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.65, margin: 0 }}>
                        {faq.a}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 6. SHARE AVERO SECTION */}
      <section style={{ paddingTop: '1rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1rem' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-color)',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              borderRadius: '24px',
              padding: '2.25rem 1.5rem',
              boxShadow: '8px 8px 20px var(--neumorph-dark), -8px -8px 20px var(--neumorph-light)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-color)', margin: 0, letterSpacing: '-0.02em' }}>
              Love using AVERO? Share with friends!
            </h3>

            <div>
              <SocialShareButton label="Share AVERO" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
