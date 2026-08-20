import { UrlInput } from '@/components/media/url-input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Film, Lock, Smartphone } from 'lucide-react';

export const metadata = {
  title: 'Instagram Downloader - Save Reels, Videos & Posts - MediaFlow',
  description: 'Download Instagram Reels, video posts, and IGTV content easily in high quality MP4 for free with MediaFlow.',
};

export default function InstagramDownloaderPage() {
  const faqs = [
    {
      id: 'ig-1',
      q: 'How do I download Instagram Reels and videos?',
      a: 'Copy the Instagram post or Reel link from the Instagram app or website, paste it into the input bar above, and click Download.',
    },
    {
      id: 'ig-2',
      q: 'Do I need an Instagram account to download?',
      a: 'No! You can download public Instagram Reels and videos without logging into any account.',
    },
    {
      id: 'ig-3',
      q: 'Can I download private Instagram posts?',
      a: 'MediaFlow respects platform privacy settings and only processes publicly available Instagram media.',
    },
  ];

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <section style={{ paddingTop: '6.5rem', paddingBottom: '3rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ display: 'inline-flex', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-accent-500)', marginBottom: '1rem' }}>
            INSTAGRAM DOWNLOADER
          </div>
          <h1 className="text-4xl font-extrabold" style={{ letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.1 }}>
            Instagram Reels & Video Downloader
          </h1>
          <h2 className="text-xl font-medium text-muted" style={{ marginBottom: '2.5rem' }}>
            Save high-definition Instagram Reels, videos, and post media directly to your device
          </h2>

          <UrlInput />
        </div>
      </section>

      <section style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-editorial text-center">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Film className="w-8 h-8 text-pink-500" />
                </div>
                <CardTitle>Instagram Reels</CardTitle>
                <CardDescription>
                  Save viral Instagram Reels in high-definition MP4 video format.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-editorial text-center">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Lock className="w-8 h-8 text-emerald-500" />
                </div>
                <CardTitle>No Login Required</CardTitle>
                <CardDescription>
                  Download public videos directly without linking your account.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-editorial text-center">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Smartphone className="w-8 h-8 text-blue-500" />
                </div>
                <CardTitle>Mobile & Desktop</CardTitle>
                <CardDescription>
                  Works seamlessly across iOS Safari, Android Chrome, and desktop browsers.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="text-2xl font-extrabold">Instagram Downloader FAQ</h2>
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
