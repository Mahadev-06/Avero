import { UrlInput } from '@/components/media/url-input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tv, Music, Zap } from 'lucide-react';

export const metadata = {
  title: 'YouTube Video Downloader & MP3 Converter - MediaFlow',
  description: 'Download YouTube videos in 1080p, 720p, 480p MP4 or convert to high-quality 320kbps MP3 audio for free with MediaFlow.',
};

export default function YouTubeDownloaderPage() {
  const faqs = [
    {
      id: 'yt-1',
      q: 'How do I download YouTube videos in 1080p or 720p?',
      a: 'Simply paste the YouTube video or Shorts link into the input bar above, hit Process, select your desired resolution (1080p Full HD, 720p HD, or 480p), and click Download Video.',
    },
    {
      id: 'yt-2',
      q: 'Can I convert YouTube videos to MP3 audio?',
      a: 'Yes! Select MP3 320kbps or Audio format from the dropdown menu after processing your link. MediaFlow automatically extracts and merges the audio stream.',
    },
    {
      id: 'yt-3',
      q: 'Does MediaFlow support YouTube Shorts?',
      a: 'Yes, YouTube Shorts (youtube.com/shorts/...) are fully supported with full video and audio extraction.',
    },
  ];

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <section style={{ paddingTop: '6.5rem', paddingBottom: '3rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)', marginBottom: '1rem' }}>
            YOUTUBE DOWNLOADER & CONVERTER
          </div>
          <h1 className="text-4xl font-extrabold" style={{ letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.1 }}>
            YouTube Video & MP3 Downloader
          </h1>
          <h2 className="text-xl font-medium text-muted" style={{ marginBottom: '2.5rem' }}>
            Save YouTube videos in 1080p Full HD, 720p HD MP4, or convert to 320kbps MP3
          </h2>

          <UrlInput />
        </div>
      </section>

      {/* Features section */}
      <section style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-editorial text-center">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Tv className="w-8 h-8 text-blue-500" />
                </div>
                <CardTitle>Full HD 1080p & 720p</CardTitle>
                <CardDescription>
                  Extract clean MP4 video with combined video and audio streams.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-editorial text-center">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Music className="w-8 h-8 text-amber-500" />
                </div>
                <CardTitle>320kbps MP3 Converter</CardTitle>
                <CardDescription>
                  Convert any YouTube video or music clip into crystal-clear MP3 audio.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-editorial text-center">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Zap className="w-8 h-8 text-purple-500" />
                </div>
                <CardTitle>Shorts & Playlists</CardTitle>
                <CardDescription>
                  Full support for YouTube Shorts and multi-link batch processing.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="text-2xl font-extrabold">Frequently Asked Questions</h2>
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
