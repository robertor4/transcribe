import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getPrivacyMetadata } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Generate metadata for privacy policy page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return getPrivacyMetadata(locale);
}

export default function PrivacyLayout({ children }: Props) {
  return <>{children}</>;
}
