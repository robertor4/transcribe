'use client';

import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { UserActivityPanel } from './UserActivityPanel';

export function UserActivityClient() {
  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        showRightPanel={false}
        mobileTitle={
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
            User Activity
          </h1>
        }
        mainContent={<UserActivityPanel />}
      />
    </div>
  );
}
