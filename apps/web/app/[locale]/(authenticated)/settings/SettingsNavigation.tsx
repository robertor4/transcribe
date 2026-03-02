'use client';

import { usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { User, Settings, CreditCard } from 'lucide-react';

export function SettingsNavigation() {
  const pathname = usePathname();
  const t = useTranslations('settings');

  const tabs = [
    {
      name: t('profile'),
      href: '/settings/profile' as const,
      icon: User,
      active: pathname?.endsWith('/profile') || pathname?.endsWith('/settings'),
    },
    {
      name: t('preferences'),
      href: '/settings/preferences' as const,
      icon: Settings,
      active: pathname?.endsWith('/preferences'),
    },
    {
      name: t('subscription'),
      href: '/settings/subscription' as const,
      icon: CreditCard,
      active: pathname?.includes('/subscription'),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {t('title')}
      </h1>
      <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${tab.active
                  ? 'border-[#8D6AFA] text-[#8D6AFA]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
