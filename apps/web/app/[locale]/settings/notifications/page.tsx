'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { Bell, Mail, Monitor, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getUserProfile, updateEmailNotifications } from '@/lib/user-preferences';
import notificationService from '@/lib/notifications';
import type { User } from '@transcribe/shared';

export default function NotificationSettingsPage() {
  const { user: authUser } = useAuth();
  const t = useTranslations('settings.notificationsPage');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  
  // Email notification settings
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [onTranscriptionComplete, setOnTranscriptionComplete] = useState(true);
  const [digest, setDigest] = useState<'immediate' | 'daily' | 'weekly'>('immediate');
  
  // Browser notification settings
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadUserProfile();
    checkBrowserNotifications();
  }, [authUser]);

  const loadUserProfile = async () => {
    if (!authUser) return;
    
    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (profile) {
        setUserProfile(profile);
        
        // Set email notification preferences
        if (profile.emailNotifications) {
          setEmailEnabled(profile.emailNotifications.enabled ?? true);
          setOnTranscriptionComplete(profile.emailNotifications.onTranscriptionComplete ?? true);
          setDigest(profile.emailNotifications.digest || 'immediate');
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const checkBrowserNotifications = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setBrowserEnabled(
        Notification.permission === 'granted' && 
        notificationService.isEnabled()
      );
    }
  };

  const handleSaveEmailSettings = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateEmailNotifications({
        enabled: emailEnabled,
        onTranscriptionComplete,
        digest,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload profile to get updated data
      await loadUserProfile();
    } catch (err) {
      console.error('Error saving email settings:', err);
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleBrowserToggle = async () => {
    if (!browserEnabled) {
      // Enable browser notifications
      const granted = await notificationService.requestPermission();
      if (granted) {
        notificationService.enable();
        setBrowserEnabled(true);
        setPermission('granted');
      } else {
        setError(t('browserPermissionDenied'));
      }
    } else {
      // Disable browser notifications
      notificationService.disable();
      setBrowserEnabled(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc3399]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('description')}
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {t('saveSuccess')}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Email Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{t('emailNotifications')}</h3>
          </div>

          <div className="space-y-4">
            {/* Master email toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-enabled" className="text-sm font-medium text-gray-700">
                  {t('enableEmailNotifications')}
                </label>
                <p className="text-sm text-gray-500">{t('enableEmailDescription')}</p>
              </div>
              <button
                id="email-enabled"
                type="button"
                onClick={() => setEmailEnabled(!emailEnabled)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2
                  ${emailEnabled ? 'bg-[#cc3399]' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${emailEnabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Individual email settings */}
            {emailEnabled && (
              <>
                <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-6">
                  {/* Transcription complete */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="transcription-complete" className="text-sm font-medium text-gray-700">
                        {t('transcriptionComplete')}
                      </label>
                      <p className="text-sm text-gray-500">{t('transcriptionCompleteDescription')}</p>
                    </div>
                    <button
                      id="transcription-complete"
                      type="button"
                      onClick={() => setOnTranscriptionComplete(!onTranscriptionComplete)}
                      className={`
                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2
                        ${onTranscriptionComplete ? 'bg-[#cc3399]' : 'bg-gray-200'}
                      `}
                    >
                      <span
                        className={`
                          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                          transition duration-200 ease-in-out
                          ${onTranscriptionComplete ? 'translate-x-5' : 'translate-x-0'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Email digest frequency */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t('digestFrequency')}
                    </label>
                    <p className="text-sm text-gray-500 mb-2">{t('digestDescription')}</p>
                    <div className="flex space-x-4">
                      {(['immediate', 'daily', 'weekly'] as const).map((freq) => (
                        <label key={freq} className="flex items-center">
                          <input
                            type="radio"
                            name="digest"
                            value={freq}
                            checked={digest === freq}
                            onChange={(e) => setDigest(e.target.value as typeof digest)}
                            className="h-4 w-4 text-[#cc3399] focus:ring-[#cc3399] border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {t(`digest.${freq}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save Button for Email Settings */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            onClick={handleSaveEmailSettings}
            disabled={saving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#cc3399] hover:bg-[#b82d89] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('saveChanges')
            )}
          </button>
        </div>
      </div>

      {/* Browser Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Monitor className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{t('browserNotifications')}</h3>
          </div>

          <div className="space-y-4">
            {/* Browser notification toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="browser-enabled" className="text-sm font-medium text-gray-700">
                  {t('enableBrowserNotifications')}
                </label>
                <p className="text-sm text-gray-500">{t('enableBrowserDescription')}</p>
                {permission === 'denied' && (
                  <p className="text-sm text-red-600 mt-1">
                    {t('browserPermissionBlocked')}
                  </p>
                )}
              </div>
              <button
                id="browser-enabled"
                type="button"
                onClick={handleBrowserToggle}
                disabled={permission === 'denied'}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2
                  ${browserEnabled ? 'bg-[#cc3399]' : 'bg-gray-200'}
                  ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${browserEnabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Notification types info */}
            {browserEnabled && (
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-6">
                <p className="text-sm text-gray-600">{t('browserNotificationTypes')}</p>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>{t('notificationType.transcriptionComplete')}</li>
                  <li>{t('notificationType.transcriptionFailed')}</li>
                  <li>{t('notificationType.transcriptionProgress')}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}