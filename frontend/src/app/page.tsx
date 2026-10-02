import { UrlInput } from '@/components/media/url-input';
import { DedicatedToolsSection } from '@/components/media/dedicated-tools-section';
import { HowItWorksGuide } from '@/components/media/how-it-works-guide';
import { AdSlot } from '@/components/layout/ad-slot';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/core/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaticonIcons } from '@/components/ui/icons';
import { TextLoop } from '@/components/core/text-loop';
import { HeroTitleAnimation } from '@/registry/ruixenui/hero-title-animation';
import { ArcRevealHero } from "@/registry/ruixenui/arc-reveal-hero";
import { AveroLogo } from '@/components/ui/avero-logo';
import { TrustBadges } from '@/components/media/trust-badges';
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
      a: 'AVERO supports TikTok, Instagram Reels & Photos, Pinterest Pins, Reddit Posts & Videos, Threads, Facebook, X (Twitter), as well as direct MP4, WebM, MP3, JPG, and PNG media links.',
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
    <ArcRevealHero>
      <div style={{ paddingBottom: '2.5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* 1. HERO SECTION */}
      <section className="hero-section" style={{ paddingTop: '9.5rem', paddingBottom: '4.5rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          
          {/* Main Headline (H1) with Ruixen HeroTitleAnimation */}
          <div style={{ marginBottom: '2.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <HeroTitleAnimation
              brandWords={["Free", "Social", "Media"]}
              highlightWords={["Video & Image Downloader"]}
            />
          </div>

          {/* Search & Paste Bar Component */}
          <UrlInput />

        </div>
      </section>

      {/* Flaticon-style Trust Badges Bar */}
      <TrustBadges />

      {/* Ad Placement */}
      <div className="container" style={{ margin: '2.5rem auto 1.5rem auto' }}>
        <AdSlot placement="hero-bottom" />
      </div>

      {/* 2. DEDICATED DOWNLOADER TOOLS */}
      <DedicatedToolsSection />

      {/* 3. SUPPORTED FORMATS & QUALITY MATRIX TABLE */}
      <section style={{ paddingTop: '1rem', paddingBottom: '3.5rem' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
            <h2
              style={{
                fontSize: 'clamp(2.1rem, 4.8vw, 3rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                margin: 0,
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <span style={{ display: 'block', color: '#16171a' }}>Supported Output</span>
              <span style={{ display: 'block', color: '#5e6065', fontWeight: 800 }}>Formats & Resolutions</span>
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
          <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-color)', marginBottom: '1rem' }}>
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2
              style={{
                fontSize: 'clamp(2.1rem, 4.8vw, 3rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                margin: 0,
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <span style={{ display: 'block', color: '#16171a' }}>Everything You</span>
              <span style={{ display: 'block', color: '#5e6065', fontWeight: 800 }}>Need to Know</span>
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
            <h3
              style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 1.85rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: 0,
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <span style={{ color: '#16171a' }}>Love using AVERO? </span>
              <span style={{ color: '#5e6065', fontWeight: 800 }}>Share with friends!</span>
            </h3>

            <div>
              <SocialShareButton label="Share AVERO" />
            </div>
          </div>
        </div>
      </section>

    </div>
    </ArcRevealHero>
  );
}