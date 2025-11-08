import { Metadata } from 'next';
import { getPricingMetadata } from '@/utils/metadata';

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

/**
 * Generate metadata for pricing page
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  return getPricingMetadata(locale);
}

export default function PricingLayout({ children }: Props) {
  return <>{children}</>;
}
