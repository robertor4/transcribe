'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import { Globe, FileText, CheckCircle, AlertCircle, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { getUserProfile, updateUserLanguagePreference } from '@/lib/user-preferences';
import { useRouter } from '@/i18n/navigation';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import type { User } from '@transcribe/shared';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function PreferencesSettingsPage() {
  const { user: authUser } = useAuth();
  const t = useTranslations('settings.preferencesPage');
  const locale = useLocale();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  const [language, setLanguage] = useState(locale);
  const [defaultContext, setDefaultContext] = useState('');
  const [summaryLanguage, setSummaryLanguage] = useState('auto');

  useEffect(() => {
    loadUserProfile();
  }, [authUser]);

  const loadUserProfile = async () => {
    if (!authUser) return;
    
    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (profile) {
        setUserProfile(profile);
        setLanguage(profile.preferredLanguage || locale);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLanguage = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateUserLanguagePreference(language);
      
      // Navigate to the new locale
      router.push('/settings/preferences', { locale: language });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload profile to get updated data
      await loadUserProfile();
    } catch (err) {
      console.error('Error saving language:', err);
      setError(t('saveError'));
    } finally {
      setSaving(false);
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
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
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Theme Preferences */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Sun className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Theme</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color Scheme
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Choose your preferred color scheme for the interface
              </p>

              <div className="grid grid-cols-3 gap-4">
                {/* Light Theme */}
                <button
                  onClick={() => setTheme('light')}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${theme === 'light'
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }
                    hover:border-[#cc3399] hover:bg-pink-50 dark:hover:bg-pink-900/10
                  `}
                >
                  <Sun className="h-8 w-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Light
                  </div>
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${theme === 'dark'
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }
                    hover:border-[#cc3399] hover:bg-pink-50 dark:hover:bg-pink-900/10
                  `}
                >
                  <Moon className="h-8 w-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Dark
                  </div>
                </button>

                {/* System Theme */}
                <button
                  onClick={() => setTheme('system')}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${theme === 'system'
                      ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }
                    hover:border-[#cc3399] hover:bg-pink-50 dark:hover:bg-pink-900/10
                  `}
                >
                  <Monitor className="h-8 w-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    System
                  </div>
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {theme === 'system'
                  ? 'Theme will automatically match your system preferences'
                  : `Using ${theme} theme`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Language Preferences */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Globe className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('languageSettings')}</h3>
          </div>

          <div className="space-y-4">
            {/* UI Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('interfaceLanguage')}
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('interfaceLanguageDescription')}</p>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] sm:text-sm rounded-md"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Language */}
            <div>
              <label htmlFor="summary-language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('summaryLanguage')}
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('summaryLanguageDescription')}</p>
              <select
                id="summary-language"
                value={summaryLanguage}
                onChange={(e) => setSummaryLanguage(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] sm:text-sm rounded-md"
                disabled // For future implementation
              >
                <option value="auto">{t('autoDetect')}</option>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">{t('comingSoon')}</p>
            </div>
          </div>
        </div>

        {/* Save Button for Language */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
          <button
            onClick={handleSaveLanguage}
            disabled={saving || language === locale}
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

      {/* Transcription Defaults */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('transcriptionDefaults')}</h3>
          </div>

          <div className="space-y-4">
            {/* Default Context */}
            <div>
              <label htmlFor="default-context" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('defaultContext')}
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('defaultContextDescription')}</p>
              <textarea
                id="default-context"
                rows={3}
                value={defaultContext}
                onChange={(e) => setDefaultContext(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-sm focus:border-[#cc3399] focus:ring-[#cc3399] sm:text-sm"
                placeholder={t('defaultContextPlaceholder')}
                disabled // For future implementation
              />
              <p className="mt-1 text-xs text-gray-400">{t('comingSoon')}</p>
            </div>

            {/* Auto-delete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('autoDelete')}
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('autoDeleteDescription')}</p>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] sm:text-sm rounded-md"
                disabled // For future implementation
              >
                <option value="never">{t('never')}</option>
                <option value="30">{t('days', { count: 30 })}</option>
                <option value="60">{t('days', { count: 60 })}</option>
                <option value="90">{t('days', { count: 90 })}</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">{t('comingSoon')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}