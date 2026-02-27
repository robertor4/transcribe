'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import { CheckCircle, AlertCircle, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { getUserProfile, updateUserLanguagePreference } from '@/lib/user-preferences';
import { SettingsSkeleton } from '@/components/skeletons/SettingsSkeleton';
import { useRouter } from '@/i18n/navigation';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const [language, setLanguage] = useState(locale);

  const loadUserProfile = useCallback(async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (profile) {
        setLanguage(profile.preferredLanguage || locale);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [authUser, locale, t]);

  useEffect(() => {
    loadUserProfile();
  }, [authUser, loadUserProfile]);

  const handleSaveLanguage = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateUserLanguagePreference(language);
      router.push('/settings/preferences', { locale: language });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadUserProfile();
    } catch (err) {
      console.error('Error saving language:', err);
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/30 p-4" role="alert">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {t('saveSuccess')}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-900/30 p-4" role="alert">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Theme Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <Label className="text-base text-gray-900 dark:text-gray-100">
                Theme
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose your preferred color scheme
              </p>
            </div>
            <div className="sm:w-2/3">
              <div className="grid grid-cols-3 gap-3">
                {/* Light Theme */}
                <button
                  onClick={() => setTheme('light')}
                  className={`
                    p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                    ${
                      theme === 'light'
                        ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Light
                  </span>
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`
                    p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                    ${
                      theme === 'dark'
                        ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Dark
                  </span>
                </button>

                {/* System Theme */}
                <button
                  onClick={() => setTheme('system')}
                  className={`
                    p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                    ${
                      theme === 'system'
                        ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <Monitor className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    System
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Language Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <Label className="text-base text-gray-900 dark:text-gray-100">
                {t('interfaceLanguage')}
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('interfaceLanguageDescription')}
              </p>
            </div>
            <div className="sm:w-2/3">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full max-w-xs rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button
            variant="brand"
            onClick={handleSaveLanguage}
            disabled={saving || language === locale}
            icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {t('saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
