"use client";

import React from 'react';
import { SlotText } from 'slot-text/react';
import { Link2, Globe, Sparkles, SlidersHorizontal, ArrowDownCircle } from 'lucide-react';

interface StepItem {
  step: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
  svgMockup: React.ReactNode;
}

const STEPS: StepItem[] = [
  {
    step: 1,
    title: 'Copy Video Link',
    desc: 'Find your video or photo on Instagram, TikTok, Facebook, Pinterest, or X and copy its link.',
    icon: <Link2 className="w-5 h-5 text-amber-600" />,
    svgMockup: (
      <svg width="100%" height="80" viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="14" width="164" height="52" rx="10" fill="var(--bg-color)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <rect x="18" y="24" width="144" height="22" rx="6" fill="rgba(255,255,255,0.5)" stroke="#16a34a" strokeWidth="1.2" />
        <text x="26" y="38" fill="#16a34a" fontSize="8.5" fontStyle="italic" fontWeight="700" fontFamily="sans-serif">
          instagram.com/reel/...
        </text>
        <circle cx="150" cy="35" r="6" fill="#16a34a" />
        <path d="M147.5 35L149.5 37L152.5 33.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="52" width="60" height="6" rx="2" fill="var(--neumorph-dark)" opacity="0.4" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'Open AVERO',
    desc: 'Open your browser on any mobile or desktop device and visit AVERO.',
    icon: <Globe className="w-5 h-5 text-amber-600" />,
    svgMockup: (
      <svg width="100%" height="80" viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="14" width="164" height="52" rx="10" fill="var(--bg-color)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <rect x="18" y="24" width="144" height="22" rx="11" fill="rgba(255,255,255,0.5)" stroke="var(--text-color)" strokeWidth="1.2" />
        <text x="30" y="38" fill="var(--text-color)" fontSize="9" fontWeight="800" fontFamily="sans-serif">
          AVERO
        </text>
        <circle cx="150" cy="35" r="6.5" fill="var(--text-color)" />
        <path d="M147.5 35H152.5M150 32.5L152.5 35L150 37.5" stroke="var(--bg-color)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="52" width="80" height="6" rx="2" fill="var(--neumorph-dark)" opacity="0.4" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Paste Your Link',
    desc: 'Paste the copied URL into the minimal search box on our homepage.',
    icon: <Sparkles className="w-5 h-5 text-amber-600" />,
    svgMockup: (
      <svg width="100%" height="80" viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="14" width="164" height="52" rx="10" fill="var(--bg-color)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <rect x="16" y="22" width="148" height="24" rx="12" fill="rgba(255,255,255,0.5)" stroke="#f59e0b" strokeWidth="1.2" />
        <text x="26" y="37" fill="var(--text-muted)" fontSize="8.5" fontFamily="sans-serif">
          https://...
        </text>
        <rect x="114" y="25" width="46" height="18" rx="9" fill="#f59e0b" />
        <text x="123" y="37" fill="#ffffff" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">
          Analyze
        </text>
        <rect x="16" y="52" width="50" height="6" rx="2" fill="var(--neumorph-dark)" opacity="0.4" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Choose Quality',
    desc: 'Pick your preferred format (MP4/MP3) and resolution (up to 4K Ultra HD).',
    icon: <SlidersHorizontal className="w-5 h-5 text-amber-600" />,
    svgMockup: (
      <svg width="100%" height="80" viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="14" width="164" height="52" rx="10" fill="var(--bg-color)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <rect x="18" y="22" width="144" height="16" rx="4" fill="rgba(255,255,255,0.6)" />
        <text x="24" y="33" fill="var(--text-color)" fontSize="7" fontWeight="700">1080P MP4 • 39 MB</text>
        <rect x="126" y="24" width="32" height="12" rx="3" fill="#16a34a" />
        <text x="131" y="33" fill="#ffffff" fontSize="6.5" fontWeight="800">Save</text>
        
        <rect x="18" y="42" width="144" height="16" rx="4" fill="rgba(255,255,255,0.6)" />
        <text x="24" y="53" fill="var(--text-color)" fontSize="7" fontWeight="700">320K MP3 • 8 MB</text>
        <rect x="126" y="44" width="32" height="12" rx="3" fill="#16a34a" />
        <text x="131" y="53" fill="#ffffff" fontSize="6.5" fontWeight="800">Save</text>
      </svg>
    ),
  },
  {
    step: 5,
    title: 'Download & Save',
    desc: 'Hit download to save the media directly to your device storage.',
    icon: <ArrowDownCircle className="w-5 h-5 text-amber-600" />,
    svgMockup: (
      <svg width="100%" height="80" viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="14" width="164" height="52" rx="10" fill="var(--bg-color)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <circle cx="60" cy="40" r="14" fill="#16a34a" />
        <path d="M60 33V47M55 42L60 47L65 42" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M85 40H100M97 36L101 40L97 44" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="110" y="27" width="28" height="26" rx="4" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        <path d="M116 34H132M116 39H128M116 44H124" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function HowItWorksGuide() {
  return (
    <section id="how-it-works" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        {/* Section Title & Subtitle */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem auto' }}>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-balance"
            style={{ letterSpacing: '-0.02em', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}
          >
            How to Download in 5 Simple Steps
          </h2>
          <p className="text-muted text-pretty" style={{ fontSize: '1.02rem', lineHeight: 1.6, margin: 0 }}>
            From grabbing the link to saving high-resolution video or audio, the workflow is fast, free, and seamless.
          </p>
        </div>

        {/* Unified Interconnected Process Board */}
        <div
          style={{
            backgroundColor: 'var(--bg-color)',
            borderRadius: '24px',
            boxShadow: '8px 8px 20px var(--neumorph-dark), -8px -8px 20px var(--neumorph-light)',
            border: '1px solid rgba(255, 255, 255, 0.65)',
            padding: 'clamp(1.25rem, 3.5vw, 2.5rem) clamp(1rem, 2.5vw, 1.75rem)',
            position: 'relative',
          }}
        >
          {/* Connecting Track Line behind step numbers on desktop */}
          <div
            className="hidden lg:block"
            style={{
              position: 'absolute',
              top: '4.25rem',
              left: '10%',
              right: '10%',
              height: '2px',
              backgroundColor: 'var(--neumorph-dark)',
              opacity: 0.35,
              zIndex: 0,
            }}
          />

          {/* 5 Interconnected Step Columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {STEPS.map((item, idx) => (
              <div
                key={`unified-step-${item.step}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  padding: '0 0.5rem',
                }}
              >
                {/* Numbered Pearl Badge */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '4px 4px 8px var(--neumorph-dark), -4px -4px 8px var(--neumorph-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: 'var(--text-color)',
                    marginBottom: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  <SlotText text={String(item.step)} />
                </div>

                {/* Illustration Frame */}
                <div
                  style={{
                    width: '100%',
                    marginBottom: '1rem',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: 'inset 2px 2px 5px var(--neumorph-dark), inset -2px -2px 5px var(--neumorph-light)',
                    padding: '6px',
                  }}
                >
                  {item.svgMockup}
                </div>

                {/* Step Title & Details */}
                <h3
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    marginBottom: '0.45rem',
                    color: 'var(--text-color)',
                    lineHeight: 1.25,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
