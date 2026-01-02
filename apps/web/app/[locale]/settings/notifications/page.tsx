'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getUserProfile, updateEmailNotifications } from '@/lib/user-preferences';
import notificationService from '@/lib/notifications';
import { Toggle } from '@/components/Toggle';

export default function NotificationSettingsPage() {
  const { user: authUser } = useAuth();
  const t = useTranslations('settings.notificationsPage');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Email notification settings
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Browser notification settings
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const loadUserProfile = useCallback(async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (profile?.emailNotifications) {
        setEmailEnabled(profile.emailNotifications.enabled ?? true);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [authUser, t]);

  useEffect(() => {
    loadUserProfile();
    checkBrowserNotifications();
  }, [authUser, loadUserProfile]);

  const checkBrowserNotifications = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setBrowserEnabled(
        Notification.permission === 'granted' && notificationService.isEnabled()
      );
    }
  };

  const handleEmailToggle = async () => {
    const newValue = !emailEnabled;
    setEmailEnabled(newValue);
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateEmailNotifications({
        enabled: newValue,
        onTranscriptionComplete: true,
        digest: 'immediate',
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving email settings:', err);
      setEmailEnabled(!newValue); // Revert on error
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleBrowserToggle = async () => {
    if (!browserEnabled) {
      const granted = await notificationService.requestPermission();
      if (granted) {
        notificationService.enable();
        setBrowserEnabled(true);
        setPermission('granted');
      } else {
        setError(t('browserPermissionDenied'));
      }
    } else {
      notificationService.disable();
      setBrowserEnabled(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8D6AFA]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="ml-3 text-sm font-medium text-green-800 dark:text-green-300">
              {t('saveSuccess')}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-sm font-medium text-red-800 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Notification Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          {/* Email Notifications Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <label className="block text-base font-medium text-gray-900 dark:text-gray-100">
                {t('emailNotifications')}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('enableEmailDescription')}
              </p>
            </div>
            <div className="sm:w-2/3">
              <Toggle
                checked={emailEnabled}
                onCheckedChange={handleEmailToggle}
                disabled={saving}
                aria-label={t('emailNotifications')}
              />
            </div>
          </div>

          {/* Browser Notifications Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <label className="block text-base font-medium text-gray-900 dark:text-gray-100">
                {t('browserNotifications')}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('enableBrowserDescription')}
              </p>
              {permission === 'denied' && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {t('browserPermissionBlocked')}
                </p>
              )}
            </div>
            <div className="sm:w-2/3">
              <Toggle
                checked={browserEnabled}
                onCheckedChange={handleBrowserToggle}
                disabled={permission === 'denied'}
                aria-label={t('browserNotifications')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
