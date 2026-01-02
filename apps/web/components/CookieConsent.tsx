'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { Cookie, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

export function CookieConsent() {
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#8D6AFA] rounded-full">
                <Cookie className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  We use cookies to improve your experience
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Help us make Neural Summary better by allowing analytics
                </p>
              </div>
            </div>
            <button
              onClick={handleDecline}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We use Firebase Analytics to understand how you use our app and improve your experience.
              This includes tracking page views, feature usage, and performance metrics.
              Your data is never sold to third parties.
            </p>

            {/* Expandable Details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm text-[#8D6AFA] hover:text-[#7A5AE0] transition-colors"
            >
              <span className="mr-1">Learn more about our privacy practices</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDetails && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">What we collect:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                      <li>• Page views and navigation patterns</li>
                      <li>• Feature usage (uploads, transcriptions, summaries)</li>
                      <li>• Performance metrics and error reports</li>
                      <li>• Device and browser information</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">What we DON&apos;T collect:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                      <li>• Your audio files or transcription content</li>
                      <li>• Personal identifiable information without consent</li>
                      <li>• Data for advertising purposes</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You can change your preference anytime in the dashboard settings.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleAccept}
                variant="brand"
                size="md"
                fullWidth
              >
                Accept Analytics
              </Button>
              <Button
                onClick={handleDecline}
                variant="ghost"
                size="md"
                fullWidth
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}