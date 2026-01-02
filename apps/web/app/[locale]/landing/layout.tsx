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
        'You speak. It creates. Turn spoken thinking into structured, professional documents with AI that interviews you and generates work-ready deliverables.',
    },
    twitter: {
      title: 'Neural Summary – You Speak. It Creates.',
      description:
        'Turn spoken thinking into structured documents. Upload conversations or let AI interview you. No writing. No formatting. Just think out loud.',
    },
  },
  nl: {
    openGraph: {
      description:
        'Jij spreekt. Het creëert. Transformeer gesproken gedachten in gestructureerde, professionele documenten met AI die je interviewt en werkklare deliverables genereert.',
    },
    twitter: {
      title: 'Neural Summary – Jij Spreekt. Het Creëert.',
      description:
        'Transformeer gesproken gedachten in gestructureerde documenten. Upload gesprekken of laat AI je interviewen. Geen schrijven. Geen formatteren. Gewoon hardop denken.',
    },
  },
  de: {
    openGraph: {
      description:
        'Du sprichst. Es kreiert. Verwandeln Sie gesprochene Gedanken in strukturierte, professionelle Dokumente mit KI, die Sie interviewt und arbeitsfertige Ergebnisse generiert.',
    },
    twitter: {
      title: 'Neural Summary – Du Sprichst. Es Kreiert.',
      description:
        'Verwandeln Sie gesprochene Gedanken in strukturierte Dokumente. Laden Sie Gespräche hoch oder lassen Sie sich von KI interviewen. Kein Schreiben. Keine Formatierung. Einfach laut denken.',
    },
  },
  fr: {
    openGraph: {
      description:
        'Vous parlez. Ça crée. Transformez vos pensées parlées en documents structurés et professionnels avec l\'IA qui vous interviewe et génère des livrables prêts à l\'emploi.',
    },
    twitter: {
      title: 'Neural Summary – Vous Parlez. Ça Crée.',
      description:
        'Transformez vos pensées parlées en documents structurés. Téléchargez des conversations ou laissez l\'IA vous interviewer. Sans écriture. Sans mise en forme. Pensez simplement à voix haute.',
    },
  },
  es: {
    openGraph: {
      description:
        'Tú hablas. Crea. Transforma el pensamiento hablado en documentos estructurados y profesionales con IA que te entrevista y genera entregables listos para trabajar.',
    },
    twitter: {
      title: 'Neural Summary – Tú Hablas. Crea.',
      description:
        'Transforma el pensamiento hablado en documentos estructurados. Sube conversaciones o deja que la IA te entreviste. Sin escribir. Sin formatear. Solo piensa en voz alta.',
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
