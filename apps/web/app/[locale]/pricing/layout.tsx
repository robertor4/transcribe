import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getPricingMetadata, MetadataOverrides } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Pricing page metadata
 */
const PRICING_METADATA: Record<string, MetadataOverrides> = {
  en: {
    title: 'Neural Summary | Pricing',
    description:
      'Flexible pricing plans for individuals and teams. Free tier available. Pro and Enterprise plans with advanced features, unlimited transcriptions, and priority support.',
    keywords: [
      'Neural Summary pricing',
      'voice to document pricing',
      'AI transcription plans',
      'document creation pricing',
      'free transcription plan',
      'professional transcription pricing',
      'enterprise AI document creation',
      'voice-to-output pricing',
      'AI interview assistant pricing',
      'conversation to document cost',
      'transcription service pricing',
      'AI document generator plans',
    ],
  },
  nl: {
    title: 'Neural Summary | Prijzen',
    description:
      'Flexibele prijsplannen voor individuen en teams. Gratis tier beschikbaar. Pro en Enterprise plannen met geavanceerde functies, onbeperkte transcripties en prioritaire ondersteuning.',
    keywords: [
      'Neural Summary prijzen',
      'spraak naar document prijzen',
      'AI transcriptie plannen',
      'documentcreatie prijzen',
      'gratis transcriptieplan',
      'professionele transcriptie prijzen',
      'enterprise AI documentcreatie',
      'spraak-naar-output prijzen',
      'AI interview assistent prijzen',
      'gesprek naar document kosten',
      'transcriptieservice prijzen',
      'AI documentgenerator plannen',
    ],
  },
  de: {
    title: 'Neural Summary | Preise',
    description:
      'Flexible Preispläne für Einzelpersonen und Teams. Kostenloser Tarif verfügbar. Pro- und Enterprise-Pläne mit erweiterten Funktionen, unbegrenzten Transkriptionen und vorrangigem Support.',
    keywords: [
      'Neural Summary Preise',
      'Sprache zu Dokument Preise',
      'KI Transkription Pläne',
      'Dokumenterstellung Preise',
      'kostenloser Transkriptionsplan',
      'professionelle Transkription Preise',
      'Enterprise KI Dokumenterstellung',
      'Sprache-zu-Output Preise',
      'KI Interview Assistent Preise',
      'Gespräch zu Dokument Kosten',
      'Transkriptionsservice Preise',
      'KI Dokumentgenerator Pläne',
    ],
  },
  fr: {
    title: 'Neural Summary | Tarifs',
    description:
      'Plans tarifaires flexibles pour particuliers et équipes. Niveau gratuit disponible. Plans Pro et Enterprise avec fonctionnalités avancées, transcriptions illimitées et support prioritaire.',
    keywords: [
      'Neural Summary tarifs',
      'voix vers document tarifs',
      'plans transcription IA',
      'tarifs création de documents',
      'plan transcription gratuit',
      'tarifs transcription professionnelle',
      'création de documents IA entreprise',
      'tarifs voix-vers-sortie',
      'tarifs assistant d\'interview IA',
      'coût conversation vers document',
      'tarifs service transcription',
      'plans générateur de documents IA',
    ],
  },
  es: {
    title: 'Neural Summary | Precios',
    description:
      'Planes de precios flexibles para individuos y equipos. Nivel gratuito disponible. Planes Pro y Enterprise con funciones avanzadas, transcripciones ilimitadas y soporte prioritario.',
    keywords: [
      'Neural Summary precios',
      'voz a documento precios',
      'planes transcripción IA',
      'precios creación de documentos',
      'plan transcripción gratuito',
      'precios transcripción profesional',
      'creación de documentos IA empresarial',
      'precios voz-a-salida',
      'precios asistente de entrevista IA',
      'costo conversación a documento',
      'precios servicio transcripción',
      'planes generador de documentos IA',
    ],
  },
};

/**
 * Generate metadata for pricing page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const metadata = PRICING_METADATA[locale] || PRICING_METADATA.en;
  return getPricingMetadata(locale, metadata);
}

export default function PricingLayout({ children }: Props) {
  return <>{children}</>;
}
