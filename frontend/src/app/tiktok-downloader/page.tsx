import { UrlInput } from '@/components/media/url-input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Zap, Headphones } from 'lucide-react';

export const metadata = {
  title: 'TikTok Downloader - Save TikTok Videos in HD - MediaFlow',
  description: 'Download public TikTok videos in HD MP4 format for free with MediaFlow.',
};

export default function TikTokDownloaderPage() {
  const faqs = [
    {
      id: 'tt-1',
      q: 'How do I save TikTok videos?',
      a: 'Copy the TikTok video share link from the app, paste it into the input bar above, and click Download.',
    },
    {
      id: 'tt-2',
      q: 'Is TikTok downloader free?',
      a: 'Yes, MediaFlow TikTok video downloader is 100% free with unlimited downloads.',
    },
  ];

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <section style={{ paddingTop: 'clamp(5.5rem, 8vw, 6.5rem)', paddingBottom: '2.5rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)', marginBottom: '1rem' }}>
            TIKTOK DOWNLOADER
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.15 }}>
            TikTok HD Video Downloader
          </h1>
          <h2 className="text-base sm:text-xl font-medium text-muted" style={{ marginBottom: '2rem' }}>
            Save trending TikTok videos in high resolution MP4
          </h2>

          <UrlInput />
        </div>
      </section>

      <section style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-editorial text-center">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Zap className="w-8 h-8 text-amber-500" />
                </div>
                <CardTitle>Fast HD Downloads</CardTitle>
                <CardDescription>
                  Download original quality MP4 video files in seconds.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-editorial text-center">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Headphones className="w-8 h-8 text-blue-500" />
                </div>
                <CardTitle>TikTok Audio Extractor</CardTitle>
                <CardDescription>
                  Convert TikTok sound clips into MP3 audio files.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="text-2xl font-extrabold">TikTok Downloader FAQ</h2>
          </div>

          <Accordion className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} style={{ borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                <AccordionTrigger style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-accent-600)', textDecoration: 'underline' }}>
              ← Back to All Media Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
