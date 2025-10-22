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
  const tLanding = await getTranslations({ locale, namespace: 'landing' });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <img
              src="/assets/NS-symbol.webp"
              alt="Neural Summary Logo"
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {tAuth('welcomeBack')}
          </h2>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">{tLanding('hero.byline')}</p>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            {tAuth('signInToContinue')}
          </p>
        </div>

        <LoginForm />

        <div className="mt-4">
          <Link
            href="/landing"
            className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tAuth('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}