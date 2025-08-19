'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { 
  Shield, 
  Brain, 
  Lock, 
  Award, 
  CheckCircle,
  Star,
  ArrowRight,
  Mic,
  Sparkles,
  Upload
} from 'lucide-react';

interface HowItWorksProps {
  onStartTranscribing?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartTranscribing }) => {
  const t = useTranslations('landing.howItWorks');
  const tLanding = useTranslations('landing');
  const tSecurity = useTranslations('landing.security');
  
  return (
    <div className="space-y-12">
      {/* How It Works Steps */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {/* Step 1 */}
          <article className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-transparent hover:border-[#cc3399] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
            <div className="relative">
              <div className="absolute top-4 right-4 z-10 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="h-48 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                <img 
                  src="/assets/images/how-it-works-step1-recording.webp"
                  alt="Recording audio easily"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full"><div class="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center"><svg class="h-10 w-10 text-[#cc3399]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg></div></div>';
                  }}
                />
              </div>
            </div>
            <div className="p-8">
              <div className="w-14 h-14 bg-[#cc3399]/10 rounded-xl flex items-center justify-center mb-4">
                <Mic className="h-7 w-7 text-[#cc3399]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('step1.title')}
              </h3>
              <p className="text-gray-600">
                {t('step1.description')}
              </p>
            </div>
          </article>

          {/* Step 2 */}
          <article className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-transparent hover:border-[#cc3399] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
            <div className="relative">
              <div className="absolute top-4 right-4 z-10 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="h-48 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
                <img 
                  src="/assets/images/how-it-works-step2-ai-processing.webp"
                  alt="AI processing audio"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full"><div class="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center"><svg class="h-10 w-10 text-[#cc3399]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div></div>';
                  }}
                />
              </div>
            </div>
            <div className="p-8">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Brain className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('step2.title')}
              </h3>
              <p className="text-gray-600">
                {t('step2.description')}
              </p>
            </div>
          </article>

          {/* Step 3 */}
          <article className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-transparent hover:border-[#cc3399] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
            <div className="relative">
              <div className="absolute top-4 right-4 z-10 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                <img 
                  src="/assets/images/how-it-works-step3-insights.webp"
                  alt="Reviewing insights and summaries"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full"><div class="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center"><svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div>';
                  }}
                />
              </div>
            </div>
            <div className="p-8">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('step3.title')}
              </h3>
              <p className="text-gray-600">
                {t('step3.description')}
              </p>
            </div>
          </article>
        </div>
      </div>

      {/* Trust & Security Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">
                  {tSecurity('title')}
                </h2>
              </div>
              <p className="text-lg text-gray-600">
                {tSecurity('subtitle')}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{tSecurity('encryption.title')}</p>
                  <p className="text-sm text-gray-600">{tSecurity('encryption.description')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{tSecurity('retention.title')}</p>
                  <p className="text-sm text-gray-600">{tSecurity('retention.description')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{tSecurity('compliance.title')}</p>
                  <p className="text-sm text-gray-600">{tSecurity('compliance.description')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{tSecurity('audit.title')}</p>
                  <p className="text-sm text-gray-600">{tSecurity('audit.description')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <Lock className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-700 font-medium">{tSecurity('badges.ssl')}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <Shield className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-700 font-medium">{tSecurity('badges.soc2')}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <Award className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-700 font-medium">{tSecurity('badges.gdpr')}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-700 font-medium">{tSecurity('badges.hipaa')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {tLanding('testimonials.title')}
          </h3>
          <div className="flex justify-center items-center space-x-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <p className="text-gray-600">{tLanding('testimonials.rating')}</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <blockquote className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-4 italic">
              &ldquo;{tLanding('testimonials.testimonial1.quote')}&rdquo;
            </p>
            <footer>
              <cite className="font-semibold text-gray-900 text-sm not-italic">{tLanding('testimonials.testimonial1.author')}</cite>
              <p className="text-xs text-gray-500">{tLanding('testimonials.testimonial1.role')}</p>
            </footer>
          </blockquote>

          <blockquote className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-4 italic">
              &ldquo;{tLanding('testimonials.testimonial2.quote')}&rdquo;
            </p>
            <footer>
              <cite className="font-semibold text-gray-900 text-sm not-italic">{tLanding('testimonials.testimonial2.author')}</cite>
              <p className="text-xs text-gray-500">{tLanding('testimonials.testimonial2.role')}</p>
            </footer>
          </blockquote>

          <blockquote className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-4 italic">
              &ldquo;{tLanding('testimonials.testimonial3.quote')}&rdquo;
            </p>
            <footer>
              <cite className="font-semibold text-gray-900 text-sm not-italic">{tLanding('testimonials.testimonial3.author')}</cite>
              <p className="text-xs text-gray-500">{tLanding('testimonials.testimonial3.role')}</p>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-[#cc3399] to-purple-600 rounded-xl p-8 text-center text-white">
        <Sparkles className="h-10 w-10 mx-auto mb-4 text-white" />
        <h3 className="text-3xl font-bold mb-3">
          {tLanding('cta.title')}
        </h3>
        <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
          {tLanding('cta.subtitle')}
        </p>
        
        {onStartTranscribing && (
          <>
            <button
              onClick={onStartTranscribing}
              className="inline-flex items-center px-8 py-4 bg-white text-[#cc3399] font-semibold text-lg rounded-xl shadow-lg hover:bg-gray-100 transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#cc3399] mb-6"
            >
              <Upload className="h-5 w-5 mr-2" />
              {tLanding('cta.button')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            
            <div className="flex justify-center items-center space-x-4 text-sm text-white/80">
              <span>✓ {tLanding('cta.benefits.free')}</span>
              <span>✓ {tLanding('cta.benefits.noCard')}</span>
              <span>✓ {tLanding('cta.benefits.cancel')}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};