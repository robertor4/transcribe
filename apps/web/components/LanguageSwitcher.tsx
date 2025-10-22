'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames } from '@/i18n.config';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect, useTransition } from 'react';
import { updateUserLanguagePreference } from '@/lib/user-preferences';
import { useAuth } from '@/contexts/AuthContext';

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    // Store the selected language in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLocale);
      
      // If user is logged in, try to save preference to backend (non-blocking)
      if (user) {
        updateUserLanguagePreference(newLocale).catch(console.error);
      }
    }
    
    // Use next-intl's router to change locale properly
    // The router from next-intl handles locale switching automatically
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
    
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399] transition-colors disabled:opacity-50"
        aria-label={t('language')}
      >
        {isPending ? (
          <div className="h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-[#cc3399] rounded-full animate-spin" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
        <span>{localeNames[locale as keyof typeof localeNames]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {locales.map((loc) => {
              const isActive = loc === locale;
              return (
                <button
                  key={loc}
                  onClick={() => handleLanguageChange(loc)}
                  className={`
                    block w-full text-left px-4 py-2 text-sm transition-colors
                    ${isActive
                      ? 'bg-[#cc3399] text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  role="menuitem"
                >
                  {localeNames[loc as keyof typeof localeNames]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}