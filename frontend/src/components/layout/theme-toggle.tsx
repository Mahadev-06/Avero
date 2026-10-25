"use client";
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);
  }, []);

  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle Theme"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      className="pill-btn text-dark"
      style={{
        width: '38px',
        height: '38px',
        minHeight: '38px',
        borderRadius: '50%',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-amber-600" />
      ) : (
        <Sun className="w-4 h-4 text-amber-400" />
      )}
    </button>
  );
}
