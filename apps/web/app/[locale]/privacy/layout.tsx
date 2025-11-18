import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getPrivacyMetadata, MetadataOverrides } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Privacy policy page metadata
 */
const PRIVACY_METADATA: Record<string, MetadataOverrides> = {
  en: {
    title: 'Neural Summary | Privacy Policy',
    description:
      'Neural Summary privacy policy. Learn how we protect your data, handle audio files, and ensure GDPR compliance for voice-to-document creation.',
    keywords: [
      'Neural Summary privacy',
      'privacy policy',
      'data protection',
      'GDPR compliance',
      'audio file privacy',
      'voice data security',
      'transcription privacy',
      'AI document privacy',
    ],
  },
  nl: {
    title: 'Neural Summary | Privacybeleid',
    description:
      'Neural Summary privacybeleid. Ontdek hoe wij uw gegevens beschermen, audiobestanden verwerken en AVG-naleving waarborgen voor spraak-naar-document creatie.',
    keywords: [
      'Neural Summary privacy',
      'privacybeleid',
      'gegevensbescherming',
      'AVG-naleving',
      'audiobestand privacy',
      'spraakgegevens beveiliging',
      'transcriptie privacy',
      'AI document privacy',
    ],
  },
  de: {
    title: 'Neural Summary | Datenschutzrichtlinie',
    description:
      'Neural Summary Datenschutzrichtlinie. Erfahren Sie, wie wir Ihre Daten schützen, Audiodateien verarbeiten und DSGVO-Konformität für Sprache-zu-Dokument Erstellung gewährleisten.',
    keywords: [
      'Neural Summary Datenschutz',
      'Datenschutzrichtlinie',
      'Datenschutz',
      'DSGVO-Konformität',
      'Audiodatei Datenschutz',
      'Sprachdaten Sicherheit',
      'Transkription Datenschutz',
      'KI Dokument Datenschutz',
    ],
  },
  fr: {
    title: 'Neural Summary | Politique de Confidentialité',
    description:
      'Politique de confidentialité Neural Summary. Découvrez comment nous protégeons vos données, traitons les fichiers audio et assurons la conformité RGPD pour la création voix-vers-document.',
    keywords: [
      'Neural Summary confidentialité',
      'politique de confidentialité',
      'protection des données',
      'conformité RGPD',
      'confidentialité fichiers audio',
      'sécurité données vocales',
      'confidentialité transcription',
      'confidentialité documents IA',
    ],
  },
  es: {
    title: 'Neural Summary | Política de Privacidad',
    description:
      'Política de privacidad de Neural Summary. Descubra cómo protegemos sus datos, manejamos archivos de audio y garantizamos el cumplimiento del RGPD para la creación de voz a documento.',
    keywords: [
      'Neural Summary privacidad',
      'política de privacidad',
      'protección de datos',
      'cumplimiento RGPD',
      'privacidad archivos de audio',
      'seguridad datos de voz',
      'privacidad transcripción',
      'privacidad documentos IA',
    ],
  },
};

/**
 * Generate metadata for privacy policy page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const metadata = PRIVACY_METADATA[locale] || PRIVACY_METADATA.en;
  return getPrivacyMetadata(locale, metadata);
}

export default function PrivacyLayout({ children }: Props) {
  return <>{children}</>;
}
