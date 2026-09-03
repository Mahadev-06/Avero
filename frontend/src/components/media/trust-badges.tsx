"use client";

import React, { useState, useEffect } from 'react';
import { Zap, Sparkles, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TRUST_ITEMS = [
  {
    id: 'fast-processing',
    icon: <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    text: 'Fast Processing',
  },
  {
    id: 'free-unlimited',
    icon: <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />,
    text: '100% Free & Unlimited',
  },
  {
    id: 'multi-device',
    icon: <Smartphone className="w-4 h-4 text-blue-500 flex-shrink-0" />,
    text: 'iOS, Android & Desktop',
  },
];

export function TrustBadges() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TRUST_ITEMS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const currentItem = TRUST_ITEMS[index];

  return (
    <section
      className="trust-badges-section"
      style={{
        boxShadow: 'var(--nm-inset-sm)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'var(--bg-color)',
        padding: '1.15rem 0',
      }}
    >
      <div className="container" style={{ width: '100%' }}>
        {/* Desktop View (>= 769px): Full 3-badge horizontal row */}
        <div className="trust-badges-desktop">
          {TRUST_ITEMS.map((item) => (
            <span
              key={item.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-color)',
              }}
            >
              {item.icon}
              <strong>{item.text}</strong>
            </span>
          ))}
        </div>

        {/* Mobile View (<= 768px): Single animated pill looping one after another */}
        <div className="trust-badges-mobile">
          <div
            className="trust-badge-loop-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '38px',
              padding: '0.35rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-color)',
              boxShadow: '3px 3px 7px var(--neumorph-dark), -3px -3px 7px var(--neumorph-light)',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              overflow: 'hidden',
              position: 'relative',
              minWidth: '220px',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  color: 'var(--text-color)',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentItem.icon}
                <span>{currentItem.text}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
