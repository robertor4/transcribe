import { UsageProvider } from '@/contexts/UsageContext';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { getDashboardMetadata } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: ReactNode;
};

/**
 * Generate metadata for dashboard (no indexing for authenticated pages)
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  return getDashboardMetadata(locale);
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <UsageProvider>{children}</UsageProvider>;
}
