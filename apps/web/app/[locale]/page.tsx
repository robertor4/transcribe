import { redirect } from 'next/navigation';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = 'en' } = await params;

  // Server-side redirect ensures crawlers and users land on the localized landing page instantly.
  redirect(`/${locale}/landing`);
}
