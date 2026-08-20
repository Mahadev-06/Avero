"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AveroLogo } from '@/components/ui/avero-logo';

export function Header() {
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
        className="nav-floating-pill"
        style={{
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2rem',
          padding: '0.5rem 1.45rem',
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
        <div className="nav-links-wrap" style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
          <Link
            href="/"
            className="nav-link-item"
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
            className="nav-link-item"
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
            className="nav-link-item"
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
      </nav>
    </header>
  );
}
