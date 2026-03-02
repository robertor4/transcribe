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
    <div className="dark min-h-screen flex items-center justify-center bg-[#0f0b2e] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/landing" className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo-white-wTagLine.svg"
              alt="Neural Summary - You speak. It creates."
              className="h-16 w-auto"
            />
          </Link>
          <p className="text-center text-sm text-gray-400">
            {tAuth('signInToContinue')}
          </p>
        </div>

        <LoginForm />

        <div className="mt-4">
          <Link
            href="/landing"
            className="flex items-center justify-center text-sm text-white/40 hover:text-white/70"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tAuth('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
