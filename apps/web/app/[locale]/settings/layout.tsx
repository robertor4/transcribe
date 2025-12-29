'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UsageProvider } from '@/contexts/UsageContext';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  User,
  Bell,
  Settings,
  CreditCard,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('settings');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D6AFA]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    {
      name: t('profile'),
      href: `/settings/profile`,
      icon: User,
      current: pathname?.endsWith('/settings/profile') || pathname?.endsWith('/settings'),
    },
    {
      name: t('notifications'),
      href: `/settings/notifications`,
      icon: Bell,
      current: pathname?.endsWith('/settings/notifications'),
    },
    {
      name: t('preferences'),
      href: `/settings/preferences`,
      icon: Settings,
      current: pathname?.endsWith('/settings/preferences'),
    },
    {
      name: t('subscription'),
      href: `/settings/subscription`,
      icon: CreditCard,
      current: pathname?.includes('/settings/subscription'),
    },
  ];

  return (
    <UsageProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                {/* Breadcrumb */}
                <Link
                  href="/dashboard"
                  className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('backToDashboard')}
                </Link>
                {/* Page Title */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  {t('title')}
                </h1>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 self-start"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${item.current
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA] border-l-4 border-[#8D6AFA] -ml-1 pl-4'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <Icon
                        className={`
                          flex-shrink-0 -ml-1 mr-3 h-5 w-5
                          ${item.current ? 'text-[#8D6AFA]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}
                        `}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
              <div
                className="md:hidden fixed inset-0 z-30 bg-black/25"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
            <div className={`
              md:hidden fixed top-[88px] left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-lg transform transition-transform
              ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'}
            `}>
              <nav className="px-4 py-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${item.current
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA]'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon
                        className={`
                          flex-shrink-0 mr-3 h-5 w-5
                          ${item.current ? 'text-[#8D6AFA]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}
                        `}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </UsageProvider>
  );
}