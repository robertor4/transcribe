/**
 * Centralized SEO metadata content for all public pages
 * Separated from UI translations to maintain clear distinction between marketing/SEO content
 */

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
    openGraph: {
      title: 'Neural Summary | Turn Conversations into Work-Ready Documents',
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
    openGraph: {
      title: 'Neural Summary | Transformeer Gesprekken in Werkklare Documenten',
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
    openGraph: {
      title: 'Neural Summary | Verwandeln Sie Gespräche in Arbeitsbereite Dokumente',
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
    openGraph: {
      title: 'Neural Summary | Transformez les Conversations en Documents Prêts à l\'Emploi',
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
    openGraph: {
      title: 'Neural Summary | Convierte Conversaciones en Documentos Listos para Trabajar',
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

const PRICING_PAGE_METADATA: Record<string, PageMetadataContent> = {
  en: {
    title: 'Pricing - Choose Your Plan',
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
    title: 'Prijzen - Kies Uw Plan',
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
    title: 'Preise - Wählen Sie Ihren Plan',
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
    title: 'Tarifs - Choisissez Votre Plan',
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
    title: 'Precios - Elija Su Plan',
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

const TERMS_PAGE_METADATA: Record<string, PageMetadataContent> = {
  en: {
    title: 'Terms of Service',
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
    title: 'Algemene Voorwaarden',
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
    title: 'Nutzungsbedingungen',
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
    title: 'Conditions d\'Utilisation',
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
    title: 'Términos de Servicio',
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

const PRIVACY_PAGE_METADATA: Record<string, PageMetadataContent> = {
  en: {
    title: 'Privacy Policy',
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
    title: 'Privacybeleid',
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
    title: 'Datenschutzrichtlinie',
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
    title: 'Politique de Confidentialité',
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
    title: 'Política de Privacidad',
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

const DEFAULT_LOCALE = 'en';

const PAGE_METADATA_MAP: Record<PageType, Record<string, PageMetadataContent>> = {
  landing: LANDING_PAGE_METADATA,
  pricing: PRICING_PAGE_METADATA,
  terms: TERMS_PAGE_METADATA,
  privacy: PRIVACY_PAGE_METADATA,
};

/**
 * Get metadata content for a specific page type and locale
 */
export function getPageMetadataContent(
  pageType: PageType,
  locale: string
): PageMetadataContent {
  const pageMetadata = PAGE_METADATA_MAP[pageType];
  return pageMetadata[locale] ?? pageMetadata[DEFAULT_LOCALE];
}
