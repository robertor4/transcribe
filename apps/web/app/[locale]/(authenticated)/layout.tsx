'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { ApiHealthProvider } from '@/contexts/ApiHealthContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';
import { FoldersProvider } from '@/contexts/FoldersContext';
import { ImportedConversationsProvider } from '@/contexts/ImportedConversationsContext';
import { UsageProvider } from '@/contexts/UsageContext';
import { PageTracker } from '@/components/PageTracker';
import { CookieConsent } from '@/components/CookieConsent';
import { ApiUnavailableBanner } from '@/components/ApiUnavailableBanner';
import { Toaster } from '@/components/ui/sonner';

/**
 * Layout for authenticated pages that need full context providers.
 * This includes dashboard, conversations, folders, settings, etc.
 *
 * By moving these heavy providers here (instead of the root locale layout),
 * we avoid loading Firebase, WebSockets, and other heavy dependencies
 * on public pages like the landing page.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        <ApiHealthProvider>
          <UsageProvider>
            <ConversationsProvider>
              <FoldersProvider>
                <ImportedConversationsProvider>
                  <PageTracker />
                  <ApiUnavailableBanner />
                  {children}
                  <CookieConsent />
                  <Toaster position="top-center" />
                </ImportedConversationsProvider>
              </FoldersProvider>
            </ConversationsProvider>
          </UsageProvider>
        </ApiHealthProvider>
      </AnalyticsProvider>
    </AuthProvider>
  );
}
