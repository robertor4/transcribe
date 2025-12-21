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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-12">
            <img
              src="/assets/logos/neural-summary-logo-wTagLine.png"
              alt="Neural Summary - You speak. It creates."
              className="w-full max-w-[280px]"
            />
          </div>
          <p className="text-center text-sm text-gray-600">
            {tAuth('signInToContinue')}
          </p>
        </div>

        <LoginForm />

        <div className="mt-4">
          <Link
            href="/landing"
            className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tAuth('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}