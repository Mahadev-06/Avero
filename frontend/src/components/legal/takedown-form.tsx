'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export const TakedownForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    work: '',
    url: '',
    explanation: '',
    declaration: false,
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => {
      setErrorMessage('');
      if (status === 'error') {
        setStatus('idle');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [errorMessage, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.declaration) {
      setErrorMessage('You must confirm the good faith declaration.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await apiClient.submitTakedown(formData);
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  if (status === 'success') {
    return (
      <div
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)',
          textAlign: 'center',
        }}
      >
        <h3 style={{ color: 'var(--color-primary-800)', margin: '0 0 0.5rem 0' }}>Notice Received</h3>
        <p style={{ color: 'var(--color-primary-900)', margin: 0 }}>
          Thank you. Your takedown notice has been logged and our legal compliance team will process it within 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <div>
        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.4rem' }}>
          Full Legal Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-neutral-300)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.4rem' }}>
          Contact Email Address *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-neutral-300)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.4rem' }}>
          Description of Copyrighted Work *
        </label>
        <input
          type="text"
          required
          value={formData.work}
          onChange={(e) => setFormData({ ...formData, work: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-neutral-300)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.4rem' }}>
          Target Infringing URL *
        </label>
        <input
          type="url"
          required
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-neutral-300)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.4rem' }}>
          Explanation & Statements *
        </label>
        <textarea
          required
          rows={4}
          value={formData.explanation}
          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-neutral-300)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <input
          type="checkbox"
          id="declaration"
          required
          checked={formData.declaration}
          onChange={(e) => setFormData({ ...formData, declaration: e.target.checked })}
          style={{ marginTop: '0.2rem' }}
        />
        <label htmlFor="declaration" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-700)', lineHeight: 1.4 }}>
          I declare under penalty of perjury that I am authorized to act on behalf of the owner of the copyright interest and that the information provided is accurate.
        </label>
      </div>

      {errorMessage && (
        <div style={{ color: 'var(--color-secondary-600)', fontSize: 'var(--font-size-xs)' }}>{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          padding: '0.85rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-primary-600)',
          color: '#ffffff',
          fontWeight: 'var(--font-weight-semibold)',
          fontSize: 'var(--font-size-sm)',
          border: 'none',
          cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit Takedown Notice'}
      </button>
    </form>
  );
};
