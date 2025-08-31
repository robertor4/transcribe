'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile page by default
    router.replace('/settings/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc3399]"></div>
    </div>
  );
}