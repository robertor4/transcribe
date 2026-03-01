'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, localeCodes } from '@/i18n.config';
import { Globe, ChevronDown } from 'lucide-react';
import { useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={{ right: 16 }}
        className={`w-48 z-[80] ${
          isDark
            ? 'bg-[#1e1540] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : enableDarkMode ? 'dark:bg-gray-800 dark:border-gray-700' : ''
        }`}
      >
        {locales.map((loc) => {
          const isActive = loc === locale;
          return (
            <DropdownMenuItem
              key={loc}
              onSelect={() => handleLanguageChange(loc)}
              className={`
                cursor-pointer
                ${isActive
                  ? 'bg-[#8D6AFA] text-white focus:bg-[#7A5AE0] focus:text-white'
                  : isDark
                    ? 'text-white/70 focus:bg-white/10 focus:text-white'
                    : `${enableDarkMode ? 'dark:text-gray-300 dark:focus:bg-gray-700' : ''}`
                }
              `}
            >
              {localeNames[loc as keyof typeof localeNames]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
