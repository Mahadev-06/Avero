"use client";

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { BlogFAQ } from '@/lib/blog-data';

interface BlogFaqAccordionProps {
  faqs: BlogFAQ[];
  platformName?: string;
}

export function BlogFaqAccordion({ faqs, platformName = 'Platform' }: BlogFaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-color)',
            boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)',
            border: '1px solid rgba(255, 255, 255, 0.65)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-color)',
          }}
        >
          <HelpCircle className="w-4 h-4" />
        </div>
        <h2
          style={{
            fontSize: 'clamp(1.25rem, 3vw, 1.55rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-color)',
            margin: 0,
          }}
        >
          Frequently Asked Questions About {platformName} Downloads
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              style={{
                borderRadius: '18px',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid rgba(255, 255, 255, 0.65)',
                boxShadow: isOpen
                  ? 'inset 4px 4px 8px var(--neumorph-dark), inset -4px -4px 8px var(--neumorph-light)'
                  : '5px 5px 12px var(--neumorph-dark), -5px -5px 12px var(--neumorph-light)',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.35rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: '1rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: 'var(--text-color)',
                    lineHeight: 1.4,
                  }}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className="w-4 h-4"
                  style={{
                    flexShrink: 0,
                    color: 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: '0 1.35rem 1.15rem 1.35rem',
                    fontSize: '0.92rem',
                    lineHeight: 1.65,
                    color: 'var(--text-muted)',
                    borderTop: '1px solid rgba(0, 0, 0, 0.04)',
                    paddingTop: '0.85rem',
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
