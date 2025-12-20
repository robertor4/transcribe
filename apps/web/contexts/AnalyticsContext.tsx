'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { logEvent, setUserId, setUserProperties, Analytics } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';
import { User } from 'firebase/auth';

export type AnalyticsEventName =
  // User Journey Events
  | 'signup_started'
  | 'signup_completed'
  | 'login'
  | 'logout'
  | 'email_verified'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'subscription_started'
  | 'subscription_cancelled'

  // Core Feature Events
  | 'audio_uploaded'
  | 'transcription_started'
  | 'transcription_completed'
  | 'transcription_failed'
  | 'batch_transcription_started'
  | 'batch_transcription_completed'
  | 'summary_generated'
  | 'custom_analysis_requested'
  | 'speaker_detection_enabled'

  // Recording Events
  | 'recording_started'
  | 'recording_stopped'
  | 'recording_uploaded'
  | 'recording_error'
  | 'recording_upload_failed'
  | 'recording_permission_denied'
  | 'tab_audio_used'

  // Engagement Events
  | 'transcript_shared'
  | 'transcript_downloaded'
  | 'transcript_deleted'
  | 'share_link_created'
  | 'share_link_accessed'

  // Performance Events
  | 'upload_failed'
  | 'payment_failed'
  | 'websocket_connected'
  | 'websocket_disconnected'

  // Page View Events
  | 'page_view'
  | 'landing_page_viewed'
  | 'dashboard_viewed'
  | 'pricing_viewed'

  // GA4 E-commerce Events (Recommended)
  | 'view_item_list'          // User views pricing page with all tiers
  | 'view_item'               // User views specific pricing tier details
  | 'select_item'             // User clicks CTA button on pricing card
  | 'begin_checkout'          // User initiates checkout process
  | 'add_payment_info'        // Checkout session created successfully
  | 'purchase'                // Payment completed successfully
  | 'refund'                  // Subscription refunded/cancelled

  // Additional E-commerce Events
  | 'billing_cycle_toggled'   // User switches between monthly/annual
  | 'pricing_comparison_viewed' // User views feature comparison table
  | 'pricing_faq_viewed'      // User views FAQ section
  | 'checkout_error'          // Error during checkout process;

interface AnalyticsContextType {
  trackEvent: (eventName: AnalyticsEventName, parameters?: Record<string, any>) => void;
  setUserAnalyticsId: (userId: string | null) => void;
  setUserAnalyticsProperties: (properties: Record<string, any>) => void;
  isAnalyticsEnabled: boolean;
  setAnalyticsConsent: (consent: boolean) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  user?: User | null;
}

export function AnalyticsProvider({ children, user }: AnalyticsProviderProps) {
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false);
  const [analyticsInstance, setAnalyticsInstance] = useState<Analytics | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for user consent from localStorage only after mounting
    const consent = localStorage.getItem('analytics_consent');
    setIsAnalyticsEnabled(consent === 'true');

    // Wait for analytics to be initialized
    const checkAnalytics = setInterval(() => {
      if (analytics) {
        setAnalyticsInstance(analytics);
        clearInterval(checkAnalytics);
      }
    }, 100);

    return () => clearInterval(checkAnalytics);
  }, []);

  useEffect(() => {
    // Set user ID when user changes
    if (analyticsInstance && isAnalyticsEnabled && user) {
      setUserId(analyticsInstance, user.uid);
      setUserProperties(analyticsInstance, {
        email_verified: user.emailVerified,
        provider: user.providerData[0]?.providerId || 'email',
      });
    } else if (analyticsInstance && !user) {
      setUserId(analyticsInstance, null);
    }
  }, [user, analyticsInstance, isAnalyticsEnabled]);

  const trackEvent = useCallback((
    eventName: AnalyticsEventName,
    parameters?: Record<string, any>
  ) => {
    if (!analyticsInstance || !isAnalyticsEnabled) {
      return;
    }

    try {
      // Add timestamp and session info to all events
      const enrichedParams = {
        ...parameters,
        timestamp: new Date().toISOString(),
        user_id: user?.uid || 'anonymous',
      };

      logEvent(analyticsInstance, eventName as string, enrichedParams);
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error);
    }
  }, [analyticsInstance, isAnalyticsEnabled, user]);

  const setUserAnalyticsId = useCallback((userId: string | null) => {
    if (!analyticsInstance || !isAnalyticsEnabled) return;
    
    try {
      setUserId(analyticsInstance, userId);
    } catch (error) {
      console.error('[Analytics] Error setting user ID:', error);
    }
  }, [analyticsInstance, isAnalyticsEnabled]);

  const setUserAnalyticsProperties = useCallback((properties: Record<string, any>) => {
    if (!analyticsInstance || !isAnalyticsEnabled) return;
    
    try {
      setUserProperties(analyticsInstance, properties);
    } catch (error) {
      console.error('[Analytics] Error setting user properties:', error);
    }
  }, [analyticsInstance, isAnalyticsEnabled]);

  const setAnalyticsConsent = useCallback((consent: boolean) => {
    localStorage.setItem('analytics_consent', consent.toString());
    setIsAnalyticsEnabled(consent);
    
    if (consent && analyticsInstance) {
      // Track consent given
      logEvent(analyticsInstance, 'analytics_consent_given', {
        timestamp: new Date().toISOString(),
      });
    }
  }, [analyticsInstance]);

  const value: AnalyticsContextType = {
    trackEvent,
    setUserAnalyticsId,
    setUserAnalyticsProperties,
    isAnalyticsEnabled,
    setAnalyticsConsent,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}