'use client';

import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { SettingsNavigation } from './SettingsNavigation';
import { useTranslations } from 'next-intl';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('settings');

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        showRightPanel={false}
        mobileTitle={
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
            {t('title')}
          </h1>
        }
        mainContent={
          <div className="px-4 sm:px-6 lg:px-12 pt-4 sm:pt-4 lg:pt-[38px] pb-12">
            <SettingsNavigation />
            <div className="mt-6 max-w-3xl">
              {children}
            </div>
          </div>
        }
      />
    </div>
  );
}
