'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, localeCodes } from '@/i18n.config';
import { Globe, ChevronDown } from 'lucide-react';
import { useTransition } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { updateUserLanguagePreference } from '@/lib/user-preferences';
import { useAuth } from '@/contexts/AuthContext';

interface LanguageSwitcherProps {
  enableDarkMode?: boolean;
  /** Use 'dark' variant for dark backgrounds (like the landing header) */
  variant?: 'light' | 'dark';
}

export function LanguageSwitcher({ enableDarkMode = false, variant = 'light' }: LanguageSwitcherProps) {
  const isDark = variant === 'dark';
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={isPending}
          className={`flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8D6AFA] rounded-md transition-colors disabled:opacity-50 ${
            isDark
              ? 'text-gray-300 hover:text-white'
              : `text-gray-600 hover:text-gray-900 ${enableDarkMode ? 'dark:text-gray-300 dark:hover:text-white' : ''}`
          }`}
          aria-label={`${t('language')}: ${localeNames[locale as keyof typeof localeNames]}`}
        >
          {isPending ? (
            <div className={`h-4 w-4 border-2 rounded-full animate-spin ${isDark ? 'border-gray-500 border-t-white' : `border-gray-300 border-t-[#8D6AFA] ${enableDarkMode ? 'dark:border-gray-600' : ''}`}`} />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          <span className="text-xs">{localeCodes[locale as keyof typeof localeCodes]}</span>
          <ChevronDown className="w-3 h-3 transition-transform data-[state=open]:rotate-180" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={{ right: 16 }}
          sticky="always"
          className={`w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1 ${enableDarkMode ? 'dark:bg-gray-800 dark:ring-gray-700' : ''}`}
        >
          {locales.map((loc) => {
            const isActive = loc === locale;
            return (
              <DropdownMenu.Item
                key={loc}
                onSelect={() => handleLanguageChange(loc)}
                className={`
                  block w-full text-left px-4 py-2 text-sm transition-colors outline-none cursor-pointer
                  ${isActive
                    ? 'bg-[#8D6AFA] text-white'
                    : `text-gray-700 hover:bg-gray-100 focus:bg-gray-100 ${enableDarkMode ? 'dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:bg-gray-700' : ''}`
                  }
                `}
              >
                {localeNames[loc as keyof typeof localeNames]}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
