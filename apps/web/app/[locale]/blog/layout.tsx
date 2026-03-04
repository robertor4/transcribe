import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getBlogMetadata, MetadataOverrides } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

const BLOG_METADATA: Record<string, MetadataOverrides> = {
  en: {
    title: 'Neural Summary | Blog',
    description:
      'Insights on voice-to-document workflows, AI productivity, and turning spoken ideas into structured professional output.',
    keywords: [
      'Neural Summary blog',
      'voice to document',
      'AI productivity',
      'speech to structure',
      'voice-first workflows',
      'AI document creation',
      'knowledge work automation',
      'transcription insights',
    ],
  },
  nl: {
    title: 'Neural Summary | Blog',
    description:
      'Inzichten over spraak-naar-document workflows, AI-productiviteit en het omzetten van gesproken ideeën in gestructureerde professionele output.',
    keywords: [
      'Neural Summary blog',
      'spraak naar document',
      'AI productiviteit',
      'spraak naar structuur',
      'spraakgestuurde workflows',
      'AI documentcreatie',
    ],
  },
  de: {
    title: 'Neural Summary | Blog',
    description:
      'Einblicke in Sprache-zu-Dokument-Workflows, KI-Produktivität und die Umwandlung gesprochener Ideen in strukturierte professionelle Ausgaben.',
    keywords: [
      'Neural Summary Blog',
      'Sprache zu Dokument',
      'KI Produktivität',
      'Sprache zu Struktur',
      'sprachgesteuerte Workflows',
      'KI Dokumenterstellung',
    ],
  },
  fr: {
    title: 'Neural Summary | Blog',
    description:
      'Perspectives sur les workflows voix-vers-document, la productivité IA et la transformation des idées parlées en documents professionnels structurés.',
    keywords: [
      'Neural Summary blog',
      'voix vers document',
      'productivité IA',
      'parole vers structure',
      'workflows vocaux',
      'création de documents IA',
    ],
  },
  es: {
    title: 'Neural Summary | Blog',
    description:
      'Perspectivas sobre flujos de trabajo de voz a documento, productividad con IA y la transformación de ideas habladas en documentos profesionales estructurados.',
    keywords: [
      'Neural Summary blog',
      'voz a documento',
      'productividad IA',
      'habla a estructura',
      'flujos de trabajo por voz',
      'creación de documentos IA',
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const metadata = BLOG_METADATA[locale] || BLOG_METADATA.en;
  return getBlogMetadata(locale, metadata);
}

export default function BlogLayout({ children }: Props) {
  return <>{children}</>;
}
