import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  ArrowLeft,
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
  
  const tCommon = await getTranslations({ locale, namespace: 'common' });

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
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#8D6AFA] to-[#9933cc] rounded-full mb-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('title')}</h1>
              <p className="text-sm text-gray-600">{t('effectiveDate')}: <strong>25 August 2025</strong></p>
              <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full">
                <Shield className="h-3 w-3 mr-1.5" />
                <span className="text-xs font-medium">{t('gdprCompliant')}</span>
              </div>
            </div>

            {/* Introduction */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
              <p className="text-sm text-gray-700">{t('introduction')}</p>
            </div>

            {/* Table of Contents */}
            <nav className="bg-gray-50 rounded-lg p-4 mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-3">{t('tableOfContents')}</h2>
              <ol className="space-y-1 list-decimal list-inside text-sm text-gray-700">
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
            <div className="prose prose-sm max-w-none space-y-8">
              {/* 1. Data Controller */}
              <section id="data-controller">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <UserCheck className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataController.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.dataController.content')}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>{t('sections.dataController.company')}:</strong> DreamOne Holding BV<br />
                    <strong>{t('sections.dataController.registration')}:</strong> 88073955<br />
                    <strong>{t('sections.dataController.email')}:</strong> info@neuralsummary.com<br />
                    <strong>{t('sections.dataController.dpo')}:</strong> admin@neuralsummary.com
                  </p>
                </div>
              </section>

              {/* 2. Data We Collect */}
              <section id="data-collected">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Database className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataCollected.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.dataCollected.content')}</p>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.dataCollected.personal.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.dataCollected.personal.email')}</li>
                  <li>{t('sections.dataCollected.personal.name')}</li>
                  <li>{t('sections.dataCollected.personal.profile')}</li>
                  <li>{t('sections.dataCollected.personal.payment')}</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.dataCollected.usage.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.dataCollected.usage.audioFiles')}</li>
                  <li>{t('sections.dataCollected.usage.transcriptions')}</li>
                  <li>{t('sections.dataCollected.usage.analysisResults')}</li>
                  <li>{t('sections.dataCollected.usage.preferences')}</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.dataCollected.technical.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.dataCollected.technical.ipAddress')}</li>
                  <li>{t('sections.dataCollected.technical.browser')}</li>
                  <li>{t('sections.dataCollected.technical.device')}</li>
                  <li>{t('sections.dataCollected.technical.logs')}</li>
                </ul>
              </section>

              {/* 3. Legal Basis for Processing */}
              <section id="legal-basis">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <FileCheck className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.legalBasis.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.legalBasis.content')}</p>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-green-400 pl-3">
                    <h4 className="text-sm font-semibold text-gray-800">{t('sections.legalBasis.contract.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.legalBasis.contract.content')}</p>
                  </div>
                  
                  <div className="border-l-4 border-blue-400 pl-3">
                    <h4 className="text-sm font-semibold text-gray-800">{t('sections.legalBasis.consent.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.legalBasis.consent.content')}</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-400 pl-3">
                    <h4 className="text-sm font-semibold text-gray-800">{t('sections.legalBasis.legitimate.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.legalBasis.legitimate.content')}</p>
                  </div>
                  
                  <div className="border-l-4 border-orange-400 pl-3">
                    <h4 className="text-sm font-semibold text-gray-800">{t('sections.legalBasis.legal.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.legalBasis.legal.content')}</p>
                  </div>
                </div>
              </section>

              {/* 4. How We Use Your Data */}
              <section id="data-usage">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Eye className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataUsage.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.dataUsage.content')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.dataUsage.purposes.service')}</li>
                  <li>{t('sections.dataUsage.purposes.communication')}</li>
                  <li>{t('sections.dataUsage.purposes.improvement')}</li>
                  <li>{t('sections.dataUsage.purposes.security')}</li>
                  <li>{t('sections.dataUsage.purposes.compliance')}</li>
                  <li>{t('sections.dataUsage.purposes.analytics')}</li>
                </ul>
              </section>

              {/* 5. Data Sharing */}
              <section id="data-sharing">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Users className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataSharing.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.dataSharing.content')}</p>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.dataSharing.serviceProviders.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.dataSharing.serviceProviders.hosting')}: Firebase (Google Cloud Platform)</li>
                  <li>{t('sections.dataSharing.serviceProviders.transcription')}: AssemblyAI, OpenAI Whisper</li>
                  <li>{t('sections.dataSharing.serviceProviders.analysis')}: OpenAI GPT-4</li>
                  <li>{t('sections.dataSharing.serviceProviders.email')}: Gmail SMTP</li>
                  <li>{t('sections.dataSharing.serviceProviders.analytics')}: Firebase Analytics</li>
                </ul>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{t('sections.dataSharing.notice')}</p>
                  </div>
                </div>
              </section>

              {/* 6. Data Retention */}
              <section id="data-retention">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Clock className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataRetention.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.dataRetention.content')}</p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-gray-800 mb-2">{t('sections.dataRetention.periods.title')}</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li><strong>{t('sections.dataRetention.periods.account')}:</strong> Until 12 months after account deletion</li>
                    <li><strong>{t('sections.dataRetention.periods.transcriptions')}:</strong> Keep until deleted</li>
                    <li><strong>{t('sections.dataRetention.periods.audioFiles')}:</strong> Retained for 30 days after processing for support and recovery purposes, then automatically deleted</li>
                    <li><strong>{t('sections.dataRetention.periods.logs')}:</strong> 1 year for audit/security purposes</li>
                    <li><strong>{t('sections.dataRetention.periods.analytics')}:</strong> 12 months</li>
                  </ul>
                </div>
              </section>

              {/* 7. Your Rights (GDPR) */}
              <section id="user-rights">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <UserCheck className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.userRights.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.userRights.content')}</p>
                
                <div className="space-y-4">
                  <div className="bg-green-50 border-l-4 border-green-400 p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('sections.userRights.rights.access.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.userRights.rights.access.content')}</p>
                  </div>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('sections.userRights.rights.rectification.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.userRights.rights.rectification.content')}</p>
                  </div>
                  
                  <div className="bg-red-50 border-l-4 border-red-400 p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('sections.userRights.rights.erasure.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.userRights.rights.erasure.content')}</p>
                  </div>
                  
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('sections.userRights.rights.portability.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.userRights.rights.portability.content')}</p>
                  </div>
                  
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('sections.userRights.rights.restriction.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.userRights.rights.restriction.content')}</p>
                  </div>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('sections.userRights.rights.objection.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.userRights.rights.objection.content')}</p>
                  </div>
                  
                  <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('sections.userRights.rights.withdraw.title')}</h4>
                    <p className="text-sm text-gray-700">{t('sections.userRights.rights.withdraw.content')}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700 font-medium">{t('sections.userRights.howToExercise')}</p>
                  <p className="text-sm text-gray-700 mt-1">{t('sections.userRights.responseTime')}</p>
                </div>
              </section>

              {/* 8. Data Security */}
              <section id="data-security">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Lock className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.dataSecurity.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.dataSecurity.content')}</p>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.dataSecurity.measures.title')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                  <li>{t('sections.dataSecurity.measures.encryption')}</li>
                  <li>{t('sections.dataSecurity.measures.access')}</li>
                  <li>{t('sections.dataSecurity.measures.monitoring')}</li>
                  <li>{t('sections.dataSecurity.measures.backup')}</li>
                  <li>{t('sections.dataSecurity.measures.training')}</li>
                  <li>{t('sections.dataSecurity.measures.incident')}</li>
                </ul>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-4">
                  <p className="text-sm text-gray-700">{t('sections.dataSecurity.breach')}</p>
                </div>
              </section>

              {/* 9. Cookies */}
              <section id="cookies">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Cookie className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.cookies.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.cookies.content')}</p>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{t('sections.cookies.types.title')}</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-800">{t('sections.cookies.types.essential.title')}</h4>
                    <p className="text-xs text-gray-700 mt-1">{t('sections.cookies.types.essential.content')}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-800">{t('sections.cookies.types.analytics.title')}</h4>
                    <p className="text-xs text-gray-700 mt-1">{t('sections.cookies.types.analytics.content')}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-800">{t('sections.cookies.types.functional.title')}</h4>
                    <p className="text-xs text-gray-700 mt-1">{t('sections.cookies.types.functional.content')}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mt-3">{t('sections.cookies.manage')}</p>
              </section>

              {/* 10. International Data Transfers */}
              <section id="international-transfers">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Globe className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.internationalTransfers.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.internationalTransfers.content')}</p>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{t('sections.internationalTransfers.safeguards.title')}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>{t('sections.internationalTransfers.safeguards.scc')}</li>
                    <li>{t('sections.internationalTransfers.safeguards.adequacy')}</li>
                    <li>{t('sections.internationalTransfers.safeguards.shield')}</li>
                  </ul>
                </div>
              </section>

              {/* 11. Children's Privacy */}
              <section id="children">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('sections.children.title')}</h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.children.content')}</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <p className="text-sm text-gray-700">{t('sections.children.age')}: <strong>16 years</strong></p>
                </div>
              </section>

              {/* 12. Contact Information */}
              <section id="contact">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Mail className="h-5 w-5 text-[#8D6AFA] mr-2" />
                  {t('sections.contact.title')}
                </h2>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{t('sections.contact.content')}</p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-gray-800 mb-2">{t('sections.contact.dpo.title')}</h3>
                  <p className="text-sm text-gray-700">
                    <strong>{t('sections.contact.dpo.email')}:</strong> admin@neuralsummary.com<br />
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 mt-3">
                  <h3 className="text-base font-semibold text-gray-800 mb-2">{t('sections.contact.supervisory.title')}</h3>
                  <p className="text-sm text-gray-700 mb-1">{t('sections.contact.supervisory.content')}</p>
                  <p className="text-sm text-gray-700">
                    <strong>{t('sections.contact.supervisory.authority')}:</strong> Netherlands – Autoriteit Persoonsgegevens (AP)<br />
                    <strong>{t('sections.contact.supervisory.website')}:</strong> https://www.autoriteitpersoonsgegevens.nl/en
                  </p>
                </div>
              </section>

              {/* Updates to This Policy */}
              <section className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('sections.updates.title')}</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{t('sections.updates.content')}</p>
                <p className="text-sm text-gray-700 mt-3 leading-relaxed">{t('sections.updates.notification')}</p>
              </section>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-8 mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm">
                © {new Date().getFullYear()} Neural Summary. {tCommon('allRightsReserved')}
              </p>
              <div className="mt-4 space-x-6 text-sm">
                <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
                  {t('links.terms')}
                </Link>
                <Link href={`/${locale}/landing`} className="hover:text-white transition-colors">
                  {t('links.home')}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}