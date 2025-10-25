import { UsageProvider } from '@/contexts/UsageContext';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <UsageProvider>{children}</UsageProvider>;
}
