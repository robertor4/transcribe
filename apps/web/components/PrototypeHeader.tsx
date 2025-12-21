'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Simplified header component for prototype pages
 * Matches the authenticated dashboard header design without requiring context providers
 */
export function PrototypeHeader() {
  const tCommon = useTranslations('common');

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/prototype-dashboard-v2" className="flex items-center hover:opacity-80 transition-opacity">
            <Image
              src="/assets/logos/neural-summary-logo.svg"
              alt="Neural Summary Logo"
              width={32}
              height={32}
              className="mr-3"
              priority
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {tCommon('appName')}
              </h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {/* Mock Usage Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Professional
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                45h / 60h
              </span>
            </div>

            {/* Mock Profile Menu */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#8D6AFA] flex items-center justify-center text-white text-sm font-medium">
                R
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                roberto@dreamone.nl
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
