'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ChevronDown, Home } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`flex items-center gap-2 transition-colors focus:outline-none rounded-full ${
            compact
              ? 'p-0.5 hover:ring-2 hover:ring-gray-200'
              : 'px-2 py-1.5 hover:bg-gray-100 rounded-lg'
          }`}
          aria-label="User menu"
        >
          {user.photoURL ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.photoURL}
              alt={user.displayName || user.email || 'User'}
              className="h-8 w-8 rounded-full object-cover border border-gray-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[#8D6AFA] text-white flex items-center justify-center text-sm font-semibold">
              {getInitials()}
            </div>
          )}
          {!compact && (
            <ChevronDown className="h-4 w-4 text-gray-500 transition-transform data-[state=open]:rotate-180" />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-in fade-in-0 zoom-in-95"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email || 'User'}
                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#8D6AFA] text-white flex items-center justify-center text-base font-semibold">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {user.displayName && (
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.displayName}
                  </p>
                )}
                <p className="text-xs text-gray-600 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <DropdownMenu.Item
              onSelect={handleGoToDashboard}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:bg-gray-50 transition-colors outline-none cursor-pointer"
            >
              <Home className="h-4 w-4 text-gray-500" />
              <span>{t('userMenu.dashboard')}</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:bg-gray-50 transition-colors outline-none cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
              <span>{t('userMenu.signOut')}</span>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
