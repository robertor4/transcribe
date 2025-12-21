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
export const DEFAULT_OG_IMAGE = '/assets/logos/neural-summary-logo.svg';
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
    title: 'Neural Summary | Turn Conversations into Work-Ready Documents',
    description:
      'Voice-to-output creation platform. Turn conversations into product specs, articles, strategies, and emails instantly. AI interviews you, extracts ideas, generates deliverables. Speaking becomes creating.',
    keywords: [
      'voice to document',
      'conversation to document',
      'AI document creation',
      'voice-to-output platform',
      'AI interview assistant',
      'speaking to writing',
      'audio to document',
      'voice-powered creation',
      'AI document generator',
      'conversation to spec',
      'voice-activated writing',
      'AI transcription and analysis',
      'audio to article',
      'speech to document creation',
      'AI content generation from voice',
    ],
  },
  nl: {
    title: 'Neural Summary | Transformeer Gesprekken in Werkklare Documenten',
    description:
      'Van spraak naar document platform. Transformeer gesprekken direct in productspecificaties, artikelen, strategieën en e-mails. AI interviewt je, haalt ideeën eruit, genereert deliverables. Spreken wordt creëren.',
    keywords: [
      'spraak naar document',
      'gesprek naar document',
      'AI documentcreatie',
      'spraak-naar-output platform',
      'AI interview assistent',
      'spreken naar schrijven',
      'audio naar document',
      'spraakgestuurde creatie',
      'AI documentgenerator',
      'gesprek naar specificatie',
      'spraakgeactiveerd schrijven',
      'AI transcriptie en analyse',
      'audio naar artikel',
      'spraak naar documentcreatie',
      'AI contentgeneratie via spraak',
    ],
  },
  de: {
    title: 'Neural Summary | Verwandeln Sie Gespräche in Arbeitsbereite Dokumente',
    description:
      'Sprache-zu-Dokument Plattform. Verwandeln Sie Gespräche sofort in Produktspezifikationen, Artikel, Strategien und E-Mails. KI interviewt Sie, extrahiert Ideen, generiert Ergebnisse. Sprechen wird Erschaffen.',
    keywords: [
      'Sprache zu Dokument',
      'Gespräch zu Dokument',
      'KI Dokumenterstellung',
      'Sprache-zu-Output Plattform',
      'KI Interview Assistent',
      'Sprechen zu Schreiben',
      'Audio zu Dokument',
      'sprachgesteuerte Erstellung',
      'KI Dokumentgenerator',
      'Gespräch zu Spezifikation',
      'sprachaktiviertes Schreiben',
      'KI Transkription und Analyse',
      'Audio zu Artikel',
      'Sprache zu Dokumenterstellung',
      'KI Inhaltserstellung durch Sprache',
    ],
  },
  fr: {
    title: 'Neural Summary | Transformez les Conversations en Documents Prêts à l\'Emploi',
    description:
      'Plateforme de création voix-vers-document. Transformez instantanément les conversations en spécifications produit, articles, stratégies et e-mails. L\'IA vous interviewe, extrait les idées, génère les livrables. Parler devient créer.',
    keywords: [
      'voix vers document',
      'conversation vers document',
      'création de documents IA',
      'plateforme voix-vers-sortie',
      'assistant d\'interview IA',
      'parler vers écrire',
      'audio vers document',
      'création vocale',
      'générateur de documents IA',
      'conversation vers spécification',
      'écriture activée par la voix',
      'transcription et analyse IA',
      'audio vers article',
      'création de documents par la parole',
      'génération de contenu IA par la voix',
    ],
  },
  es: {
    title: 'Neural Summary | Convierte Conversaciones en Documentos Listos para Trabajar',
    description:
      'Plataforma de creación de voz a documento. Convierte conversaciones al instante en especificaciones de producto, artículos, estrategias y correos electrónicos. La IA te entrevista, extrae ideas, genera entregables. Hablar se convierte en crear.',
    keywords: [
      'voz a documento',
      'conversación a documento',
      'creación de documentos IA',
      'plataforma de voz a salida',
      'asistente de entrevista IA',
      'hablar a escribir',
      'audio a documento',
      'creación por voz',
      'generador de documentos IA',
      'conversación a especificación',
      'escritura activada por voz',
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
