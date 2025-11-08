import { Metadata } from 'next';

/**
 * Base URL for the application
 */
const BASE_URL = 'https://neuralsummary.com';

/**
 * Default Open Graph image
 */
const DEFAULT_OG_IMAGE = '/assets/NS-symbol.webp';

/**
 * Locale-specific metadata configurations
 */
const LOCALE_CONFIGS = {
  en: {
    siteName: 'Neural Summary',
    defaultTitle: 'Neural Summary - AI-Powered Audio Transcription & Smart Summaries',
    defaultDescription: 'Transform audio recordings into accurate transcripts and intelligent summaries. 99.5% accuracy, 50+ languages, enterprise security.',
    ogLocale: 'en_US',
  },
  nl: {
    siteName: 'Neural Summary',
    defaultTitle: 'Neural Summary - AI-gebaseerde audio transcriptie & slimme samenvattingen',
    defaultDescription: 'Transformeer audio-opnames naar nauwkeurige transcripties en intelligente samenvattingen. 99,5% nauwkeurigheid, 50+ talen, enterprise beveiliging.',
    ogLocale: 'nl_NL',
  },
  de: {
    siteName: 'Neural Summary',
    defaultTitle: 'Neural Summary - KI-gestützte Audiotranskription & Intelligente Zusammenfassungen',
    defaultDescription: 'Verwandeln Sie Audioaufnahmen in präzise Transkripte und intelligente Zusammenfassungen. 99,5% Genauigkeit, 50+ Sprachen, Unternehmenssicherheit.',
    ogLocale: 'de_DE',
  },
  fr: {
    siteName: 'Neural Summary',
    defaultTitle: 'Neural Summary - Transcription Audio IA & Résumés Intelligents',
    defaultDescription: 'Transformez vos enregistrements audio en transcriptions précises et résumés intelligents. 99,5% de précision, 50+ langues, sécurité entreprise.',
    ogLocale: 'fr_FR',
  },
  es: {
    siteName: 'Neural Summary',
    defaultTitle: 'Neural Summary - Transcripción de Audio IA & Resúmenes Inteligentes',
    defaultDescription: 'Transforme grabaciones de audio en transcripciones precisas y resúmenes inteligentes. 99,5% de precisión, 50+ idiomas, seguridad empresarial.',
    ogLocale: 'es_ES',
  },
};

/**
 * Get default metadata for a locale
 */
export function getDefaultMetadata(locale: string = 'en'): Metadata {
  const config = LOCALE_CONFIGS[locale as keyof typeof LOCALE_CONFIGS] || LOCALE_CONFIGS.en;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: config.defaultTitle,
      template: `%s | ${config.siteName}`,
    },
    description: config.defaultDescription,
    openGraph: {
      type: 'website',
      locale: config.ogLocale,
      url: BASE_URL,
      siteName: config.siteName,
      title: config.defaultTitle,
      description: config.defaultDescription,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${config.siteName} - AI Transcription Platform`,
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.defaultTitle,
      description: config.defaultDescription,
      site: '@neuralsummary',
      creator: '@neuralsummary',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Get page-specific metadata with overrides
 */
export function getPageMetadata(
  page: {
    title: string;
    description: string;
    path?: string;
    image?: string;
    noIndex?: boolean;
  },
  locale: string = 'en',
): Metadata {
  const config = LOCALE_CONFIGS[locale as keyof typeof LOCALE_CONFIGS] || LOCALE_CONFIGS.en;
  const fullUrl = page.path ? `${BASE_URL}${page.path}` : BASE_URL;
  const ogImage = page.image || DEFAULT_OG_IMAGE;

  return {
    title: page.title,
    description: page.description,
    ...(page.noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      type: 'website',
      locale: config.ogLocale,
      url: fullUrl,
      siteName: config.siteName,
      title: page.title,
      description: page.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: page.title,
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      site: '@neuralsummary',
      creator: '@neuralsummary',
      images: [ogImage],
    },
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
  const config = LOCALE_CONFIGS[locale as keyof typeof LOCALE_CONFIGS] || LOCALE_CONFIGS.en;
  const shareUrl = `${BASE_URL}/${locale}/shared/${transcript.shareToken}`;

  // Truncate summary for OG description (max 200 chars recommended, min 100 for LinkedIn)
  let description = transcript.summary
    ? transcript.summary.substring(0, 200) + (transcript.summary.length > 200 ? '...' : '')
    : `View this transcript shared via ${config.siteName}. Transform audio recordings into accurate transcripts and intelligent summaries with AI-powered analysis.`;

  // Ensure description is at least 100 characters for LinkedIn
  if (description.length < 100) {
    description = `${description} Transform audio recordings into accurate transcripts and intelligent summaries with AI-powered analysis.`;
  }

  return {
    title: transcript.title,
    description,
    openGraph: {
      type: 'article',
      locale: config.ogLocale,
      url: shareUrl,
      siteName: config.siteName,
      title: transcript.title,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${transcript.title} - ${config.siteName}`,
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: transcript.title,
      description,
      site: '@neuralsummary',
      creator: '@neuralsummary',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Get metadata for pricing page
 */
export function getPricingMetadata(locale: string = 'en'): Metadata {
  const titles: Record<string, string> = {
    en: 'Pricing - Choose Your Plan',
    nl: 'Prijzen - Kies Uw Plan',
    de: 'Preise - Wählen Sie Ihren Plan',
    fr: 'Tarifs - Choisissez Votre Plan',
    es: 'Precios - Elija Su Plan',
  };

  const descriptions: Record<string, string> = {
    en: 'Flexible pricing plans for individuals and teams. Free tier available. Pro and Enterprise plans with advanced features, unlimited transcriptions, and priority support.',
    nl: 'Flexibele prijsplannen voor individuen en teams. Gratis tier beschikbaar. Pro en Enterprise plannen met geavanceerde functies, onbeperkte transcripties en prioritaire ondersteuning.',
    de: 'Flexible Preispläne für Einzelpersonen und Teams. Kostenloser Tarif verfügbar. Pro- und Enterprise-Pläne mit erweiterten Funktionen, unbegrenzten Transkriptionen und vorrangigem Support.',
    fr: 'Plans tarifaires flexibles pour particuliers et équipes. Niveau gratuit disponible. Plans Pro et Enterprise avec fonctionnalités avancées, transcriptions illimitées et support prioritaire.',
    es: 'Planes de precios flexibles para individuos y equipos. Nivel gratuito disponible. Planes Pro y Enterprise con funciones avanzadas, transcripciones ilimitadas y soporte prioritario.',
  };

  return getPageMetadata(
    {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      path: `/${locale}/pricing`,
    },
    locale,
  );
}

/**
 * Get metadata for dashboard (authenticated pages - no indexing)
 */
export function getDashboardMetadata(locale: string = 'en'): Metadata {
  const titles: Record<string, string> = {
    en: 'Dashboard',
    nl: 'Dashboard',
    de: 'Dashboard',
    fr: 'Tableau de Bord',
    es: 'Panel de Control',
  };

  const descriptions: Record<string, string> = {
    en: 'Manage your transcriptions and AI summaries.',
    nl: 'Beheer uw transcripties en AI-samenvattingen.',
    de: 'Verwalten Sie Ihre Transkriptionen und KI-Zusammenfassungen.',
    fr: 'Gérez vos transcriptions et résumés IA.',
    es: 'Administre sus transcripciones y resúmenes de IA.',
  };

  return getPageMetadata(
    {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      path: `/${locale}/dashboard`,
      noIndex: true, // Don't index authenticated pages
    },
    locale,
  );
}
