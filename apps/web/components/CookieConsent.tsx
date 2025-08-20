'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { Cookie, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CookieConsent() {
  // const t = useTranslations('cookieConsent');
  const { setAnalyticsConsent } = useAnalytics();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has already made a choice only after mounting
    const consentChoice = localStorage.getItem('analytics_consent');
    if (consentChoice === null) {
      // No choice made yet, show banner after a delay
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    setAnalyticsConsent(true);
    setShowBanner(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setShowBanner(false);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-[#cc3399] to-[#9933cc] rounded-lg">
                <Cookie className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  We use cookies to improve your experience
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Help us make Neural Summary better by allowing analytics
                </p>
              </div>
            </div>
            <button
              onClick={handleDecline}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              We use Firebase Analytics to understand how you use our app and improve your experience. 
              This includes tracking page views, feature usage, and performance metrics. 
              Your data is never sold to third parties.
            </p>

            {/* Expandable Details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm text-[#cc3399] hover:text-[#b82d89] transition-colors"
            >
              <span className="mr-1">Learn more about our privacy practices</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDetails && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">What we collect:</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Page views and navigation patterns</li>
                      <li>• Feature usage (uploads, transcriptions, summaries)</li>
                      <li>• Performance metrics and error reports</li>
                      <li>• Device and browser information</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">What we DON&apos;T collect:</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Your audio files or transcription content</li>
                      <li>• Personal identifiable information without consent</li>
                      <li>• Data for advertising purposes</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  You can change your preference anytime in the dashboard settings.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAccept}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#cc3399] to-[#9933cc] text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2"
              >
                Accept Analytics
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}