'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MobileNav } from '@/components/MobileNav';

interface PublicHeaderProps {
  locale: string;
}

export function PublicHeader({ locale }: PublicHeaderProps) {
  const tLanding = useTranslations('landing');
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#23194B]/95 backdrop-blur-md z-50 border-b border-white/10 overflow-x-hidden">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-14">
          <Link href={`/${locale}/landing`} className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo-altBlue.svg"
              alt="Neural Summary - You speak. It creates."
              className="h-8 sm:h-9 w-auto -mb-1"
              width={180}
              height={48}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5">
            <Link
              href={`/${locale}/examples`}
              className="text-sm text-gray-300 hover:text-white font-medium transition-colors"
              aria-label="View examples"
            >
              {tLanding('nav.examples')}
            </Link>
            <Link
              href={`/${locale}/landing#how-it-works`}
              className="text-sm text-gray-300 hover:text-white font-medium transition-colors"
              aria-label="See how it works"
            >
              {tLanding('nav.howItWorks')}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="text-sm text-gray-300 hover:text-white font-medium transition-colors"
              aria-label="View pricing plans"
            >
              {tLanding('nav.pricing')}
            </Link>
            <LanguageSwitcher variant="dark" />
            {user ? (
              <Link
                href={`/${locale}/dashboard`}
                className="px-3 py-1.5 text-sm text-white font-medium rounded-full border border-white/30 hover:border-white/60 hover:bg-white/10 transition-colors"
                aria-label="Go to Dashboard"
              >
                {tLanding('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="text-sm text-gray-300 hover:text-white font-medium transition-colors"
                  aria-label="Log in to Neural Summary"
                >
                  {tLanding('nav.login')}
                </Link>
                <Link
                  href={`/${locale}/signup`}
                  className="px-3 py-1.5 text-sm text-white font-medium rounded-full border border-white/30 hover:border-white/60 hover:bg-white/10 transition-colors"
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
