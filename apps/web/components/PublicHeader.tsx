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
  const tCommon = useTranslations('common');
  const tLanding = useTranslations('landing');
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}/landing`} className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo.svg"
              alt="Neural Summary"
              className="h-8 w-auto mr-2 sm:mr-3"
              width={32}
              height={32}
            />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {tCommon('appName')}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">{tLanding('hero.byline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {showFeaturesLink && (
              <Link
                href={`/${locale}/landing#features`}
                className="text-gray-700 hover:text-[#8D6AFA] font-medium transition-colors"
                aria-label="View features"
              >
                {tLanding('nav.features')}
              </Link>
            )}
            <Link
              href={`/${locale}/landing#video-demo`}
              className="text-gray-700 hover:text-[#8D6AFA] font-medium transition-colors"
              aria-label="See how it works"
            >
              {tLanding('nav.howItWorks')}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="text-gray-700 hover:text-[#8D6AFA] font-medium transition-colors"
              aria-label="View pricing plans"
            >
              {tLanding('nav.pricing')}
            </Link>
            <LanguageSwitcher />
            {user ? (
              <Link
                href={`/${locale}/dashboard`}
                className="px-4 py-2 bg-[#8D6AFA] text-white font-medium rounded-full hover:bg-[#7A5AE0] transition-colors"
                aria-label="Go to Dashboard"
              >
                {tLanding('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  aria-label="Log in to Neural Summary"
                >
                  {tLanding('nav.login')}
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="px-4 py-2 bg-[#8D6AFA] text-white font-medium rounded-full hover:bg-[#7A5AE0] transition-colors"
                  aria-label="Get started with Neural Summary"
                >
                  {tLanding('nav.getStarted')}
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
