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
    console.log('[useTheme] Applying theme:', mode);
    console.log('[useTheme] Current classes before:', root.className);

    root.classList.remove('light', 'dark');

    if (mode === 'light') {
      // Light mode - remove dark class
      console.log('[useTheme] Setting light mode - removing dark class');
    } else if (mode === 'dark') {
      console.log('[useTheme] Setting dark mode - adding dark class');
      root.classList.add('dark');
    } else {
      // System mode - respect OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('[useTheme] System mode - prefers dark?', prefersDark);
      if (prefersDark) {
        root.classList.add('dark');
      }
    }

    console.log('[useTheme] Current classes after:', root.className);
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
