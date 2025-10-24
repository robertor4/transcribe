'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Shield } from 'lucide-react';

interface PublicFooterProps {
  locale: string;
}

export function PublicFooter({ locale }: PublicFooterProps) {
  const t = useTranslations();

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8" aria-label="Footer">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">{t('landing.footer.product.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/features`} className="hover:text-white transition-colors">{t('landing.footer.product.features')}</Link></li>
              <li><Link href={`/${locale}/pricing`} className="hover:text-white transition-colors">{t('landing.footer.product.pricing')}</Link></li>
              <li><Link href={`/${locale}/api`} className="hover:text-white transition-colors">{t('landing.footer.product.api')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t('landing.footer.company.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/about`} className="hover:text-white transition-colors">{t('landing.footer.company.about')}</Link></li>
              <li><Link href={`/${locale}/blog`} className="hover:text-white transition-colors">{t('landing.footer.company.blog')}</Link></li>
              <li><Link href={`/${locale}/careers`} className="hover:text-white transition-colors">{t('landing.footer.company.careers')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t('landing.footer.support.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/help`} className="hover:text-white transition-colors">{t('landing.footer.support.help')}</Link></li>
              <li><Link href={`/${locale}/contact`} className="hover:text-white transition-colors">{t('landing.footer.support.contact')}</Link></li>
              <li><Link href={`/${locale}/status`} className="hover:text-white transition-colors">{t('landing.footer.support.status')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t('landing.footer.legal.title')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t('landing.footer.legal.privacy')}</Link></li>
              <li><Link href={`/${locale}/terms`} className="hover:text-white transition-colors">{t('landing.footer.legal.terms')}</Link></li>
              <li><Link href={`/${locale}/security`} className="hover:text-white transition-colors">{t('landing.footer.legal.security')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-400 italic max-w-2xl mx-auto">
              {t('landing.footer.tagline')}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img
                src="/assets/NS-symbol.webp"
                alt="Neural Summary"
                className="h-6 w-auto mr-2"
                width={24}
                height={24}
              />
              <span className="text-sm text-gray-400">{t('landing.footer.copyright')}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Shield className="h-4 w-4" aria-hidden="true" />
              <span>{t('landing.security.badges.soc2')}</span>
              <span>•</span>
              <span>{t('landing.security.badges.gdpr')}</span>
              <span>•</span>
              <span>{t('landing.security.badges.hipaa')}</span>
              <span>•</span>
              <span>{t('landing.security.badges.iso')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
