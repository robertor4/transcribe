import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLandingMetadata } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Generate metadata for landing page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return getLandingMetadata(locale);
}

export default function LandingLayout({ children }: Props) {
  return <>{children}</>;
}
