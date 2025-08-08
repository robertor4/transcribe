'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames } from '@/i18n.config';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { updateUserLanguagePreference } from '@/lib/user-preferences';
import { useAuth } from '@/contexts/AuthContext';

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleLanguageChange = async (newLocale: string) => {
    // Get the current pathname without the locale
    const segments = pathname.split('/');
    const currentLocale = segments[1];
    
    // Check if the first segment is a locale
    if (locales.includes(currentLocale as any)) {
      segments[1] = newLocale;
    } else {
      // If no locale in path, add it
      segments.unshift(newLocale);
    }
    
    const newPath = segments.filter(Boolean).join('/');
    
    // Store the selected language in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLocale);
      
      // If user is logged in, save preference to backend
      if (user) {
        try {
          await updateUserLanguagePreference(newLocale);
        } catch (error) {
          console.error('Failed to save language preference:', error);
        }
      }
    }
    
    router.push(`/${newPath}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399] transition-colors"
        aria-label={t('language')}
      >
        <Globe className="w-4 h-4" />
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
        <div className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
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
                      : 'text-gray-700 hover:bg-gray-100'
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