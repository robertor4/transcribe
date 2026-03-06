'use client';

import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';
import { useTranslations } from 'next-intl';
import { LogOut, Settings, User as UserIcon, ChevronDown, Shield, Sun, Moon, Monitor, GraduationCap } from 'lucide-react';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { UsageIndicator } from '@/components/paywall/UsageIndicator';
import { UserAvatar } from '@/components/UserAvatar';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

interface UserProfileMenuProps {
  collapsed?: boolean;
}

export function UserProfileMenu({ collapsed = false }: UserProfileMenuProps) {
  const { user, logout } = useAuth();
  const { usageStats, isAdmin, profilePhotoUrl } = useUsage();
  const { restartOnboarding } = useOnboarding();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const tAuth = useTranslations('auth');
  const tSettings = useTranslations('settings');
  const tOnboarding = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const tUsage = useTranslations('usage');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSettingsClick = () => {
    router.push('/settings/preferences');
  };

  const handleProfileClick = () => {
    router.push('/settings/profile');
  };

  const handleAdminPanelClick = () => {
    router.push('/admin');
  };

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`group flex items-center transition-colors focus:outline-none ${
            collapsed
              ? 'p-1 rounded-full hover:bg-white/10'
              : 'w-full justify-between px-3 py-2 rounded-lg hover:bg-white/10'
          }`}
          aria-label={tCommon('userMenu')}
        >
          <UserAvatar
            size={collapsed ? 'sm' : 'md'}
            freshPhotoUrl={profilePhotoUrl}
            borderClass="border-white/20"
          />

          {!collapsed && (
            <>
              <span className="text-sm font-medium text-white dark:text-gray-100 truncate ml-2 flex-1 text-left">
                {user.displayName || user.email}
              </span>
              <ChevronDown
                className="h-4 w-4 text-white/70 transition-transform flex-shrink-0 group-data-[state=open]:rotate-180"
              />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-72"
      >
        {/* User Info Section */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              size="md"
              freshPhotoUrl={profilePhotoUrl}
            />
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
        {!isAdmin && usageStats && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {tUsage('yourUsage')} ({usageStats.tier})
                  {usageStats.subscriptionStatus === 'trialing' && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                      {tUsage('trial')}
                    </span>
                  )}
                </span>
              </div>

              {usageStats.tier === 'free' && (
                <>
                  <UsageIndicator
                    current={usageStats.usage.transcriptions}
                    limit={usageStats.limits.transcriptions}
                    unit=""
                    label={tUsage('transcriptions')}
                    percentUsed={usageStats.percentUsed}
                    showWarning={false}
                    showDecimals={false}
                  />
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
                    showDecimals={false}
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

              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {tUsage('resetsOn')} {new Date(usageStats.resetDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }).replace(/ /g, '-')}
              </p>

              {usageStats.tier === 'free' && (
                <button
                  onClick={handleUpgradeClick}
                  className="mt-3 w-full px-3 py-1.5 bg-[#8D6AFA] text-white text-xs font-medium rounded-md hover:bg-[#7A5AE0] transition-colors"
                >
                  {tUsage('upgradePlan')}
                </button>
              )}
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Theme Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 px-4 py-2 cursor-pointer">
            {getThemeIcon()}
            <span>{tCommon('theme')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
              <DropdownMenuRadioItem value="light" className="gap-2 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                <Sun className="h-4 w-4" />
                {tCommon('themeLight')}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="gap-2 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                <Moon className="h-4 w-4" />
                {tCommon('themeDark')}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className="gap-2 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                <Monitor className="h-4 w-4" />
                {tCommon('themeSystem')}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Admin Panel (only for admins) */}
        {isAdmin && (
          <>
            <DropdownMenuItem onSelect={handleAdminPanelClick} className="gap-3 px-4 py-2 cursor-pointer">
              <Shield className="h-5 w-5 text-[#8D6AFA]" />
              <span className="font-medium text-[#8D6AFA]">Admin Panel</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Profile */}
        <DropdownMenuItem onSelect={handleProfileClick} className="gap-3 px-4 py-2 cursor-pointer">
          <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span>{tSettings('profile')}</span>
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem onSelect={handleSettingsClick} className="gap-3 px-4 py-2 cursor-pointer">
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span>{tSettings('title')}</span>
        </DropdownMenuItem>

        {/* Tutorial */}
        <DropdownMenuItem onSelect={restartOnboarding} className="gap-3 px-4 py-2 cursor-pointer">
          <GraduationCap className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span>{tOnboarding('tutorial')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onSelect={handleLogout} className="gap-3 px-4 py-2 cursor-pointer">
          <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span>{tAuth('signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
