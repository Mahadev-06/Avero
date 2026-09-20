export const MAX_URLS_PER_BATCH = 20;

// Production Base URL — guaranteed never to resolve to localhost for SEO tags & canonicals
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
    : 'https://avero-indol.vercel.app';

export const PLATFORMS = {
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  PINTEREST: 'Pinterest',
  REDDIT: 'Reddit',
  THREADS: 'Threads',
  FACEBOOK: 'Facebook',
  X_TWITTER: 'X / Twitter',
  DIRECT: 'Direct Media',
} as const;
