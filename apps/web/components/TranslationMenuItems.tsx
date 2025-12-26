'use client';

/**
 * TranslationMenuItems - Inline translation options for dropdown menus
 *
 * Renders translation options as menu items instead of a separate dropdown.
 * Used within DropdownMenu for the conversation overflow menu.
 * Starts collapsed and expands when user clicks on the header.
 */

import { useState } from 'react';
import { Globe, Check, Loader2, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { SUPPORTED_LOCALES } from '@transcribe/shared';
import type { ConversationTranslations, LocaleTranslationStatus } from '@transcribe/shared';
import { useTranslations } from 'next-intl';

interface TranslationMenuItemsProps {
  /** Translation status with available locales */
  status: ConversationTranslations | null;
  /** Currently selected locale */
  currentLocale: string;
  /** Whether a translation is in progress */
  isTranslating: boolean;
  /** Callback when user selects an existing locale */
  onSelectLocale: (localeCode: string) => void;
  /** Callback when user wants to translate to a new locale */
  onTranslate: (localeCode: string) => void;
}

export function TranslationMenuItems({
  status,
  currentLocale,
  isTranslating,
  onSelectLocale,
  onTranslate,
}: TranslationMenuItemsProps) {
  const t = useTranslations('conversation.translation');
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if a locale has translations
  const getLocaleStatus = (code: string): LocaleTranslationStatus | undefined => {
    return status?.availableLocales.find((l) => l.code === code);
  };

  // Handle locale selection
  const handleSelect = (code: string) => {
    const localeStatus = getLocaleStatus(code);

    if (code === 'original') {
      onSelectLocale('original');
    } else if (localeStatus?.hasSummaryTranslation) {
      // Already translated - just switch
      onSelectLocale(code);
    } else {
      // Need to translate first
      onTranslate(code);
    }
  };

  // Get locales that don't have translations yet
  const getUntranslatedLocales = () => {
    const translatedCodes = new Set(status?.availableLocales.map((l) => l.code) || []);
    return SUPPORTED_LOCALES.filter((l) => !translatedCodes.has(l.code));
  };

  return (
    <div className="py-1">
      {/* Collapsible header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
      >
        {isTranslating ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
        ) : (
          <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
        <span className="flex-1 text-left">{t('changeLanguage')}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <>
          {/* Original Language Option */}
          <button
            onClick={() => handleSelect('original')}
            disabled={isTranslating}
            className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              currentLocale === 'original'
                ? 'bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA]'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>{t('viewOriginal')}</span>
            {currentLocale === 'original' && <Check className="w-4 h-4" />}
          </button>

          {/* Available Translations */}
          {status?.availableLocales && status.availableLocales.length > 0 && (
            <>
              {status.availableLocales.map((locale) => (
                <button
                  key={locale.code}
                  onClick={() => handleSelect(locale.code)}
                  disabled={isTranslating}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
                    currentLocale === locale.code
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{locale.nativeName}</span>
                  {currentLocale === locale.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </>
          )}

          {/* Translate To Section */}
          {getUntranslatedLocales().length > 0 && (
            <>
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
              <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('translateTo')}
              </div>
              <div className="max-h-32 overflow-y-auto">
                {getUntranslatedLocales().map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => handleSelect(locale.code)}
                    disabled={isTranslating}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <span>{locale.nativeName}</span>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
