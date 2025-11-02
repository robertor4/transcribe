'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MobileNav } from '@/components/MobileNav';

interface PublicHeaderProps {
  locale: string;
  showFeaturesLink?: boolean;
}

export function PublicHeader({ locale, showFeaturesLink = false }: PublicHeaderProps) {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}/landing`} className="flex items-center">
            <img
              src="/assets/NS-symbol.webp"
              alt="Neural Summary"
              className="h-8 w-auto mr-2 sm:mr-3"
              width={32}
              height={32}
            />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {t('common.appName')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t('landing.hero.byline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {showFeaturesLink && (
              <Link
                href={`/${locale}/landing#features`}
                className="text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] font-medium transition-colors"
                aria-label="View features"
              >
                {t('landing.nav.features')}
              </Link>
            )}
            <Link
              href={`/${locale}/pricing`}
              className="text-gray-700 dark:text-gray-300 hover:text-[#cc3399] dark:hover:text-[#cc3399] font-medium transition-colors"
              aria-label="View pricing plans"
            >
              {t('landing.nav.pricing')}
            </Link>
            <LanguageSwitcher />
            {user ? (
              <Link
                href={`/${locale}/dashboard`}
                className="px-4 py-2 bg-[#cc3399] text-white font-medium rounded-lg hover:bg-[#b82d89] transition-colors"
                aria-label="Go to Dashboard"
              >
                {t('landing.nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                  aria-label="Log in to Neural Summary"
                >
                  {t('landing.nav.login')}
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="px-4 py-2 bg-[#cc3399] text-white font-medium rounded-lg hover:bg-[#b82d89] transition-colors"
                  aria-label="Get started with Neural Summary"
                >
                  {t('landing.nav.getStarted')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <MobileNav locale={locale} />
        </div>
      </nav>
    </header>
  );
}
