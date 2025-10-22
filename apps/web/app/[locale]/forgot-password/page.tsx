import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  
  return {
    title: `${t('resetPassword')} - Neural Summary`,
    description: t('enterEmailForReset'),
  };
}

export default async function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  );
}