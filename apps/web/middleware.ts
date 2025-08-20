import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames, exclude /s/ share routes
  matcher: ['/', '/(de|en|es|fr|nl)/:path*', '/((?!api|_next|_vercel|s|.*\\..*).*)']
};