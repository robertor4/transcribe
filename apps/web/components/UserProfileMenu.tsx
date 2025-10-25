'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';
import { useTranslations } from 'next-intl';
import { LogOut, Settings, User as UserIcon, ChevronDown, Shield } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationToggle } from '@/components/NotificationToggle';
import { UsageIndicator } from '@/components/paywall/UsageIndicator';
import { UserRole } from '@transcribe/shared';

export function UserProfileMenu() {
  const { user, logout } = useAuth();
  const { usageStats } = useUsage();
  const router = useRouter();
  const tAuth = useTranslations('auth');
  const tSettings = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tUsage = useTranslations('usage');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Fetch user profile to check if admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.data?.role === UserRole.ADMIN);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

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

  const handleAdminPanelClick = () => {
    setIsOpen(false);
    router.push('/admin');
  };

  const handleUpgradeClick = () => {
    setIsOpen(false);
    router.push('/pricing');
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={tCommon('userMenu')}
      >
        {/* Profile Picture or Initials Avatar */}
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || user.email || 'User'}
            className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-[#cc3399] text-white flex items-center justify-center text-sm font-semibold">
            {getInitials()}
          </div>
        )}

        {/* User Name/Email (hidden on mobile) */}
        <span className="hidden md:block text-sm font-medium text-gray-800 dark:text-gray-200 max-w-[150px] truncate">
          {user.displayName || user.email}
        </span>

        {/* Chevron Icon */}
        <ChevronDown
          className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email || 'User'}
                  className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#cc3399] text-white flex items-center justify-center text-base font-semibold">
                  {getInitials()}
                </div>
              )}
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

          {/* Usage Stats Section */}
          {usageStats && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {tUsage('yourUsage')} ({usageStats.tier})
                </span>
              </div>

              {/* Primary metric based on tier */}
              {usageStats.tier === 'free' && (
                <>
                  {/* Transcriptions */}
                  <UsageIndicator
                    current={usageStats.usage.transcriptions}
                    limit={usageStats.limits.transcriptions}
                    unit=""
                    label={tUsage('transcriptions')}
                    percentUsed={usageStats.percentUsed}
                    showWarning={false}
                  />

                  {/* On-Demand Analyses */}
                  <UsageIndicator
                    current={usageStats.usage.onDemandAnalyses}
                    limit={usageStats.limits.onDemandAnalyses}
                    unit=""
                    label={tUsage('onDemandAnalyses')}
                    percentUsed={
                      (usageStats.usage.onDemandAnalyses /
                        (usageStats.limits.onDemandAnalyses || 1)) *
                      100
                    }
                    showWarning={false}
                  />
                </>
              )}

              {(usageStats.tier === 'professional' || usageStats.tier === 'business') && (
                <UsageIndicator
                  current={usageStats.usage.hours}
                  limit={usageStats.limits.hours}
                  unit=""
                  label={tUsage('hours')}
                  percentUsed={usageStats.percentUsed}
                  showWarning={false}
                />
              )}

              {usageStats.tier === 'payg' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {usageStats.paygCredits?.toFixed(1) || '0.0'} {tUsage('hours')}
                  </span>{' '}
                  {tUsage('remaining')}
                </div>
              )}

              {/* Reset date */}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {tUsage('resetsOn')} {new Date(usageStats.resetDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }).replace(/ /g, '-')}
              </p>

              {/* Upgrade prompt for free tier users */}
              {usageStats.tier === 'free' && (
                <button
                  onClick={handleUpgradeClick}
                  className="mt-3 w-full px-3 py-1.5 bg-[#cc3399] text-white text-xs font-medium rounded-md hover:bg-[#b82d89] transition-colors"
                >
                  {tUsage('upgradePlan')}
                </button>
              )}
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            {/* Admin Panel (only for admins) */}
            {isAdmin && (
              <div className="pb-2 mb-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleAdminPanelClick}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors rounded-md"
                >
                  <Shield className="h-5 w-5 text-[#cc3399]" />
                  <span className="font-medium text-[#cc3399]">Admin Panel</span>
                </button>
              </div>
            )}

            {/* Profile */}
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-md"
            >
              <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span>{tSettings('profile')}</span>
            </button>

            {/* Settings */}
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-md"
            >
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span>{tSettings('title')}</span>
            </button>
          </div>

          {/* Language & Notifications Section */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Language Switcher */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tCommon('language')}
              </label>
              <LanguageSwitcher />
            </div>

            {/* Notifications Toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tSettings('notifications')}
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {tCommon('browserNotifications')}
                </span>
                <NotificationToggle />
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span>{tAuth('signOut')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
