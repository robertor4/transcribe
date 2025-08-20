'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/contexts/AnalyticsContext';

export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Extract locale from pathname
    const pathParts = pathname.split('/');
    const locale = pathParts[1];
    const pagePath = pathParts.slice(2).join('/') || 'home';

    // Create page title from path
    const pageTitle = pagePath
      .split('/')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' - ') || 'Home';

    // Track page view with additional context
    trackEvent('page_view', {
      page_path: pathname,
      page_title: pageTitle,
      page_location: window.location.href,
      locale: locale,
      referrer: document.referrer,
      search_params: Object.fromEntries(searchParams.entries()),
    });

    // Track specific page views for important pages
    if (pathname.includes('/landing')) {
      trackEvent('landing_page_viewed', {
        locale: locale,
        referrer: document.referrer,
      });
    } else if (pathname.includes('/dashboard')) {
      trackEvent('dashboard_viewed', {
        locale: locale,
      });
    } else if (pathname.includes('/pricing')) {
      trackEvent('pricing_viewed', {
        locale: locale,
      });
    }
  }, [pathname, searchParams, trackEvent]);
}