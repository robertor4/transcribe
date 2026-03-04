'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Auth guard for authenticated routes.
 * Redirects unauthenticated users to login page and
 * unverified users to the email verification page.
 *
 * Renders a minimal loading screen (no context-dependent components)
 * since this sits above most providers in the layout tree.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/${locale}/login`);
    } else if (!user.emailVerified) {
      router.replace(`/${locale}/verify-email`);
    }
  }, [loading, user, router, locale]);

  if (loading || !user || !user.emailVerified) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#8D6AFA] rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
