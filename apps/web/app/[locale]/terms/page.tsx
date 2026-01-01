import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PublicFooter } from '@/components/PublicFooter';
import { ArrowLeft, FileText, Shield, Scale, Globe, AlertCircle, Mail, DollarSign, TrendingUp } from 'lucide-react';

export default async function TermsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  
  // Use English as fallback if terms translations are missing
  let t;
  try {
    t = await getTranslations({ locale, namespace: 'terms' });
  } catch {
    console.warn(`Terms translations missing for locale: ${locale}, falling back to English`);
    t = await getTranslations({ locale: 'en', namespace: 'terms' });
  }
  
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TermsOfService',
    name: t('title'),
    text: t('meta.description'),
    url: `https://neuralsummary.com/${locale}/terms`,
    datePublished: '2025-08-10',
    dateModified: '2025-08-27',
    publisher: {
      '@type': 'Organization',
      name: 'Neural Summary',
      url: 'https://neuralsummary.com'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link 
                  href={`/${locale}/landing`}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-6"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">{tCommon('back')}</span>
                </Link>
                <div className="flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/logos/neural-summary-logo.svg"
                    alt="Neural Summary"
                    className="h-8 w-auto mr-3"
                    width={32}
                    height={32}
                  />
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {tCommon('appName')}
                    </h1>
                  </div>
                </div>
              </div>
              <LanguageSwitcher />
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            {/* Title Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#8D6AFA] rounded-full mb-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('title')}</h1>
              <p className="text-sm text-gray-600">{t('effectiveDate')}: <strong>27 August 2025</strong></p>
            </div>

            {/* Table of Contents */}
            <nav className="bg-gray-50 rounded-lg p-4 mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-3">{t('tableOfContents')}</h2>
              <ol className="space-y-1 list-decimal list-inside text-sm text-gray-700">
                <li><a href="#acceptance" className="hover:text-[#8D6AFA] transition-colors">{t('sections.acceptance.title')}</a></li>
                <li><a href="#service-description" className="hover:text-[#8D6AFA] transition-colors">{t('sections.serviceDescription.title')}</a></li>
                <li><a href="#pricing" className="hover:text-[#8D6AFA] transition-colors">{t('sections.pricing.title')}</a></li>
                <li><a href="#fair-use" className="hover:text-[#8D6AFA] transition-colors">{t('sections.fairUse.title')}</a></li>
                <li><a href="#user-obligations" className="hover:text-[#8D6AFA] transition-colors">{t('sections.userObligations.title')}</a></li>
                <li><a href="#intellectual-property" className="hover:text-[#8D6AFA] transition-colors">{t('sections.intellectualProperty.title')}</a></li>
                <li><a href="#privacy" className="hover:text-[#8D6AFA] transition-colors">{t('sections.privacy.title')}</a></li>
                <li><a href="#liability" className="hover:text-[#8D6AFA] transition-colors">{t('sections.liability.title')}</a></li>
                <li><a href="#termination" className="hover:text-[#8D6AFA] transition-colors">{t('sections.termination.title')}</a></li>
                <li><a href="#governing-law" className="hover:text-[#8D6AFA] transition-colors">{t('sections.governingLaw.title')}</a></li>
                <li><a href="#contact" className="hover:text-[#8D6AFA] transition-colors">{t('sections.contact.title')}</a></li>
              </ol>
            </nav>

            {/* Content Sections */}
            <div className="prose prose-sm max-w-none space-y-8">
              {/* 1. Acceptance of Terms */}
              <section id="acceptance">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Shield className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.acceptance.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.acceptance.content')}</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{t('sections.acceptance.notice')}</p>
                  </div>
                </div>
              </section>

              {/* 2. Service Description */}
              <section id="service-description">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Globe className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.serviceDescription.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.serviceDescription.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.serviceDescription.features.transcription')}</li>
                  <li>{t('sections.serviceDescription.features.analysis')}</li>
                  <li>{t('sections.serviceDescription.features.storage')}</li>
                  <li>{t('sections.serviceDescription.features.sharing')}</li>
                </ul>
              </section>

              {/* 3. Pricing and Payment Terms */}
              <section id="pricing">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.pricing.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.pricing.content')}</p>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.pricing.changes.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.pricing.changes.content')}</p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                  <p className="text-sm text-gray-700">{t('sections.pricing.changes.notice')}</p>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.pricing.billing.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.pricing.billing.content')}</p>
              </section>

              {/* 4. Usage Limits and Fair Use Policy */}
              <section id="fair-use">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.fairUse.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.fairUse.content')}</p>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.fairUse.policy.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.fairUse.policy.content')}</p>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.fairUse.modifications.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.fairUse.modifications.content')}</p>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.fairUse.enforcement.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.fairUse.enforcement.content')}</p>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700 font-medium">Fair use ensures quality service for all users. Violations may result in account restrictions.</p>
                  </div>
                </div>
              </section>

              {/* 5. User Obligations */}
              <section id="user-obligations">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('sections.userObligations.title')}</h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.userObligations.content')}</p>
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.userObligations.prohibited.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.userObligations.prohibited.illegal')}</li>
                  <li>{t('sections.userObligations.prohibited.harmful')}</li>
                  <li>{t('sections.userObligations.prohibited.unauthorized')}</li>
                  <li>{t('sections.userObligations.prohibited.interference')}</li>
                  <li>{t('sections.userObligations.prohibited.reverseEngineering')}</li>
                </ul>
              </section>

              {/* 6. Intellectual Property */}
              <section id="intellectual-property">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('sections.intellectualProperty.title')}</h2>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('sections.intellectualProperty.ownership.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.intellectualProperty.ownership.content')}</p>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('sections.intellectualProperty.userContent.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.intellectualProperty.userContent.content')}</p>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('sections.intellectualProperty.license.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.intellectualProperty.license.content')}</p>
              </section>

              {/* 7. Privacy and Data Protection */}
              <section id="privacy">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('sections.privacy.title')}</h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.privacy.content')}</p>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('sections.privacy.gdpr.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.privacy.gdpr.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.privacy.gdpr.rights.access')}</li>
                  <li>{t('sections.privacy.gdpr.rights.rectification')}</li>
                  <li>{t('sections.privacy.gdpr.rights.erasure')}</li>
                  <li>{t('sections.privacy.gdpr.rights.portability')}</li>
                  <li>{t('sections.privacy.gdpr.rights.objection')}</li>
                </ul>
              </section>

              {/* 8. Limitation of Liability */}
              <section id="liability">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Scale className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.liability.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.liability.disclaimer')}</p>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('sections.liability.limitations.title')}</h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.liability.limitations.content')}</p>
                <div className="bg-gray-50 border-l-4 border-gray-400 p-3 mb-3">
                  <p className="text-sm text-gray-700 font-semibold">{t('sections.liability.maxLiability')}: €10,000</p>
                </div>
              </section>

              {/* 9. Termination */}
              <section id="termination">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('sections.termination.title')}</h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.termination.content')}</p>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('sections.termination.consequences.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.termination.consequences.accessRevoked')}</li>
                  <li>{t('sections.termination.consequences.dataRetention')}</li>
                  <li>{t('sections.termination.consequences.obligations')}</li>
                </ul>
              </section>

              {/* 10. Governing Law */}
              <section id="governing-law">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('sections.governingLaw.title')}</h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.governingLaw.content')}</p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                  <p className="text-sm text-gray-700">
                    <strong>{t('sections.governingLaw.jurisdiction')}:</strong> The Netherlands<br />
                    <strong>{t('sections.governingLaw.court')}:</strong> Courts of Amsterdam, The Netherlands
                  </p>
                </div>
              </section>

              {/* 11. Contact Information */}
              <section id="contact">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Mail className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.contact.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.contact.content')}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>{t('sections.contact.company')}:</strong> DreamOne Holding BV<br />
                    <strong>{t('sections.contact.registration')}:</strong> 88073955<br />
                    <strong>{t('sections.contact.address')}:</strong> Amsterdam, The Netherlands<br />
                    <strong>{t('sections.contact.email')}:</strong> info@neuralsummary.com<br />
                    <strong>{t('sections.contact.dpo')}:</strong> admin@neuralsummary.com
                  </p>
                </div>
              </section>

              {/* Amendments */}
              <section className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('sections.amendments.title')}</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{t('sections.amendments.content')}</p>
              </section>
            </div>
          </div>
        </main>

        {/* Footer */}
        <PublicFooter locale={locale} />
      </div>
    </>
  );
}