'use client';

/**
 * TranslationDropdown - Language Selector for Conversation Translations
 *
 * Standalone dropdown button for translation options.
 * Used in shared view pages where there's no overflow menu.
 *
 * Displays a dropdown to:
 * - View original content
 * - Switch between available translations
 * - Trigger new translations (if not in read-only mode)
 *
 * NOTE: There's also TranslationMenuItems.tsx for the conversation page
 * which renders as menu items inside the 3-dot overflow menu. Both
 * components share similar logic for filtering untranslated locales.
 */

import { useState, useRef, useEffect } from 'react';
import { Globe, Check, Loader2, ChevronDown, Plus } from 'lucide-react';
import { SUPPORTED_LOCALES } from '@transcribe/shared';
import type { ConversationTranslations, LocaleTranslationStatus } from '@transcribe/shared';
import { useTranslations } from 'next-intl';

interface TranslationDropdownProps {
  /** Translation status with available locales */
  status: ConversationTranslations | null;
  /** Currently selected locale */
  currentLocale: string;
  /** Whether a translation is in progress */
  isTranslating: boolean;
  /** Whether the dropdown is in read-only mode (for shared views) */
  readOnly?: boolean;
  /** Callback when user selects an existing locale */
  onSelectLocale: (localeCode: string) => void;
  /** Callback when user wants to translate to a new locale (not required in readOnly mode) */
  onTranslate?: (localeCode: string) => void;
}

export function TranslationDropdown({
  status,
  currentLocale,
  isTranslating,
  readOnly = false,
  onSelectLocale,
  onTranslate,
}: TranslationDropdownProps) {
  const t = useTranslations('conversation.translation');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Get current locale display name
  const getCurrentLabel = () => {
    if (currentLocale === 'original') {
      return getOriginalLabel();
    }
    const locale = SUPPORTED_LOCALES.find((l) => l.code === currentLocale);
    return locale?.nativeName || locale?.language || currentLocale;
  };

  // Get original language label (e.g., "Nederlands (original)")
  const getOriginalLabel = () => {
    const originalLang = status?.originalLocale?.toLowerCase() || '';
    if (!originalLang) {
      return t('viewOriginal');
    }
    // Find matching locale to get native name
    const matchingLocale = SUPPORTED_LOCALES.find((l) => {
      const codePrefix = l.code.split('-')[0].toLowerCase();
      return (
        originalLang === codePrefix ||
        originalLang === l.language.toLowerCase() ||
        originalLang === l.nativeName.toLowerCase() ||
        originalLang.startsWith(codePrefix + '-') ||
        l.code.toLowerCase() === originalLang
      );
    });
    if (matchingLocale) {
      return `${matchingLocale.nativeName} (${t('original')})`;
    }
    // Fallback: capitalize the detected language code
    return `${originalLang.charAt(0).toUpperCase() + originalLang.slice(1)} (${t('original')})`;
  };

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
    } else if (!readOnly && onTranslate) {
      // Need to translate first (only if not read-only)
      onTranslate(code);
    }

    setIsOpen(false);
  };

  // Get locales that don't have translations yet (excluding original language)
  const getUntranslatedLocales = () => {
    const translatedCodes = new Set(status?.availableLocales.map((l) => l.code) || []);

    // Also exclude the original language - don't offer to translate Dutch to Dutch
    const originalLang = status?.originalLocale?.toLowerCase() || '';

    return SUPPORTED_LOCALES.filter((l) => {
      // Skip if already translated
      if (translatedCodes.has(l.code)) return false;

      // Skip if this is the original language
      // Match by: code prefix (e.g., 'nl' matches 'nl-NL'),
      // language name (e.g., 'Dutch' matches 'Dutch'),
      // or native name (e.g., 'Nederlands' matches 'Nederlands')
      const codePrefix = l.code.split('-')[0].toLowerCase();
      if (
        originalLang === codePrefix ||
        originalLang === l.language.toLowerCase() ||
        originalLang === l.nativeName.toLowerCase() ||
        originalLang.startsWith(codePrefix + '-') ||
        l.code.toLowerCase() === originalLang
      ) {
        return false;
      }

      return true;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        title={t('changeLanguage')}
      >
        {isTranslating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{getCurrentLabel()}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Original Language Option */}
          <button
            onClick={() => handleSelect('original')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
              currentLocale === 'original'
                ? 'bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA]'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>{getOriginalLabel()}</span>
            {currentLocale === 'original' && <Check className="w-4 h-4" />}
          </button>

          {/* Available Translations (if any) */}
          {status?.availableLocales && status.availableLocales.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('availableTranslations')}
              </div>
              {status.availableLocales.map((locale) => (
                <button
                  key={locale.code}
                  onClick={() => handleSelect(locale.code)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    currentLocale === locale.code
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span>{locale.nativeName}</span>
                    {locale.translatedAssetCount > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {locale.translatedAssetCount} {t('assetsTranslated')}
                      </span>
                    )}
                  </div>
                  {currentLocale === locale.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </>
          )}

          {/* Translate To Section (only if not read-only and there are untranslated locales) */}
          {!readOnly && getUntranslatedLocales().length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('translateTo')}
              </div>
              <div className="max-h-48 overflow-y-auto">
                {getUntranslatedLocales().map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => handleSelect(locale.code)}
                    disabled={isTranslating}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <span>{locale.nativeName}</span>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Empty state for read-only with no translations */}
          {readOnly && (!status?.availableLocales || status.availableLocales.length === 0) && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              {t('noTranslationsAvailable')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
