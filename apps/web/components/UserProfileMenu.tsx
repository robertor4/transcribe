'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationToggle } from '@/components/NotificationToggle';

export function UserProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const tAuth = useTranslations('auth');
  const tSettings = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/login');
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    router.push('/settings/preferences');
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push('/settings/profile');
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
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={tCommon('userMenu')}
      >
        {/* Profile Picture or Initials Avatar */}
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || user.email || 'User'}
            className="h-8 w-8 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-[#cc3399] text-white flex items-center justify-center text-sm font-semibold">
            {getInitials()}
          </div>
        )}

        {/* User Name/Email (hidden on mobile) */}
        <span className="hidden md:block text-sm font-medium text-gray-800 max-w-[150px] truncate">
          {user.displayName || user.email}
        </span>

        {/* Chevron Icon */}
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email || 'User'}
                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#cc3399] text-white flex items-center justify-center text-base font-semibold">
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
            {/* Profile */}
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="h-5 w-5 text-gray-600" />
              <span>{tSettings('profile')}</span>
            </button>

            {/* Settings */}
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-5 w-5 text-gray-600" />
              <span>{tSettings('title')}</span>
            </button>
          </div>

          {/* Language & Notifications Section */}
          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
            {/* Language Switcher */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {tCommon('language')}
              </label>
              <LanguageSwitcher />
            </div>

            {/* Notifications Toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {tSettings('notifications')}
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800">
                  {tCommon('browserNotifications')}
                </span>
                <NotificationToggle />
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
              <span>{tAuth('signOut')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
