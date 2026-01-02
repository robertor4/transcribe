import ResetPasswordForm from '@/components/ResetPasswordForm';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  
  return {
    title: `${t('resetPassword')} - Neural Summary`,
    description: t('createNewPassword'),
  };
}

export default async function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-gray-900 dark:text-white">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}