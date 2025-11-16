export const locales = ['en', 'nl', 'de', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

export const localeCodes: Record<Locale, string> = {
  en: 'EN',
  nl: 'NL',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
};