import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

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
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'AVERO | Free All-in-One Video & Image Downloader',
    description: 'Fast, clean, high-speed media downloader & converter for video, audio, and photo links.',
    url: siteUrl,
    siteName: 'AVERO',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-icon.png',
        width: 512,
        height: 512,
        type: 'image/png',
        alt: 'AVERO Favicon Logo',
      },
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'AVERO Media Downloader & Converter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVERO | Free All-in-One Video & Image Downloader',
    description: 'Fast, clean, high-speed media downloader & converter for video, audio, and photo links.',
    images: ['/og-image.png'],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable)}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SmoothScroll>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
            <Header />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
