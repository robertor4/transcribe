import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getPricingMetadata, MetadataOverrides } from '@/utils/metadata';
import { PricingProviders } from './providers';

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
      'Simple, premium pricing. Try Pro free for 14 days. Transform conversations into professional documents with AI-powered summaries, action items, and more.',
    keywords: [
      'Neural Summary pricing',
      'voice to document pricing',
      'AI transcription plans',
      'document creation pricing',
      'free trial transcription',
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
      'Eenvoudige premium prijzen. Probeer Pro 14 dagen gratis. Transformeer gesprekken naar professionele documenten met AI-samenvattingen, actiepunten en meer.',
    keywords: [
      'Neural Summary prijzen',
      'spraak naar document prijzen',
      'AI transcriptie plannen',
      'documentcreatie prijzen',
      'gratis proefperiode transcriptie',
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
      'Einfache Premium-Preise. 14 Tage Pro kostenlos testen. Verwandeln Sie Gespräche in professionelle Dokumente mit KI-Zusammenfassungen, Aktionspunkten und mehr.',
    keywords: [
      'Neural Summary Preise',
      'Sprache zu Dokument Preise',
      'KI Transkription Pläne',
      'Dokumenterstellung Preise',
      'kostenlose Testversion Transkription',
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
      'Tarifs premium simples. Essayez Pro gratuitement pendant 14 jours. Transformez vos conversations en documents professionnels avec des résumés IA, des actions et plus.',
    keywords: [
      'Neural Summary tarifs',
      'voix vers document tarifs',
      'plans transcription IA',
      'tarifs création de documents',
      'essai gratuit transcription',
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
      'Precios premium simples. Prueba Pro gratis durante 14 días. Transforma conversaciones en documentos profesionales con resúmenes IA, acciones y más.',
    keywords: [
      'Neural Summary precios',
      'voz a documento precios',
      'planes transcripción IA',
      'precios creación de documentos',
      'prueba gratuita transcripción',
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
  return <PricingProviders>{children}</PricingProviders>;
}
