import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLandingMetadata, MetadataOverrides } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Landing page metadata with custom OpenGraph and Twitter descriptions
 * optimized for social sharing
 */
const LANDING_OVERRIDES: Record<string, MetadataOverrides> = {
  en: {
    openGraph: {
      description:
        'Speaking becomes creating. Transform conversations into product specs, articles, and strategies with AI that interviews you and generates deliverables.',
    },
    twitter: {
      title: 'Neural Summary | Voice-to-Output Creation Platform',
      description:
        'Turn 3-minute conversations into complete product specs, articles, and strategies. AI interviews you, generates deliverables.',
    },
  },
  nl: {
    openGraph: {
      description:
        'Spreken wordt creëren. Transformeer gesprekken in productspecificaties, artikelen en strategieën met AI die je interviewt en deliverables genereert.',
    },
    twitter: {
      title: 'Neural Summary | Spraak-naar-Output Platform',
      description:
        'Transformeer 3-minuten gesprekken in complete productspecificaties, artikelen en strategieën. AI interviewt je en genereert deliverables.',
    },
  },
  de: {
    openGraph: {
      description:
        'Sprechen wird Erschaffen. Verwandeln Sie Gespräche in Produktspezifikationen, Artikel und Strategien mit KI, die Sie interviewt und Ergebnisse generiert.',
    },
    twitter: {
      title: 'Neural Summary | Sprache-zu-Output Plattform',
      description:
        'Verwandeln Sie 3-Minuten Gespräche in vollständige Produktspezifikationen, Artikel und Strategien. KI interviewt Sie und generiert Ergebnisse.',
    },
  },
  fr: {
    openGraph: {
      description:
        'Parler devient créer. Transformez les conversations en spécifications produit, articles et stratégies avec l\'IA qui vous interviewe et génère des livrables.',
    },
    twitter: {
      title: 'Neural Summary | Plateforme de Création Voix-vers-Document',
      description:
        'Transformez des conversations de 3 minutes en spécifications produit complètes, articles et stratégies. L\'IA vous interviewe et génère des livrables.',
    },
  },
  es: {
    openGraph: {
      description:
        'Hablar se convierte en crear. Transforma conversaciones en especificaciones de producto, artículos y estrategias con IA que te entrevista y genera entregables.',
    },
    twitter: {
      title: 'Neural Summary | Plataforma de Creación de Voz a Documento',
      description:
        'Convierte conversaciones de 3 minutos en especificaciones de producto completas, artículos y estrategias. La IA te entrevista y genera entregables.',
    },
  },
};

/**
 * Generate metadata for landing page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const overrides = LANDING_OVERRIDES[locale] || LANDING_OVERRIDES.en;
  return getLandingMetadata(locale, overrides);
}

export default function LandingLayout({ children }: Props) {
  return <>{children}</>;
}
