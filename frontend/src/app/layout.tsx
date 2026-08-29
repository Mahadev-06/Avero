import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://avero-indol.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AVERO | Free All-in-One Video & Image Downloader',
    template: '%s | AVERO',
  },
  description: 'Fast, secure, and free media downloader for TikTok, Instagram Reels, Pinterest, Reddit, Threads, Facebook, X (Twitter), and direct media links.',
  keywords: [
    'video downloader',
    'social media downloader',
    'instagram reels download',
    'tiktok downloader',
    'pinterest image download',
    'reddit video download',
    'threads downloader',
    'facebook video download',
    'twitter x video downloader',
    'mp4 converter',
    'mp3 audio converter',
    'free media utility'
  ],
  authors: [{ name: 'AVERO' }],
  creator: 'AVERO',
  publisher: 'AVERO',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/avero-icon-192.png',
  },
  openGraph: {
    title: 'AVERO | Free All-in-One Video & Image Downloader',
    description: 'Fast, clean, high-speed media downloader & converter for video, audio, and photo links.',
    url: siteUrl,
    siteName: 'AVERO',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/avero-logo.png',
        width: 1200,
        height: 630,
        alt: 'AVERO Media Downloader & Converter',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVERO | Free All Video & Image Downloader',
    description: 'Free, private, high-speed video and image downloader for all major platforms.',
    images: ['/avero-logo.png'],
  },
  alternates: {
    canonical: '/',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AVERO',
  url: siteUrl,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description: 'Free online media utility to analyze and download video, audio, and images from public links.',
};

import { SmoothScroll } from '@/components/layout/smooth-scroll';
import MagicCursor from '@/components/ui/magic-cursor';
import { DotGridBackground } from '@/components/ui/dot-grid-background';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <DotGridBackground />
        <MagicCursor />
        <SmoothScroll>
          <div className="flex flex-col relative z-10" style={{ minHeight: '100vh' }}>
            <Header />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
