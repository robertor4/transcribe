'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!loading) {
      // Extract locale from current pathname
      const locale = pathname.split('/')[1] || 'en';

      // Always redirect to landing page (both logged-in and logged-out users)
      // Users can navigate to dashboard manually via nav or links
      router.push(`/${locale}/landing`);
    }
  }, [loading, router, pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc3399]"></div>
    </div>
  );
}