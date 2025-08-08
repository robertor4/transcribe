import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n.config';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Always use a locale prefix in the URL
  localePrefix: 'as-needed',
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en|es|fr|nl)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};