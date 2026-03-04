import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import SignupForm from '@/components/SignupForm';
import { AmbientGradient } from '@/components/landing/shared/AmbientGradient';

export default async function SignupPage({
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
          <Link href={`/${locale}/landing`} className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo-white-wTagLine.svg"
              alt="Neural Summary - You speak. It creates."
              className="h-16 w-auto"
            />
          </Link>
          <h2 className="text-center text-xl font-semibold text-white">
            {tAuth('createYourAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {tAuth('joinThousandsOfUsers')}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.1] bg-white/[0.06] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
