import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from '../i18n.config';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Always use a locale prefix in the URL
  localePrefix: 'always',
  
  // Store the locale preference in a cookie
  localeDetection: true,
});