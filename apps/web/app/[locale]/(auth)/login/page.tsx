import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/LoginForm';
import { AmbientGradient } from '@/components/landing/shared/AmbientGradient';

export default async function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const tAuth = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="dark relative min-h-screen flex items-center justify-center bg-[#22184C] py-12 px-4 sm:px-6 lg:px-8">
      <AmbientGradient />

      <div className="relative z-10 max-w-md w-full">
        <div className="mb-8">
          <Link href="/landing" className="flex justify-center mb-6">
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

        <div className="rounded-xl border border-white/[0.1] bg-white/[0.06] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <LoginForm />
        </div>

        <div className="mt-6">
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
