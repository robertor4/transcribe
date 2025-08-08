'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { 
  Shield, 
  Zap, 
  Brain, 
  Lock, 
  Award, 
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  Star,
  Upload,
  ArrowRight
} from 'lucide-react';

interface HowItWorksProps {
  onStartTranscribing?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartTranscribing }) => {
  const t = useTranslations('howItWorks');
  const tLanding = useTranslations('landing');
  const tSecurity = useTranslations('landing.security');
  return (
    <div className="space-y-8">
      {/* Hero Section with Value Proposition */}
      <div className="text-center space-y-4 py-8 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
        <div className="flex justify-center mb-4">
          <div className="flex -space-x-2">
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          </div>
          <span className="ml-3 text-sm text-gray-600 font-medium">
            {tLanding('hero.trustIndicators.users')}
          </span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">
          {tLanding('hero.title')} 
          <span className="text-[#cc3399] font-bold"> {tLanding('hero.titleHighlight')}</span>
        </h1>
        
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          {tLanding('hero.subtitle')}
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <Clock className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-semibold text-gray-800">{tLanding('hero.features.saveTime')}</span>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <Users className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-semibold text-gray-800">{tLanding('hero.trustIndicators.users')}</span>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
            <span className="text-sm font-semibold text-gray-800">{tLanding('hero.features.accuracy')}</span>
          </div>
        </div>

        {/* Call to Action Button */}
        {onStartTranscribing && (
          <div className="pt-4">
            <button
              onClick={onStartTranscribing}
              className="inline-flex items-center px-6 py-3 bg-[#cc3399] text-white font-semibold rounded-lg shadow-lg hover:bg-[#b82d89] transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2"
            >
              {tLanding('hero.cta.primary')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            <p className="text-sm text-gray-600 mt-2">
              {tLanding('hero.guarantee')}
            </p>
          </div>
        )}
      </div>

      {/* Trust & Security Section */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              {tSecurity('title')}
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{tSecurity('encryption.title')}</strong> - {tSecurity('encryption.description')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{tSecurity('retention.title')}</strong> - {tSecurity('retention.description')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{tSecurity('compliance.title')}</strong> - {tSecurity('compliance.description')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{tSecurity('audit.title')}</strong> - {tSecurity('audit.description')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Steps */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('title')}
        </h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-4xl font-bold text-gray-100">1</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('step1.title')}</h3>
              <p className="text-sm text-gray-600">
                {t('step1.description')}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-4xl font-bold text-gray-100">2</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('step2.title')}</h3>
              <p className="text-sm text-gray-600">
                {t('step2.description')}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-4xl font-bold text-gray-100">3</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('step3.title')}</h3>
              <p className="text-sm text-gray-600">
                {t('step3.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {tLanding('testimonials.title')}
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 italic mb-2">
              "{tLanding('testimonials.testimonial1.quote')}"
            </p>
            <p className="text-xs text-gray-500 font-medium">
              - {tLanding('testimonials.testimonial1.author')}, {tLanding('testimonials.testimonial1.role')}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 italic mb-2">
              "{tLanding('testimonials.testimonial2.quote')}"
            </p>
            <p className="text-xs text-gray-500 font-medium">
              - {tLanding('testimonials.testimonial2.author')}, {tLanding('testimonials.testimonial2.role')}
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-[#cc3399] rounded-xl p-6 text-center text-white">
        <Lock className="h-8 w-8 mx-auto mb-3 text-white/90" />
        <h3 className="text-xl font-bold mb-2">
          {tLanding('cta.title')}
        </h3>
        <p className="text-sm text-white/90 mb-4 max-w-md mx-auto">
          {tLanding('cta.subtitle')}
        </p>
        
        {onStartTranscribing && (
          <button
            onClick={onStartTranscribing}
            className="inline-flex items-center px-6 py-3 bg-white text-[#cc3399] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#cc3399] mb-4"
          >
            <Upload className="h-5 w-5 mr-2" />
            {t('step1.title')}
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        )}
        
        <div className="flex justify-center items-center space-x-2 text-xs text-white/80">
          <Shield className="h-4 w-4" />
          <span>{tSecurity('badges.ssl')}</span>
          <span>•</span>
          <span>{tSecurity('badges.gdpr')}</span>
          <span>•</span>
          <span>{tSecurity('badges.iso')}</span>
        </div>
      </div>
    </div>
  );
};