'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { Camera, Mail, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '@/lib/user-preferences';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import type { User } from '@transcribe/shared';

export default function ProfileSettingsPage() {
  const { user: authUser } = useAuth();
  const t = useTranslations('settings.profilePage');
  const tCommon = useTranslations('common');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);

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
        setDisplayName(profile.displayName || '');
        setPhotoURL(profile.photoURL || '');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!authUser) return;
    
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateUserProfile({
        displayName: displayName.trim() || undefined,
        photoURL: photoURL.trim() || undefined,
      });

      // Note: Firebase Auth v9+ doesn't have updateProfile on the user object
      // Profile updates are handled through the backend API which updates Firestore

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload profile to get updated data
      await loadUserProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser || auth.currentUser.emailVerified) return;
    
    setSendingVerification(true);
    setError(null);
    
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error sending verification:', err);
      setError(t('verificationError'));
    } finally {
      setSendingVerification(false);
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
        <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                {t('saveSuccess')}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profilePhoto')}
            </label>
            <div className="mt-2 flex items-center space-x-4">
              <div className="relative">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder={t('photoURLPlaceholder')}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#cc3399] focus:ring-[#cc3399] sm:text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('photoURLHelp')}</p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('displayName')}
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#cc3399] focus:ring-[#cc3399] sm:text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('email')}
            </label>
            <div className="mt-1 flex items-center">
              <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{authUser?.email}</span>
              {authUser?.emailVerified ? (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('verified')}
                </span>
              ) : (
                <button
                  onClick={handleResendVerification}
                  disabled={sendingVerification}
                  className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors"
                >
                  {sendingVerification ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {t('notVerified')}
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('emailHelp')}</p>
          </div>

          {/* Account Created */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('accountCreated')}
            </label>
            <div className="mt-1 flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt).toLocaleDateString()
                  : '-'
                }
              </span>
            </div>
          </div>

          {/* Subscription Status */}
          {userProfile?.subscription && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('subscription')}
              </label>
              <div className="mt-1">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 capitalize">
                  {userProfile.subscription.type}
                </span>
                {userProfile.subscription.expiresAt && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('expiresOn')} {new Date(userProfile.subscription.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 text-right sm:px-6">
          <button
            onClick={handleSave}
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
    </div>
  );
}