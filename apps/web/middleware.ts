import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const MARKETING_HOST = 'neuralsummary.com';
const APP_HOST = 'app.neuralsummary.com';

// Route segments that belong on the marketing domain
const MARKETING_SEGMENTS = new Set([
  'landing',
  'pricing',
  'contact',
  'examples',
  'privacy',
  'terms',
]);

// Route segments served on both domains (no redirect)
const NEUTRAL_SEGMENTS = new Set(['shared']);

const LOCALES = new Set(['en', 'nl', 'de', 'fr', 'es']);

function getFirstSegment(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  // Skip locale prefix if present
  const start = LOCALES.has(parts[0]) ? 1 : 0;
  return parts[start] || null;
}

export default function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] || '';

  // Development / non-production: skip domain routing entirely
  if (
    hostname !== MARKETING_HOST &&
    hostname !== `www.${MARKETING_HOST}` &&
    hostname !== APP_HOST
  ) {
    return intlMiddleware(request);
  }

  const { pathname, search } = request.nextUrl;

  // www → non-www (permanent redirect)
  if (hostname === `www.${MARKETING_HOST}`) {
    const url = request.nextUrl.clone();
    url.host = MARKETING_HOST;
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  const segment = getFirstSegment(pathname);

  // Neutral routes (e.g. /shared): no domain redirect
  if (segment && NEUTRAL_SEGMENTS.has(segment)) {
    return intlMiddleware(request);
  }

  const isMarketingRoute =
    segment === null || MARKETING_SEGMENTS.has(segment);
  const isOnMarketing = hostname === MARKETING_HOST;
  const isOnApp = hostname === APP_HOST;

  // App domain root (no segment) → let through to page.tsx which redirects to /dashboard
  if (isOnApp && segment === null) {
    return intlMiddleware(request);
  }

  // Marketing route on app domain → redirect to marketing
  if (isOnApp && isMarketingRoute) {
    return NextResponse.redirect(
      new URL(`https://${MARKETING_HOST}${pathname}${search}`),
      301,
    );
  }

  // App route on marketing domain → redirect to app
  if (isOnMarketing && !isMarketingRoute) {
    return NextResponse.redirect(
      new URL(`https://${APP_HOST}${pathname}${search}`),
      301,
    );
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames, exclude /s/ share routes
  matcher: [
    '/',
    '/(de|en|es|fr|nl)/:path*',
    '/((?!api|_next|_vercel|s|.*\\..*).*)'],
};
