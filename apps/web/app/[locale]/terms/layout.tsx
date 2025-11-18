import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTermsMetadata } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Generate metadata for terms of service page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return getTermsMetadata(locale);
}

export default function TermsLayout({ children }: Props) {
  return <>{children}</>;
}
