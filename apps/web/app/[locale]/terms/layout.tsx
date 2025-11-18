import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTermsMetadata, MetadataOverrides } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Terms of service page metadata
 */
const TERMS_METADATA: Record<string, MetadataOverrides> = {
  en: {
    title: 'Neural Summary | Terms of Service',
    description:
      'Terms and conditions for using Neural Summary voice-to-document creation platform. User rights, service terms, and legal agreements.',
    keywords: [
      'Neural Summary terms',
      'terms of service',
      'user agreement',
      'service terms',
      'legal terms',
      'AI transcription terms',
      'voice to document terms',
      'platform usage terms',
    ],
  },
  nl: {
    title: 'Neural Summary | Algemene Voorwaarden',
    description:
      'Algemene voorwaarden voor het gebruik van Neural Summary spraak-naar-document platform. Gebruikersrechten, servicevoorwaarden en juridische overeenkomsten.',
    keywords: [
      'Neural Summary voorwaarden',
      'algemene voorwaarden',
      'gebruikersovereenkomst',
      'servicevoorwaarden',
      'juridische voorwaarden',
      'AI transcriptie voorwaarden',
      'spraak naar document voorwaarden',
      'platform gebruiksvoorwaarden',
    ],
  },
  de: {
    title: 'Neural Summary | Nutzungsbedingungen',
    description:
      'Allgemeine Geschäftsbedingungen für die Nutzung der Neural Summary Sprache-zu-Dokument Plattform. Benutzerrechte, Servicebedingungen und rechtliche Vereinbarungen.',
    keywords: [
      'Neural Summary Bedingungen',
      'Nutzungsbedingungen',
      'Benutzervereinbarung',
      'Servicebedingungen',
      'rechtliche Bedingungen',
      'KI Transkription Bedingungen',
      'Sprache zu Dokument Bedingungen',
      'Plattform Nutzungsbedingungen',
    ],
  },
  fr: {
    title: 'Neural Summary | Conditions d\'Utilisation',
    description:
      'Conditions générales d\'utilisation de la plateforme de création voix-vers-document Neural Summary. Droits des utilisateurs, conditions de service et accords juridiques.',
    keywords: [
      'Neural Summary conditions',
      'conditions d\'utilisation',
      'accord utilisateur',
      'conditions de service',
      'conditions juridiques',
      'conditions transcription IA',
      'conditions voix vers document',
      'conditions d\'utilisation de la plateforme',
    ],
  },
  es: {
    title: 'Neural Summary | Términos de Servicio',
    description:
      'Términos y condiciones para usar la plataforma de creación de voz a documento Neural Summary. Derechos de usuario, términos de servicio y acuerdos legales.',
    keywords: [
      'Neural Summary términos',
      'términos de servicio',
      'acuerdo de usuario',
      'términos de servicio',
      'términos legales',
      'términos transcripción IA',
      'términos voz a documento',
      'términos de uso de plataforma',
    ],
  },
};

/**
 * Generate metadata for terms of service page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const metadata = TERMS_METADATA[locale] || TERMS_METADATA.en;
  return getTermsMetadata(locale, metadata);
}

export default function TermsLayout({ children }: Props) {
  return <>{children}</>;
}
