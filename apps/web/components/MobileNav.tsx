'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface MobileNavProps {
  locale: string;
}

export function MobileNav({ locale }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('landing');
  const { user } = useAuth();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-md bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8D6AFA] shadow-sm"
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-xs bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">Neural Summary</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8D6AFA]"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="px-6 py-8 bg-white" aria-label="Mobile navigation">
          <div className="space-y-8">
            {/* Navigation Links - Primary Focus */}
            <div className="space-y-3">
              <Link
                href={`/${locale}/landing#video-demo`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {t('nav.howItWorks')}
              </Link>
              <Link
                href={`/${locale}/landing#features`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {t('nav.features')}
              </Link>
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {t('nav.pricing')}
              </Link>
            </div>

            {/* Authentication Actions */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              {user ? (
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-center text-white bg-[#8D6AFA] hover:bg-[#7A5AE0] rounded-full transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-center bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-full transition-colors"
                  >
                    {t('nav.login')}
                  </Link>

                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-center text-white bg-[#8D6AFA] hover:bg-[#7A5AE0] rounded-full transition-colors"
                  >
                    {t('nav.getStarted')}
                  </Link>
                </>
              )}
            </div>

            {/* Language Switcher - Settings */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{t('nav.language')}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
