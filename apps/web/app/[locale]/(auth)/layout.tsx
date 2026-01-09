'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';

/**
 * Layout for auth-related pages (login, signup, verify-email, etc.)
 * These pages need AuthProvider and AnalyticsProvider for tracking
 * auth events, but NOT the heavy dashboard contexts (Conversations,
 * Folders, Usage).
 *
 * This still significantly reduces bundle size compared to the full
 * dashboard layout.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
    </AuthProvider>
  );
}
