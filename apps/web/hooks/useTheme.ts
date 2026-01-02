'use client';
import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load saved theme from localStorage
    const saved = (localStorage.getItem('theme') as ThemeMode) || 'system';
    setThemeState(saved);
    applyTheme(saved);

    // Listen to OS preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as ThemeMode || 'system';
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'system') {
      // System mode - respect OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      }
    }
    // Light mode - no dark class needed
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return { theme: 'system' as ThemeMode, setTheme: () => {} };
  }

  return { theme, setTheme };
}
