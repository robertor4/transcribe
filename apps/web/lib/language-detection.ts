import { locales, defaultLocale, type Locale } from '@/i18n.config';

export function detectUserLanguage(): Locale {
  // First check localStorage for user preference
  if (typeof window !== 'undefined') {
    const storedLanguage = localStorage.getItem('preferredLanguage');
    if (storedLanguage && locales.includes(storedLanguage as Locale)) {
      return storedLanguage as Locale;
    }
  }

  // Then check browser language
  if (typeof navigator !== 'undefined') {
    const browserLanguage = navigator.language;
    
    // Map browser language codes to our supported locales
    const languageMap: Record<string, Locale> = {
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'nl': 'nl',
      'nl-NL': 'nl',
      'nl-BE': 'nl',
      'de': 'de',
      'de-DE': 'de',
      'de-AT': 'de',
      'de-CH': 'de',
      'fr': 'fr',
      'fr-FR': 'fr',
      'fr-BE': 'fr',
      'fr-CH': 'fr',
      'es': 'es',
      'es-ES': 'es',
      'es-MX': 'es',
      'es-AR': 'es',
    };

    // Try exact match first
    if (languageMap[browserLanguage]) {
      return languageMap[browserLanguage];
    }

    // Try language code without region (e.g., 'en-US' -> 'en')
    const languageCode = browserLanguage.split('-')[0];
    if (languageMap[languageCode]) {
      return languageMap[languageCode];
    }

    // Check if the language code is directly in our locales
    if (locales.includes(languageCode as Locale)) {
      return languageCode as Locale;
    }
  }

  // Default to English
  return defaultLocale;
}

export function saveUserLanguagePreference(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredLanguage', locale);
  }
}