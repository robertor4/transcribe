import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { buildPageMetadata, MetadataOverrides } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Product Owner landing page metadata with persona-specific
 * OpenGraph and Twitter descriptions optimized for product managers
 */
const PRODUCT_OWNER_OVERRIDES: Record<string, MetadataOverrides> = {
  en: {
    title: 'Neural Summary for Product Owners | PRDs from Conversations',
    description:
      'Transform sprint planning meetings into structured documentation. Generate PRDs, user stories, and action items from stakeholder conversations. Built for Product Owners.',
    keywords: [
      'product owner tools',
      'PRD generator',
      'sprint planning notes',
      'user story generator',
      'product management AI',
      'meeting notes for PMs',
      'stakeholder interview tools',
      'agile documentation',
    ],
    openGraph: {
      title: 'Neural Summary for Product Owners',
      description:
        'Turn sprint planning meetings into PRDs, user stories, and action items. Stop writing. Start shipping.',
    },
    twitter: {
      title: 'Neural Summary for Product Owners',
      description:
        'Transform stakeholder conversations into structured PRDs and user stories. The AI assistant built for Product Owners who want to ship faster.',
    },
  },
  nl: {
    title: 'Neural Summary voor Product Owners | PRDs uit Gesprekken',
    description:
      'Transformeer sprint planning meetings naar gestructureerde documentatie. Genereer PRDs, user stories en actiepunten uit stakeholder gesprekken.',
    keywords: [
      'product owner tools',
      'PRD generator',
      'sprint planning notities',
      'user story generator',
      'product management AI',
    ],
    openGraph: {
      title: 'Neural Summary voor Product Owners',
      description:
        'Verander sprint planning meetings in PRDs, user stories en actiepunten. Stop met schrijven. Begin met shippen.',
    },
    twitter: {
      title: 'Neural Summary voor Product Owners',
      description:
        'Transformeer stakeholder gesprekken naar gestructureerde PRDs en user stories. De AI-assistent voor Product Owners.',
    },
  },
  de: {
    title: 'Neural Summary für Product Owner | PRDs aus Gesprächen',
    description:
      'Verwandeln Sie Sprint-Planungsmeetings in strukturierte Dokumentation. Generieren Sie PRDs, User Stories und Action Items aus Stakeholder-Gesprächen.',
    keywords: [
      'Product Owner Tools',
      'PRD Generator',
      'Sprint-Planung Notizen',
      'User Story Generator',
      'Product Management KI',
    ],
    openGraph: {
      title: 'Neural Summary für Product Owner',
      description:
        'Verwandeln Sie Sprint-Planungsmeetings in PRDs, User Stories und Action Items. Aufhören zu schreiben. Anfangen zu liefern.',
    },
    twitter: {
      title: 'Neural Summary für Product Owner',
      description:
        'Transformieren Sie Stakeholder-Gespräche in strukturierte PRDs und User Stories. Der KI-Assistent für Product Owner.',
    },
  },
  fr: {
    title: 'Neural Summary pour Product Owners | PRDs à partir de Conversations',
    description:
      'Transformez les réunions de planification de sprint en documentation structurée. Générez des PRDs, user stories et points d\'action à partir des conversations avec les parties prenantes.',
    keywords: [
      'outils product owner',
      'générateur PRD',
      'notes de planification sprint',
      'générateur user story',
      'IA gestion de produit',
    ],
    openGraph: {
      title: 'Neural Summary pour Product Owners',
      description:
        'Transformez les réunions de sprint en PRDs, user stories et points d\'action. Arrêtez d\'écrire. Commencez à livrer.',
    },
    twitter: {
      title: 'Neural Summary pour Product Owners',
      description:
        'Transformez les conversations avec les parties prenantes en PRDs et user stories structurés. L\'assistant IA pour Product Owners.',
    },
  },
  es: {
    title: 'Neural Summary para Product Owners | PRDs desde Conversaciones',
    description:
      'Transforma reuniones de planificación de sprint en documentación estructurada. Genera PRDs, historias de usuario y elementos de acción desde conversaciones con stakeholders.',
    keywords: [
      'herramientas product owner',
      'generador PRD',
      'notas planificación sprint',
      'generador historias usuario',
      'IA gestión de producto',
    ],
    openGraph: {
      title: 'Neural Summary para Product Owners',
      description:
        'Convierte reuniones de sprint en PRDs, historias de usuario y elementos de acción. Deja de escribir. Empieza a entregar.',
    },
    twitter: {
      title: 'Neural Summary para Product Owners',
      description:
        'Transforma conversaciones con stakeholders en PRDs e historias de usuario estructurados. El asistente IA para Product Owners.',
    },
  },
};

/**
 * Generate metadata for Product Owner landing page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const overrides = PRODUCT_OWNER_OVERRIDES[locale] || PRODUCT_OWNER_OVERRIDES.en;
  return buildPageMetadata(locale, '/product-owner', overrides);
}

export default function ProductOwnerLandingLayout({ children }: Props) {
  return <>{children}</>;
}
