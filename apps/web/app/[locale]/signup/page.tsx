import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import SignupForm from '@/components/SignupForm';

export default async function SignupPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const tAuth = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href={`/${locale}/landing`} className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo.svg"
              alt="Neural Summary Logo"
              className="h-12 w-auto"
            />
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 uppercase tracking-wide">
            {tAuth('createYourAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {tAuth('joinThousandsOfUsers')}
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  );
}