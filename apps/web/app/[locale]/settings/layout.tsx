'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { 
  User, 
  Bell, 
  Settings, 
  Shield, 
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc3399]"></div>
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
      name: t('account'),
      href: `/settings/account`,
      icon: Shield,
      current: pathname?.endsWith('/settings/account'),
    },
    {
      name: t('subscription'),
      href: `/settings/subscription`,
      icon: CreditCard,
      current: pathname?.endsWith('/settings/subscription'),
      disabled: true, // For future implementation
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors mr-4"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">{t('backToDashboard')}</span>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('title')}
              </h1>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                      ${item.disabled
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : ''
                      }
                      ${item.current
                        ? 'bg-pink-50 dark:bg-pink-900/30 text-[#cc3399] border-l-4 border-[#cc3399] -ml-1 pl-4'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        flex-shrink-0 -ml-1 mr-3 h-5 w-5
                        ${item.current ? 'text-[#cc3399]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}
                      `}
                    />
                    <span className="truncate">{item.name}</span>
                    {item.disabled && (
                      <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                        {t('comingSoon')}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-25 dark:bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          <div className={`
            md:hidden fixed top-16 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-lg transform transition-transform
            ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}
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
                      ${item.disabled
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : ''
                      }
                      ${item.current
                        ? 'bg-pink-50 dark:bg-pink-900/30 text-[#cc3399]'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        flex-shrink-0 mr-3 h-5 w-5
                        ${item.current ? 'text-[#cc3399]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}
                      `}
                    />
                    <span className="truncate">{item.name}</span>
                    {item.disabled && (
                      <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                        {t('comingSoon')}
                      </span>
                    )}
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
  );
}