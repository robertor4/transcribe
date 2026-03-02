'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, Check, Loader2, Plus, Lock, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { SUPPORTED_LOCALES } from '@transcribe/shared';
import type { ConversationTranslations, LocaleTranslationStatus } from '@transcribe/shared';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface TranslationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ConversationTranslations | null;
  currentLocale: string;
  isTranslating: boolean;
  userTier?: string;
  isAdmin?: boolean;
  onSelectLocale: (localeCode: string) => void;
  onTranslate: (localeCode: string) => void;
}

export function TranslationDialog({
  open,
  onOpenChange,
  status,
  currentLocale,
  isTranslating,
  userTier = 'free',
  isAdmin = false,
  onSelectLocale,
  onTranslate,
}: TranslationDialogProps) {
  const t = useTranslations('conversation.translation');
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [translatingLocale, setTranslatingLocale] = useState<string | null>(null);
  const [showSlowHint, setShowSlowHint] = useState(false);
  const slowHintTimer = useRef<NodeJS.Timeout | null>(null);
  const slowHintRef = useRef<HTMLParagraphElement | null>(null);

  // Show a hint after 10s of translating
  useEffect(() => {
    if (isTranslating) {
      slowHintTimer.current = setTimeout(() => setShowSlowHint(true), 5000);
    } else {
      setShowSlowHint(false);
      if (slowHintTimer.current) clearTimeout(slowHintTimer.current);
    }
    return () => {
      if (slowHintTimer.current) clearTimeout(slowHintTimer.current);
    };
  }, [isTranslating]);

  // Scroll hint into view when it appears
  useEffect(() => {
    if (showSlowHint && slowHintRef.current) {
      slowHintRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showSlowHint]);

  const canTranslate = isAdmin || userTier !== 'free';

  const getOriginalLabel = () => {
    const originalLang = status?.originalLocale?.toLowerCase() || '';
    if (!originalLang) return t('viewOriginal');

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

    return matchingLocale?.nativeName || originalLang.charAt(0).toUpperCase() + originalLang.slice(1);
  };

  const getLocaleStatus = (code: string): LocaleTranslationStatus | undefined => {
    return status?.availableLocales.find((l) => l.code === code);
  };

  const getUntranslatedLocales = () => {
    const translatedCodes = new Set(status?.availableLocales.map((l) => l.code) || []);
    const originalLang = status?.originalLocale?.toLowerCase() || '';

    return SUPPORTED_LOCALES.filter((l) => {
      if (translatedCodes.has(l.code)) return false;
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

  const handleSelect = (code: string) => {
    if (code === 'original') {
      onSelectLocale('original');
    } else {
      const localeStatus = getLocaleStatus(code);
      if (localeStatus?.hasSummaryTranslation) {
        onSelectLocale(code);
      } else {
        setTranslatingLocale(code);
        onTranslate(code);
      }
    }
  };

  const translatedLocales = status?.availableLocales || [];
  const untranslatedLocales = getUntranslatedLocales();
  const isActive = (code: string) => currentLocale === code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            {t('dialogTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto -mx-6 px-6">
          {/* Original language */}
          <button
            onClick={() => handleSelect('original')}
            disabled={isTranslating}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
              isActive('original')
                ? 'bg-purple-50 dark:bg-purple-900/20 text-[#8D6AFA]'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isActive('original') ? 'bg-[#8D6AFA]' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <span className="text-sm font-medium">{getOriginalLabel()}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">({t('original')})</span>
            </div>
            {isActive('original') && <Check className="w-4 h-4 text-[#8D6AFA]" />}
          </button>

          {/* Translated locales */}
          {translatedLocales.map((locale) => (
            <button
              key={locale.code}
              onClick={() => handleSelect(locale.code)}
              disabled={isTranslating}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                isActive(locale.code)
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-[#8D6AFA]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isActive(locale.code) ? 'bg-[#8D6AFA]' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <span className="text-sm font-medium">{locale.nativeName}</span>
              </div>
              <div className="flex items-center gap-2">
                {isActive(locale.code) ? (
                  <Check className="w-4 h-4 text-[#8D6AFA]" />
                ) : (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {t('translated')}
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Untranslated locales section */}
          {untranslatedLocales.length > 0 && (
            <>
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

              {canTranslate ? (
                <>
                  <button
                    onClick={() => setShowAllLanguages(!showAllLanguages)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <span>{showAllLanguages ? t('hideLanguages') : t('showAllLanguages')}</span>
                    {showAllLanguages ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showAllLanguages && (
                    <div className="space-y-0.5">
                      {untranslatedLocales.map((locale) => {
                        const isTranslatingThis = isTranslating && translatingLocale === locale.code;
                        return (
                          <div key={locale.code}>
                            <button
                              onClick={() => handleSelect(locale.code)}
                              disabled={isTranslating}
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span className="text-sm font-medium">{locale.nativeName}</span>
                              </div>
                              {isTranslatingThis ? (
                                <span className="text-xs text-[#8D6AFA] flex items-center gap-1.5">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  {t('translating')}
                                </span>
                              ) : (
                                <span className="text-xs text-[#8D6AFA] flex items-center gap-1">
                                  <Plus className="w-3 h-3" />
                                  {t('translate')}
                                </span>
                              )}
                            </button>
                            {isTranslatingThis && showSlowHint && (
                              <p ref={slowHintRef} className="flex items-start gap-1.5 px-8 pb-2 text-xs text-gray-500 dark:text-gray-400">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                {t('slowHint')}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-3 py-4">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {t('proFeature')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('upgradeToTranslate')}
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {t('upgradeToPro')}
                  </Link>
                </div>
              )}
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
