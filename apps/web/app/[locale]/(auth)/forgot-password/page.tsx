import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { AmbientGradient } from '@/components/landing/shared/AmbientGradient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: `${t('resetPassword')} - Neural Summary`,
    description: t('enterEmailForReset'),
  };
}

export default async function ForgotPasswordPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  return (
    <div className="dark relative min-h-screen flex items-center justify-center bg-[#22184C] py-12 px-4 sm:px-6 lg:px-8">
      <AmbientGradient />

      <div className="relative z-10 max-w-md w-full">
        <div className="mb-8">
          <Link href={`/${locale}/landing`} className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo-white-wTagLine.svg"
              alt="Neural Summary - Create with your voice."
              className="h-16 w-auto"
            />
          </Link>
        </div>

        <div className="rounded-xl border border-white/[0.1] bg-white/[0.06] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
