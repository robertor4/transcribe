import { Metadata } from 'next';
import {
  DEFAULT_OG_IMAGE,
  SEO_BASE_URL,
  SITE_NAME,
  resolveOgLocale,
} from '@/config/seo';
import { getPageMetadataContent, PageType } from '@/config/page-metadata';

const DASHBOARD_TITLES: Record<string, string> = {
  en: 'Dashboard',
  nl: 'Dashboard',
  de: 'Dashboard',
  fr: 'Tableau de Bord',
  es: 'Panel de Control',
};

const DASHBOARD_DESCRIPTIONS: Record<string, string> = {
  en: 'Manage your transcriptions and AI summaries.',
  nl: 'Beheer uw transcripties en AI-samenvattingen.',
  de: 'Verwalten Sie Ihre Transkriptionen und KI-Zusammenfassungen.',
  fr: 'Gérez vos transcriptions et résumés IA.',
  es: 'Administre sus transcripciones y resúmenes de IA.',
};

function buildOpenGraphConfig({
  locale,
  title,
  description,
  url,
  type,
}: {
  locale: string;
  title: string;
  description: string;
  url: string;
  type: 'website' | 'article';
}) {
  return {
    type,
    locale: resolveOgLocale(locale),
    url,
    siteName: SITE_NAME,
    title,
    description,
    images: [
      {
        url: `${SEO_BASE_URL}${DEFAULT_OG_IMAGE}`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  };
}

function buildTwitterConfig(title: string, description: string) {
  return {
    card: 'summary_large_image',
    title,
    description,
    site: '@neuralsummary',
    creator: '@neuralsummary',
    images: [`${SEO_BASE_URL}${DEFAULT_OG_IMAGE}`],
  };
}

/**
 * Get metadata for shared transcripts
 */
export function getShareMetadata(
  transcript: {
    title: string;
    summary?: string;
    shareToken: string;
  },
  locale: string = 'en',
): Metadata {
  const shareUrl = `${SEO_BASE_URL}/${locale}/shared/${transcript.shareToken}`;

  // Truncate summary for OG description (max 200 chars recommended, min 100 for LinkedIn)
  let description = transcript.summary
    ? transcript.summary.substring(0, 200) + (transcript.summary.length > 200 ? '...' : '')
    : `View this transcript shared via ${SITE_NAME}. Transform audio recordings into accurate transcripts and intelligent summaries with AI-powered analysis.`;

  // Ensure description is at least 100 characters for LinkedIn
  if (description.length < 100) {
    description = `${description} Transform audio recordings into accurate transcripts and intelligent summaries with AI-powered analysis.`;
  }

  return {
    title: transcript.title,
    description,
    openGraph: buildOpenGraphConfig({
      locale,
      title: transcript.title,
      description,
      url: shareUrl,
      type: 'article',
    }),
    twitter: buildTwitterConfig(transcript.title, description),
  };
}

/**
 * Get metadata for dashboard (authenticated pages - no indexing)
 */
export function getDashboardMetadata(locale: string = 'en'): Metadata {
  const title = DASHBOARD_TITLES[locale] || DASHBOARD_TITLES.en;
  const description = DASHBOARD_DESCRIPTIONS[locale] || DASHBOARD_DESCRIPTIONS.en;
  const url = `${SEO_BASE_URL}/${locale}/dashboard`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: buildOpenGraphConfig({
      locale,
      title,
      description,
      url,
      type: 'website',
    }),
    twitter: buildTwitterConfig(title, description),
  };
}

/**
 * Generic helper to build metadata for public pages
 */
function buildPageMetadata(pageType: PageType, locale: string, urlPath: string): Metadata {
  const content = getPageMetadataContent(pageType, locale);
  const pageUrl = `${SEO_BASE_URL}/${locale}${urlPath}`;

  const ogTitle = content.openGraph?.title ?? content.title;
  const ogDescription = content.openGraph?.description ?? content.description;
  const twitterTitle = content.twitter?.title ?? content.title;
  const twitterDescription = content.twitter?.description ?? content.description;

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    openGraph: buildOpenGraphConfig({
      locale,
      title: ogTitle,
      description: ogDescription,
      url: pageUrl,
      type: 'website',
    }),
    twitter: buildTwitterConfig(twitterTitle, twitterDescription),
  };
}

/**
 * Get metadata for landing page
 */
export function getLandingMetadata(locale: string = 'en'): Metadata {
  return buildPageMetadata('landing', locale, '/landing');
}

/**
 * Get metadata for pricing page
 */
export function getPricingMetadata(locale: string = 'en'): Metadata {
  return buildPageMetadata('pricing', locale, '/pricing');
}

/**
 * Get metadata for terms of service page
 */
export function getTermsMetadata(locale: string = 'en'): Metadata {
  return buildPageMetadata('terms', locale, '/terms');
}

/**
 * Get metadata for privacy policy page
 */
export function getPrivacyMetadata(locale: string = 'en'): Metadata {
  return buildPageMetadata('privacy', locale, '/privacy');
}
