import React from 'react';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import {
  Shield,
  Lock,
  Eye,
  Database,
  Users,
  Globe,
  AlertCircle,
  Mail,
  Cookie,
  Clock,
  FileCheck,
  UserCheck
} from 'lucide-react';

export default async function PrivacyPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  // Use English as fallback if privacy translations are missing
  let t;
  try {
    t = await getTranslations({ locale, namespace: 'privacy' });
  } catch {
    console.warn(`Privacy translations missing for locale: ${locale}, falling back to English`);
    t = await getTranslations({ locale: 'en', namespace: 'privacy' });
  }

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'PrivacyPolicy',
    name: t('title'),
    text: t('meta.description'),
    url: `https://neuralsummary.com/${locale}/privacy`,
    datePublished: '2025-08-01',
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
              <Shield className="h-8 w-8 text-[#14D0DC]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-white/60 mb-4">
              {t('effectiveDate')}: <strong className="text-white/80">25 August 2025</strong>
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-green-500/20 text-green-300 rounded-full">
              <Shield className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">{t('gdprCompliant')}</span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="flex-grow">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 pb-24">
            {/* Introduction */}
            <div className="bg-blue-500/10 border-l-4 border-blue-400/50 p-4 mb-8 rounded-r-lg">
              <p className="text-sm text-white/70">{t('introduction')}</p>
            </div>

            {/* Table of Contents */}
            <nav className="bg-white/[0.06] rounded-xl border border-white/[0.08] p-6 mb-10">
              <h2 className="text-base font-semibold text-white mb-3">{t('tableOfContents')}</h2>
              <ol className="space-y-1 list-decimal list-inside text-sm text-white/70">
                <li><a href="#data-controller" className="hover:text-[#8D6AFA] transition-colors">{t('sections.dataController.title')}</a></li>
                <li><a href="#data-collected" className="hover:text-[#8D6AFA] transition-colors">{t('sections.dataCollected.title')}</a></li>
                <li><a href="#legal-basis" className="hover:text-[#8D6AFA] transition-colors">{t('sections.legalBasis.title')}</a></li>
                <li><a href="#data-usage" className="hover:text-[#8D6AFA] transition-colors">{t('sections.dataUsage.title')}</a></li>
                <li><a href="#data-sharing" className="hover:text-[#8D6AFA] transition-colors">{t('sections.dataSharing.title')}</a></li>
                <li><a href="#data-retention" className="hover:text-[#8D6AFA] transition-colors">{t('sections.dataRetention.title')}</a></li>
                <li><a href="#user-rights" className="hover:text-[#8D6AFA] transition-colors">{t('sections.userRights.title')}</a></li>
                <li><a href="#data-security" className="hover:text-[#8D6AFA] transition-colors">{t('sections.dataSecurity.title')}</a></li>
                <li><a href="#cookies" className="hover:text-[#8D6AFA] transition-colors">{t('sections.cookies.title')}</a></li>
                <li><a href="#international-transfers" className="hover:text-[#8D6AFA] transition-colors">{t('sections.internationalTransfers.title')}</a></li>
                <li><a href="#children" className="hover:text-[#8D6AFA] transition-colors">{t('sections.children.title')}</a></li>
                <li><a href="#contact" className="hover:text-[#8D6AFA] transition-colors">{t('sections.contact.title')}</a></li>
              </ol>
            </nav>

            {/* Content Sections */}
            <div className="max-w-none space-y-10">
              {/* 1. Data Controller */}
              <section id="data-controller" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <UserCheck className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataController.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.dataController.content')}</p>
                <div className="bg-white/[0.06] rounded-lg border border-white/[0.08] p-4">
                  <p className="text-sm text-white/70">
                    <strong className="text-white/90">{t('sections.dataController.company')}:</strong> DreamOne Holding BV<br />
                    <strong className="text-white/90">{t('sections.dataController.registration')}:</strong> 88073955<br />
                    <strong className="text-white/90">{t('sections.dataController.email')}:</strong> info@neuralsummary.com<br />
                    <strong className="text-white/90">{t('sections.dataController.dpo')}:</strong> admin@neuralsummary.com
                  </p>
                </div>
              </section>

              {/* 2. Data We Collect */}
              <section id="data-collected" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Database className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataCollected.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.dataCollected.content')}</p>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.dataCollected.personal.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.dataCollected.personal.email')}</li>
                  <li>{t('sections.dataCollected.personal.name')}</li>
                  <li>{t('sections.dataCollected.personal.profile')}</li>
                  <li>{t('sections.dataCollected.personal.payment')}</li>
                </ul>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.dataCollected.usage.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.dataCollected.usage.audioFiles')}</li>
                  <li>{t('sections.dataCollected.usage.transcriptions')}</li>
                  <li>{t('sections.dataCollected.usage.analysisResults')}</li>
                  <li>{t('sections.dataCollected.usage.preferences')}</li>
                </ul>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.dataCollected.technical.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.dataCollected.technical.ipAddress')}</li>
                  <li>{t('sections.dataCollected.technical.browser')}</li>
                  <li>{t('sections.dataCollected.technical.device')}</li>
                  <li>{t('sections.dataCollected.technical.logs')}</li>
                </ul>
              </section>

              {/* 3. Legal Basis for Processing */}
              <section id="legal-basis" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <FileCheck className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.legalBasis.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.legalBasis.content')}</p>

                <div className="space-y-3">
                  <div className="border-l-4 border-green-400/50 pl-3">
                    <h4 className="text-sm font-semibold text-white/90">{t('sections.legalBasis.contract.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.legalBasis.contract.content')}</p>
                  </div>

                  <div className="border-l-4 border-blue-400/50 pl-3">
                    <h4 className="text-sm font-semibold text-white/90">{t('sections.legalBasis.consent.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.legalBasis.consent.content')}</p>
                  </div>

                  <div className="border-l-4 border-purple-400/50 pl-3">
                    <h4 className="text-sm font-semibold text-white/90">{t('sections.legalBasis.legitimate.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.legalBasis.legitimate.content')}</p>
                  </div>

                  <div className="border-l-4 border-orange-400/50 pl-3">
                    <h4 className="text-sm font-semibold text-white/90">{t('sections.legalBasis.legal.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.legalBasis.legal.content')}</p>
                  </div>
                </div>
              </section>

              {/* 4. How We Use Your Data */}
              <section id="data-usage" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Eye className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataUsage.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.dataUsage.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.dataUsage.purposes.service')}</li>
                  <li>{t('sections.dataUsage.purposes.communication')}</li>
                  <li>{t('sections.dataUsage.purposes.improvement')}</li>
                  <li>{t('sections.dataUsage.purposes.security')}</li>
                  <li>{t('sections.dataUsage.purposes.compliance')}</li>
                  <li>{t('sections.dataUsage.purposes.analytics')}</li>
                </ul>
              </section>

              {/* 5. Data Sharing */}
              <section id="data-sharing" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Users className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataSharing.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.dataSharing.content')}</p>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.dataSharing.serviceProviders.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.dataSharing.serviceProviders.hosting')}</li>
                  <li>{t('sections.dataSharing.serviceProviders.transcription')}</li>
                  <li>{t('sections.dataSharing.serviceProviders.analysis')}</li>
                  <li>{t('sections.dataSharing.serviceProviders.email')}</li>
                  <li>{t('sections.dataSharing.serviceProviders.analytics')}</li>
                </ul>

                <div className="bg-yellow-500/10 border-l-4 border-yellow-400/50 p-3 mt-4 rounded-r-lg">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-white/70">{t('sections.dataSharing.notice')}</p>
                  </div>
                </div>
              </section>

              {/* 6. Data Retention */}
              <section id="data-retention" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Clock className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataRetention.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.dataRetention.content')}</p>

                <div className="bg-white/[0.06] rounded-lg border border-white/[0.08] p-4">
                  <h3 className="text-base font-semibold text-white/90 mb-2">{t('sections.dataRetention.periods.title')}</h3>
                  <ul className="space-y-1 text-sm text-white/70">
                    <li><strong className="text-white/90">{t('sections.dataRetention.periods.account')}:</strong> Until 12 months after account deletion</li>
                    <li><strong className="text-white/90">{t('sections.dataRetention.periods.transcriptions')}:</strong> Keep until deleted</li>
                    <li><strong className="text-white/90">{t('sections.dataRetention.periods.audioFiles')}:</strong> Retained for 30 days after processing for support and recovery purposes, then automatically deleted</li>
                    <li><strong className="text-white/90">{t('sections.dataRetention.periods.logs')}:</strong> 1 year for audit/security purposes</li>
                    <li><strong className="text-white/90">{t('sections.dataRetention.periods.analytics')}:</strong> 12 months</li>
                  </ul>
                </div>
              </section>

              {/* 7. Your Rights (GDPR) */}
              <section id="user-rights" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <UserCheck className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.userRights.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.userRights.content')}</p>

                <div className="space-y-4">
                  <div className="bg-green-500/10 border-l-4 border-green-400/50 p-3 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-white/90 mb-1">{t('sections.userRights.rights.access.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.userRights.rights.access.content')}</p>
                  </div>

                  <div className="bg-blue-500/10 border-l-4 border-blue-400/50 p-3 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-white/90 mb-1">{t('sections.userRights.rights.rectification.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.userRights.rights.rectification.content')}</p>
                  </div>

                  <div className="bg-red-500/10 border-l-4 border-red-400/50 p-3 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-white/90 mb-1">{t('sections.userRights.rights.erasure.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.userRights.rights.erasure.content')}</p>
                  </div>

                  <div className="bg-purple-500/10 border-l-4 border-purple-400/50 p-3 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-white/90 mb-1">{t('sections.userRights.rights.portability.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.userRights.rights.portability.content')}</p>
                  </div>

                  <div className="bg-orange-500/10 border-l-4 border-orange-400/50 p-3 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-white/90 mb-1">{t('sections.userRights.rights.restriction.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.userRights.rights.restriction.content')}</p>
                  </div>

                  <div className="bg-yellow-500/10 border-l-4 border-yellow-400/50 p-3 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-white/90 mb-1">{t('sections.userRights.rights.objection.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.userRights.rights.objection.content')}</p>
                  </div>

                  <div className="bg-indigo-500/10 border-l-4 border-indigo-400/50 p-3 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-white/90 mb-1">{t('sections.userRights.rights.withdraw.title')}</h4>
                    <p className="text-sm text-white/70">{t('sections.userRights.rights.withdraw.content')}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white/[0.06] rounded-lg border border-white/[0.08]">
                  <p className="text-sm text-white/80 font-medium">{t('sections.userRights.howToExercise')}</p>
                  <p className="text-sm text-white/70 mt-1">{t('sections.userRights.responseTime')}</p>
                </div>
              </section>

              {/* 8. Data Security */}
              <section id="data-security" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Lock className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataSecurity.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.dataSecurity.content')}</p>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.dataSecurity.measures.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                  <li>{t('sections.dataSecurity.measures.encryption')}</li>
                  <li>{t('sections.dataSecurity.measures.access')}</li>
                  <li>{t('sections.dataSecurity.measures.monitoring')}</li>
                  <li>{t('sections.dataSecurity.measures.backup')}</li>
                  <li>{t('sections.dataSecurity.measures.training')}</li>
                  <li>{t('sections.dataSecurity.measures.incident')}</li>
                </ul>

                <div className="bg-blue-500/10 border-l-4 border-blue-400/50 p-3 mt-4 rounded-r-lg">
                  <p className="text-sm text-white/70">{t('sections.dataSecurity.breach')}</p>
                </div>
              </section>

              {/* 9. Cookies */}
              <section id="cookies" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Cookie className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.cookies.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.cookies.content')}</p>

                <h3 className="text-lg font-semibold text-white/90 mt-4 mb-2">{t('sections.cookies.types.title')}</h3>

                <div className="space-y-3">
                  <div className="bg-white/[0.06] rounded-lg border border-white/[0.08] p-3">
                    <h4 className="text-sm font-semibold text-white/90">{t('sections.cookies.types.essential.title')}</h4>
                    <p className="text-xs text-white/60 mt-1">{t('sections.cookies.types.essential.content')}</p>
                  </div>

                  <div className="bg-white/[0.06] rounded-lg border border-white/[0.08] p-3">
                    <h4 className="text-sm font-semibold text-white/90">{t('sections.cookies.types.analytics.title')}</h4>
                    <p className="text-xs text-white/60 mt-1">{t('sections.cookies.types.analytics.content')}</p>
                  </div>

                  <div className="bg-white/[0.06] rounded-lg border border-white/[0.08] p-3">
                    <h4 className="text-sm font-semibold text-white/90">{t('sections.cookies.types.functional.title')}</h4>
                    <p className="text-xs text-white/60 mt-1">{t('sections.cookies.types.functional.content')}</p>
                  </div>
                </div>

                <p className="text-sm text-white/70 mt-3">{t('sections.cookies.manage')}</p>
              </section>

              {/* 10. International Data Transfers */}
              <section id="international-transfers" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Globe className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.internationalTransfers.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.internationalTransfers.content')}</p>

                <div className="bg-blue-500/10 border-l-4 border-blue-400/50 p-3 rounded-r-lg">
                  <h4 className="text-sm font-semibold text-white/90 mb-1">{t('sections.internationalTransfers.safeguards.title')}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-white/70 ml-4">
                    <li>{t('sections.internationalTransfers.safeguards.scc')}</li>
                    <li>{t('sections.internationalTransfers.safeguards.adequacy')}</li>
                    <li>{t('sections.internationalTransfers.safeguards.shield')}</li>
                  </ul>
                </div>
              </section>

              {/* 11. Children's Privacy */}
              <section id="children" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3">{t('sections.children.title')}</h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.children.content')}</p>
                <div className="bg-yellow-500/10 border-l-4 border-yellow-400/50 p-3 rounded-r-lg">
                  <p className="text-sm text-white/70">{t('sections.children.age')}: <strong className="text-white/90">16 years</strong></p>
                </div>
              </section>

              {/* 12. Contact Information */}
              <section id="contact" className="scroll-mt-20">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Mail className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.contact.title')}
                </h2>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">{t('sections.contact.content')}</p>

                <div className="bg-white/[0.06] rounded-lg border border-white/[0.08] p-4">
                  <h3 className="text-base font-semibold text-white/90 mb-2">{t('sections.contact.dpo.title')}</h3>
                  <p className="text-sm text-white/70">
                    <strong className="text-white/90">{t('sections.contact.dpo.email')}:</strong> admin@neuralsummary.com<br />
                  </p>
                </div>

                <div className="bg-green-500/10 rounded-lg border border-green-400/20 p-4 mt-3">
                  <h3 className="text-base font-semibold text-white/90 mb-2">{t('sections.contact.supervisory.title')}</h3>
                  <p className="text-sm text-white/70 mb-1">{t('sections.contact.supervisory.content')}</p>
                  <p className="text-sm text-white/70">
                    <strong className="text-white/90">{t('sections.contact.supervisory.authority')}:</strong> Netherlands – Autoriteit Persoonsgegevens (AP)<br />
                    <strong className="text-white/90">{t('sections.contact.supervisory.website')}:</strong> https://www.autoriteitpersoonsgegevens.nl/en
                  </p>
                </div>
              </section>

              {/* Updates to This Policy */}
              <section className="mt-8 pt-6 border-t border-white/10">
                <h2 className="text-xl font-bold text-white mb-3">{t('sections.updates.title')}</h2>
                <p className="text-sm text-white/70 leading-relaxed">{t('sections.updates.content')}</p>
                <p className="text-sm text-white/70 mt-3 leading-relaxed">{t('sections.updates.notification')}</p>
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
