'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ChevronDown, Home } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/UserAvatar';

interface UserAvatarDropdownProps {
  /** Compact mode shows only avatar without dropdown arrow */
  compact?: boolean;
}

/**
 * Lightweight user avatar dropdown for shared/public pages.
 * Shows user's avatar/initials with a simple dropdown menu.
 */
export function UserAvatarDropdown({ compact = false }: UserAvatarDropdownProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('shared');

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  const handleGoToDashboard = () => {
    router.push(`/${locale}/dashboard`);
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 transition-colors focus:outline-none rounded-full ${
            compact
              ? 'p-0.5 hover:ring-2 hover:ring-gray-200'
              : 'px-2 py-1.5 hover:bg-gray-100 rounded-lg'
          }`}
          aria-label="User menu"
        >
          <UserAvatar size="sm" />
          {!compact && (
            <ChevronDown className="h-4 w-4 text-gray-500 transition-transform data-[state=open]:rotate-180" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        {/* User Info */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar size="md" />
            <div className="flex-1 min-w-0">
              {user.displayName && (
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.displayName}
                </p>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem
          onSelect={handleGoToDashboard}
          className="gap-3 px-4 py-2 cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>{t('userMenu.dashboard')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleLogout}
          className="gap-3 px-4 py-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('userMenu.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
