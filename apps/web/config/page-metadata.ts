/**
 * Centralized SEO and metadata configuration
 *
 * Contains:
 * - SEO constants (base URL, OG image, site name)
 * - Locale mapping utilities for OpenGraph
 * - Landing page metadata (serves as universal fallback for all pages)
 *
 * Individual pages can override this fallback by defining their own metadata in layout files:
 * - /app/[locale]/landing/layout.tsx - Custom OpenGraph/Twitter overrides
 * - /app/[locale]/pricing/layout.tsx - Complete pricing metadata
 * - /app/[locale]/terms/layout.tsx - Complete terms metadata
 * - /app/[locale]/privacy/layout.tsx - Complete privacy metadata
 */

// ============================================================================
// SEO Constants
// ============================================================================

export const SEO_BASE_URL = 'https://neuralsummary.com';
export const DEFAULT_OG_IMAGE = '/assets/socials/neural-summary-og.png';
export const SITE_NAME = 'Neural Summary';

const OG_LOCALE_MAP: Record<string, string> = {
  en: 'en_US',
  nl: 'nl_NL',
  de: 'de_DE',
  fr: 'fr_FR',
  es: 'es_ES',
};

/**
 * Convert app locale to OpenGraph locale format
 */
export function resolveOgLocale(locale: string): string {
  return OG_LOCALE_MAP[locale as keyof typeof OG_LOCALE_MAP] ?? OG_LOCALE_MAP.en;
}

// ============================================================================
// Metadata Types and Content
// ============================================================================

export interface PageMetadataContent {
  title: string;
  description: string;
  keywords: string[];
  openGraph?: {
    title?: string;
    description?: string;
  };
  twitter?: {
    title?: string;
    description?: string;
  };
}

export type PageType = 'landing' | 'pricing' | 'terms' | 'privacy';

/**
 * Landing page metadata - serves as the universal fallback for all pages
 */
const LANDING_PAGE_METADATA: Record<string, PageMetadataContent> = {
  en: {
    title: 'Neural Summary – You Speak. It Creates.',
    description:
      'Turn spoken thinking into structured, professional documents. Upload conversations or let AI interview you to generate product specs, articles, strategies, and emails. No writing. No formatting. Just think out loud.',
    keywords: [
      'voice to document',
      'speech to structure',
      'AI document creation',
      'voice-to-output platform',
      'AI interview assistant',
      'speaking to writing',
      'audio to document',
      'voice-powered creation',
      'AI document generator',
      'conversation to spec',
      'transcription to deliverables',
      'AI transcription and analysis',
      'audio to article',
      'speech to document creation',
      'AI content generation from voice',
    ],
  },
  nl: {
    title: 'Neural Summary – Jij Spreekt. Het Creëert.',
    description:
      'Transformeer gesproken gedachten in gestructureerde, professionele documenten. Upload gesprekken of laat AI je interviewen om productspecificaties, artikelen, strategieën en e-mails te genereren. Geen schrijven. Geen formatteren. Gewoon hardop denken.',
    keywords: [
      'spraak naar document',
      'spraak naar structuur',
      'AI documentcreatie',
      'spraak-naar-output platform',
      'AI interview assistent',
      'spreken naar schrijven',
      'audio naar document',
      'spraakgestuurde creatie',
      'AI documentgenerator',
      'gesprek naar specificatie',
      'transcriptie naar deliverables',
      'AI transcriptie en analyse',
      'audio naar artikel',
      'spraak naar documentcreatie',
      'AI contentgeneratie via spraak',
    ],
  },
  de: {
    title: 'Neural Summary – Du Sprichst. Es Kreiert.',
    description:
      'Verwandeln Sie gesprochene Gedanken in strukturierte, professionelle Dokumente. Laden Sie Gespräche hoch oder lassen Sie sich von KI interviewen, um Produktspezifikationen, Artikel, Strategien und E-Mails zu generieren. Kein Schreiben. Keine Formatierung. Einfach laut denken.',
    keywords: [
      'Sprache zu Dokument',
      'Sprache zu Struktur',
      'KI Dokumenterstellung',
      'Sprache-zu-Output Plattform',
      'KI Interview Assistent',
      'Sprechen zu Schreiben',
      'Audio zu Dokument',
      'sprachgesteuerte Erstellung',
      'KI Dokumentgenerator',
      'Gespräch zu Spezifikation',
      'Transkription zu Lieferobjekten',
      'KI Transkription und Analyse',
      'Audio zu Artikel',
      'Sprache zu Dokumenterstellung',
      'KI Inhaltserstellung durch Sprache',
    ],
  },
  fr: {
    title: 'Neural Summary – Vous Parlez. Ça Crée.',
    description:
      'Transformez vos pensées parlées en documents structurés et professionnels. Téléchargez des conversations ou laissez l\'IA vous interviewer pour générer des spécifications produit, articles, stratégies et e-mails. Sans écriture. Sans mise en forme. Pensez simplement à voix haute.',
    keywords: [
      'voix vers document',
      'parole vers structure',
      'création de documents IA',
      'plateforme voix-vers-sortie',
      'assistant d\'interview IA',
      'parler vers écrire',
      'audio vers document',
      'création vocale',
      'générateur de documents IA',
      'conversation vers spécification',
      'transcription vers livrables',
      'transcription et analyse IA',
      'audio vers article',
      'création de documents par la parole',
      'génération de contenu IA par la voix',
    ],
  },
  es: {
    title: 'Neural Summary – Tú Hablas. Crea.',
    description:
      'Transforma el pensamiento hablado en documentos estructurados y profesionales. Sube conversaciones o deja que la IA te entreviste para generar especificaciones de producto, artículos, estrategias y correos electrónicos. Sin escribir. Sin formatear. Solo piensa en voz alta.',
    keywords: [
      'voz a documento',
      'habla a estructura',
      'creación de documentos IA',
      'plataforma de voz a salida',
      'asistente de entrevista IA',
      'hablar a escribir',
      'audio a documento',
      'creación por voz',
      'generador de documentos IA',
      'conversación a especificación',
      'transcripción a entregables',
      'transcripción y análisis IA',
      'audio a artículo',
      'creación de documentos por habla',
      'generación de contenido IA por voz',
    ],
  },
};

const DEFAULT_LOCALE = 'en';

/**
 * Get metadata content for locale (always returns landing page metadata as universal fallback)
 * Individual pages should define their own metadata in layout files
 */
export function getPageMetadataContent(locale: string): PageMetadataContent {
  // Always use landing page metadata as fallback
  return LANDING_PAGE_METADATA[locale] ?? LANDING_PAGE_METADATA[DEFAULT_LOCALE];
}
