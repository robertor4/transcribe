'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getAppUrl } from '@/lib/config';
import { LanguageSwitcher } from './LanguageSwitcher';

interface MobileNavProps {
  locale: string;
}

export function MobileNav({ locale }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('landing');
  const { user } = useAuth();
  const appUrl = getAppUrl();

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuContent = (
    <>
      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-25 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-xs bg-[#23194B] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-[#23194B] border-b border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/neural-summary-logo-altBlue.svg"
            alt="Neural Summary"
            className="h-9 w-auto"
            width={160}
            height={32}
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8D6AFA]"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="px-6 py-6 bg-[#23194B]" aria-label="Mobile navigation">
          <div>
            {/* Navigation Links - Primary Focus */}
            <div className="space-y-3 pb-4">
              <Link
                href={`/${locale}/landing#pricing`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {t('nav.pricing')}
              </Link>
              <Link
                href={`/${locale}/landing#outputs`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {t('nav.features')}
              </Link>
              <Link
                href={`/${locale}/landing#compatibility`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {t('nav.howItWorks')}
              </Link>
              <Link
                href={`/${locale}/contact`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {t('nav.contact')}
              </Link>
            </div>

            {/* Authentication Actions */}
            <div className="py-4 border-t border-b border-white/10 space-y-3">
              {user ? (
                <a
                  href={`${appUrl}/${locale}/dashboard`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-center text-white border border-white/30 hover:border-white/60 hover:bg-white/10 rounded-full transition-colors"
                >
                  {t('nav.dashboard')}
                </a>
              ) : (
                <>
                  <a
                    href={`${appUrl}/${locale}/login`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-center bg-transparent border-2 border-white/30 text-white hover:border-white/60 hover:bg-white/10 rounded-full transition-colors"
                  >
                    {t('nav.login')}
                  </a>

                  <a
                    href={`${appUrl}/${locale}/signup`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-center text-white bg-[#8D6AFA] hover:bg-[#7A5AE0] rounded-full transition-colors"
                  >
                    {t('nav.getStarted')}
                  </a>
                </>
              )}
            </div>

            {/* Language Switcher - Settings */}
            <div className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">{t('nav.language')}</span>
                <LanguageSwitcher variant="dark" />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-md bg-transparent text-[#14D0DC] hover:text-[#0fb8c4] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#14D0DC] flex items-center justify-center"
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Portal menu content to body to escape header stacking context */}
      {mounted && createPortal(menuContent, document.body)}
    </>
  );
}
