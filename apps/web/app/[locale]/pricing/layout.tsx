import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getPricingMetadata } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Generate metadata for pricing page
 *
 * Uses centralized metadata from /config/page-metadata.ts as base.
 * Add overrides here to customize metadata for this specific page.
 *
 * Example with overrides:
 * return getPricingMetadata(locale, {
 *   title: 'Custom Title',
 *   description: 'Custom description',
 *   keywords: ['custom', 'keywords'],
 *   openGraph: {
 *     title: 'Custom OG title',
 *     description: 'Custom OG description'
 *   }
 * });
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  // Use default metadata from config (no overrides)
  return getPricingMetadata(locale);

  // Or with overrides (uncomment to customize):
  // return getPricingMetadata(locale, {
  //   description: 'Custom pricing page description',
  // });
}

export default function PricingLayout({ children }: Props) {
  return <>{children}</>;
}
