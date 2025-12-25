import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const tAuth = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo-wTagLine.png"
              alt="Neural Summary - You speak. It creates."
              className="w-full max-w-[280px] dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo-white-wTagLine.svg"
              alt="Neural Summary - You speak. It creates."
              className="w-full max-w-[280px] hidden dark:block"
            />
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {tAuth('signInToContinue')}
          </p>
        </div>

        <LoginForm />

        <div className="mt-4">
          <Link
            href="/landing"
            className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tAuth('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}