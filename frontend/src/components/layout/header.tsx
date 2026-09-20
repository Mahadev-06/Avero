"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AveroLogo } from '@/components/ui/avero-logo';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 25) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHashChange);
    handleScroll();
    setHash(window.location.hash);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Compute active statuses based on current route
  const isFaqActive = (pathname === '/' || pathname === '') && hash === '#faq';
  const isHomeActive = (pathname === '/' || pathname === '') && hash !== '#faq';
  const isBlogActive = pathname === '/blog' || (pathname && pathname.startsWith('/blog/'));
  const isAboutActive = pathname === '/about' || (pathname && pathname.startsWith('/about/'));

  const navItems = [
    { name: 'Home', href: '/', isActive: isHomeActive, onClick: () => setHash('') },
    { name: 'Blog', href: '/blog', isActive: isBlogActive, onClick: () => setHash('') },
    { name: 'About', href: '/about', isActive: isAboutActive, onClick: () => setHash('') },
    { name: 'FAQ', href: '/#faq', isActive: isFaqActive, onClick: () => setHash('#faq') },
  ];

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
          onClick={() => setHash('')}
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
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={item.onClick}
              className={`nav-link-item ${item.isActive ? 'active' : ''}`}
              style={{
                fontSize: '0.9rem',
                fontWeight: item.isActive ? 750 : 600,
                color: item.isActive ? 'var(--text-color)' : 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.15s ease, font-weight 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-color)';
              }}
              onMouseLeave={(e) => {
                if (!item.isActive) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
