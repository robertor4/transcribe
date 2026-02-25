import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = 'en' } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // On app domain, go straight to dashboard
  if (host.startsWith('app.')) {
    redirect(`/${locale}/dashboard`);
  }

  // On marketing domain (or dev), go to landing page
  redirect(`/${locale}/landing`);
}
