"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueueStore } from '@/stores/queue-store';
import { AveroLogo } from '@/components/ui/avero-logo';

export function Header() {
  const items = useQueueStore((state) => state.items);
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 25) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Do not show navbar on the /queue page
  if (pathname === '/queue') {
    return null;
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 1rem',
        pointerEvents: isScrolled ? 'none' : 'auto',
        opacity: isScrolled ? 0 : 1,
        transform: isScrolled ? 'translateY(-20px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
    >
      <nav
        style={{
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2.25rem',
          padding: '0.5rem 0.75rem 0.5rem 1.45rem',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-color)',
          border: '1px solid rgba(255, 255, 255, 0.65)',
          boxShadow: '6px 6px 14px var(--neumorph-dark), -6px -6px 14px var(--neumorph-light)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Left AVERO Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-color)',
            textDecoration: 'none',
          }}
          aria-label="AVERO Home"
        >
          <AveroLogo height={18} />
        </Link>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
          <Link
            href="/"
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-color)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            Home
          </Link>
          <Link
            href="/about"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-color)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            About
          </Link>
          <Link
            href="/#faq"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-color)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            FAQ
          </Link>
        </div>

        {/* Right CTA Button (Queue / Action) */}
        <Link
          href="/queue"
          style={{
            padding: '0.45rem 1.15rem',
            fontSize: '0.86rem',
            fontWeight: 700,
            borderRadius: '10px',
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-color)',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            boxShadow: '4px 4px 8px var(--neumorph-dark), -4px -4px 8px var(--neumorph-light)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
            whiteSpace: 'nowrap',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.boxShadow = 'inset 3px 3px 6px var(--neumorph-dark), inset -3px -3px 6px var(--neumorph-light)';
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.boxShadow = '4px 4px 8px var(--neumorph-dark), -4px -4px 8px var(--neumorph-light)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span>Queue ({items.length})</span>
        </Link>
      </nav>
    </header>
  );
}
