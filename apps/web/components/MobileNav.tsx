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
        className="md:hidden p-2 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#cc3399] shadow-sm"
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
          className="fixed inset-0 z-40 bg-black bg-opacity-25 dark:bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-xs bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('nav.menu')}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#cc3399]"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="px-4 py-6 bg-white dark:bg-gray-800" aria-label="Mobile navigation">
          <div className="space-y-6">
            {/* Language Switcher */}
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('nav.language')}</span>
                <LanguageSwitcher />
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              {user ? (
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-center text-white bg-[#cc3399] hover:bg-[#b82d89] rounded-lg transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('nav.login')}
                  </Link>

                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-center text-white bg-[#cc3399] hover:bg-[#b82d89] rounded-lg transition-colors"
                  >
                    {t('nav.getStarted')}
                  </Link>
                </>
              )}
            </div>

            {/* Additional Links */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <a
                href={`#features`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('nav.features')}
              </a>
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('nav.pricing')}
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}