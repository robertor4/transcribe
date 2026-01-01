'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface PublicFooterProps {
  locale: string;
}

export function PublicFooter({ locale }: PublicFooterProps) {
  const t = useTranslations('landing');

  return (
    <footer className="py-16 px-6 sm:px-8 lg:px-12 bg-[#23194B]" aria-label="Footer">
      <div className="max-w-6xl mx-auto">
        {/* Multi-column grid layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {/* Column 1: Logo and tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}/landing`} className="inline-block mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logos/neural-summary-logo-white.svg"
                alt="Neural Summary"
                className="h-10 w-auto"
                width={200}
                height={40}
              />
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              {t('footer.tagline')}
            </p>
            <p className="text-sm text-gray-500">
              {t('footer.copyright')}
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">
              {t('footer.sections.product')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${locale}/landing#features`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.features')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/examples`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.examples')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/pricing`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.pricing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">
              {t('footer.sections.company')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${locale}/landing`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.about')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy#security`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.security')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.help')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">
              {t('footer.sections.legal')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.terms')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('footer.links.contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
