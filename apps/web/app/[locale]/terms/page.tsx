import React from 'react';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { FileText, Shield, Scale, Globe, AlertCircle, Mail, DollarSign, TrendingUp } from 'lucide-react';

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

      <div className="min-h-screen flex flex-col bg-[#22184C]">
        <PublicHeader locale={locale} />

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.08] mb-6">
              <FileText className="h-8 w-8 text-[#14D0DC]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-white/60">
              {t('effectiveDate')}: <strong className="text-white/80">27 August 2025</strong>
            </p>
          </div>
        </section>

        {/* Main Content */}
        <main className="flex-grow">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 pb-24">
            {/* Table of Contents */}
            <nav className="bg-white/[0.06] rounded-xl border border-white/[0.08] p-6 mb-10">
              <h2 className="text-base font-semibold text-white mb-3">{t('tableOfContents')}</h2>
              <ol className="space-y-1 list-decimal list-inside text-sm text-white/70">
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
            <div className="max-w-none space-y-10">
              {/* 1. Acceptance of Terms */}
              <section id="acceptance" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Shield className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.acceptance.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.acceptance.content')}</p>
                <div className="bg-yellow-500/10 border-l-4 border-yellow-400/50 p-3 mb-3 rounded-r-lg">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-white/70">{t('sections.acceptance.notice')}</p>
                  </div>
                </div>
              </section>

              {/* 2. Service Description */}
              <section id="service-description" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Globe className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.serviceDescription.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.serviceDescription.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.serviceDescription.features.transcription')}</li>
                  <li>{t('sections.serviceDescription.features.analysis')}</li>
                  <li>{t('sections.serviceDescription.features.storage')}</li>
                  <li>{t('sections.serviceDescription.features.sharing')}</li>
                </ul>
              </section>

              {/* 3. Pricing and Payment Terms */}
              <section id="pricing" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.pricing.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.pricing.content')}</p>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.pricing.changes.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.pricing.changes.content')}</p>
                <div className="bg-blue-500/10 border-l-4 border-blue-400/50 p-3 mb-3 rounded-r-lg">
                  <p className="text-sm text-white/70">{t('sections.pricing.changes.notice')}</p>
                </div>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.pricing.billing.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.pricing.billing.content')}</p>
              </section>

              {/* 4. Usage Limits and Fair Use Policy */}
              <section id="fair-use" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.fairUse.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.fairUse.content')}</p>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.fairUse.policy.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.fairUse.policy.content')}</p>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.fairUse.modifications.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.fairUse.modifications.content')}</p>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.fairUse.enforcement.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.fairUse.enforcement.content')}</p>

                <div className="bg-yellow-500/10 border-l-4 border-yellow-400/50 p-3 mb-3 rounded-r-lg">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-white/70 font-medium">Fair use ensures quality service for all users. Violations may result in account restrictions.</p>
                  </div>
                </div>
              </section>

              {/* 5. User Obligations */}
              <section id="user-obligations" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3">{t('sections.userObligations.title')}</h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.userObligations.content')}</p>
                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.userObligations.prohibited.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.userObligations.prohibited.illegal')}</li>
                  <li>{t('sections.userObligations.prohibited.harmful')}</li>
                  <li>{t('sections.userObligations.prohibited.unauthorized')}</li>
                  <li>{t('sections.userObligations.prohibited.interference')}</li>
                  <li>{t('sections.userObligations.prohibited.reverseEngineering')}</li>
                </ul>
              </section>

              {/* 6. Intellectual Property */}
              <section id="intellectual-property" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3">{t('sections.intellectualProperty.title')}</h2>
                <h3 className="text-lg font-semibold text-white/90 mb-2">{t('sections.intellectualProperty.ownership.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.intellectualProperty.ownership.content')}</p>
                <h3 className="text-lg font-semibold text-white/90 mb-2">{t('sections.intellectualProperty.userContent.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.intellectualProperty.userContent.content')}</p>
                <h3 className="text-lg font-semibold text-white/90 mb-2">{t('sections.intellectualProperty.license.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.intellectualProperty.license.content')}</p>
              </section>

              {/* 7. Privacy and Data Protection */}
              <section id="privacy" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3">{t('sections.privacy.title')}</h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.privacy.content')}</p>
                <h3 className="text-lg font-semibold text-white/90 mb-2">{t('sections.privacy.gdpr.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.privacy.gdpr.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.privacy.gdpr.rights.access')}</li>
                  <li>{t('sections.privacy.gdpr.rights.rectification')}</li>
                  <li>{t('sections.privacy.gdpr.rights.erasure')}</li>
                  <li>{t('sections.privacy.gdpr.rights.portability')}</li>
                  <li>{t('sections.privacy.gdpr.rights.objection')}</li>
                </ul>
              </section>

              {/* 8. Limitation of Liability */}
              <section id="liability" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Scale className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.liability.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.liability.disclaimer')}</p>
                <h3 className="text-lg font-semibold text-white/90 mb-2">{t('sections.liability.limitations.title')}</h3>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.liability.limitations.content')}</p>
                <div className="bg-white/[0.06] border-l-4 border-white/20 p-3 mb-3 rounded-r-lg">
                  <p className="text-sm text-white/80 font-semibold">{t('sections.liability.maxLiability')}: &euro;10,000</p>
                </div>
              </section>

              {/* 9. Termination */}
              <section id="termination" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3">{t('sections.termination.title')}</h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.termination.content')}</p>
                <h3 className="text-lg font-semibold text-white/90 mb-2">{t('sections.termination.consequences.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.termination.consequences.accessRevoked')}</li>
                  <li>{t('sections.termination.consequences.dataRetention')}</li>
                  <li>{t('sections.termination.consequences.obligations')}</li>
                </ul>
              </section>

              {/* 10. Governing Law */}
              <section id="governing-law" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3">{t('sections.governingLaw.title')}</h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.governingLaw.content')}</p>
                <div className="bg-blue-500/10 border-l-4 border-blue-400/50 p-3 mb-3 rounded-r-lg">
                  <p className="text-sm text-white/70">
                    <strong className="text-white/90">{t('sections.governingLaw.jurisdiction')}:</strong> The Netherlands<br />
                    <strong className="text-white/90">{t('sections.governingLaw.court')}:</strong> Courts of Amsterdam, The Netherlands
                  </p>
                </div>
              </section>

              {/* 11. Contact Information */}
              <section id="contact" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Mail className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.contact.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.contact.content')}</p>
                <div className="bg-white/[0.06] rounded-lg border border-white/[0.08] p-4">
                  <p className="text-sm text-white/70">
                    <strong className="text-white/90">{t('sections.contact.company')}:</strong> DreamOne Holding BV<br />
                    <strong className="text-white/90">{t('sections.contact.registration')}:</strong> 88073955<br />
                    <strong className="text-white/90">{t('sections.contact.address')}:</strong> Amsterdam, The Netherlands<br />
                    <strong className="text-white/90">{t('sections.contact.email')}:</strong> info@neuralsummary.com<br />
                    <strong className="text-white/90">{t('sections.contact.dpo')}:</strong> admin@neuralsummary.com
                  </p>
                </div>
              </section>

              {/* Amendments */}
              <section className="mt-8 pt-6 border-t border-white/10">
                <h2 className="text-xl font-bold text-white mb-3">{t('sections.amendments.title')}</h2>
                <p className="text-sm text-white/70 leading-relaxed">{t('sections.amendments.content')}</p>
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
