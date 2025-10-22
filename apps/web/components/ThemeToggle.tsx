'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    console.log('[ThemeToggle] Current theme:', theme);
    // Cycle through: light -> dark -> system -> light
    if (theme === 'light') {
      console.log('[ThemeToggle] Switching to dark');
      setTheme('dark');
    } else if (theme === 'dark') {
      console.log('[ThemeToggle] Switching to system');
      setTheme('system');
    } else {
      console.log('[ThemeToggle] Switching to light');
      setTheme('light');
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Light theme';
      case 'dark':
        return 'Dark theme';
      case 'system':
        return 'System theme';
      default:
        return 'Toggle theme';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        p-2 rounded-lg
        text-gray-700 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2
      "
      aria-label={getTooltip()}
      title={getTooltip()}
    >
      {getIcon()}
    </button>
  );
}
