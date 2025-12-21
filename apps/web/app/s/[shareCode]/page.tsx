'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Legacy share link redirect
 *
 * This route handles old share links in the format /s/[shareCode]
 * and redirects them to the new locale-aware format: /[locale]/shared/[shareToken]
 *
 * The redirect preserves the share token and detects the user's preferred
 * language from localStorage or falls back to English.
 */
export default function LegacyShareRedirect() {
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;

  useEffect(() => {
    if (!shareCode) return;

    // Get user's preferred locale from localStorage, default to 'en'
    const preferredLocale = typeof window !== 'undefined'
      ? localStorage.getItem('preferredLanguage') || 'en'
      : 'en';

    // Redirect to new locale-aware route
    const newUrl = `/${preferredLocale}/shared/${shareCode}`;
    router.replace(newUrl);
  }, [shareCode, router]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8D6AFA] border-r-transparent mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
