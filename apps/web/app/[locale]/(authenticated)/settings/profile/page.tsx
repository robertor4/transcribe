'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
} from '@/lib/user-preferences';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import { SettingsSkeleton } from '@/components/skeletons/SettingsSkeleton';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase';
import {
  sendEmailVerification,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import type { User } from '@transcribe/shared';

export default function ProfileSettingsPage() {
  const { user: authUser, logout, refreshUser } = useAuth();
  const t = useTranslations('settings.profilePage');
  const tAccount = useTranslations('settings.accountPage');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Check auth providers
  const hasPasswordProvider = authUser?.providerData?.some(
    (provider) => provider?.providerId === 'password'
  );
  const hasGoogleProvider = authUser?.providerData?.some(
    (provider) => provider?.providerId === 'google.com'
  );

  const loadUserProfile = useCallback(async () => {
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
  }, [authUser, t]);

  useEffect(() => {
    loadUserProfile();
  }, [authUser, loadUserProfile]);

  const handleSave = async () => {
    if (!authUser) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      await updateUserProfile({
        displayName: displayName.trim() || undefined,
        photoURL: photoURL.trim() || undefined,
      });

      await refreshUser();
      setSuccess(t('saveSuccess'));
      setTimeout(() => setSuccess(null), 3000);
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
      setSuccess(t('verificationSent'));
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error sending verification:', err);
      setError(t('verificationError'));
    } finally {
      setSendingVerification(false);
    }
  };

  const handlePasswordChange = async () => {
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError(tAccount('passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(tAccount('passwordTooShort'));
      return;
    }

    if (!auth.currentUser) {
      setError(tAccount('notAuthenticated'));
      return;
    }

    setChangingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(
        authUser?.email || '',
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setSuccess(tAccount('passwordChangeSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error changing password:', err);
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/wrong-password') {
        setError(tAccount('incorrectPassword'));
      } else if (firebaseError.code === 'auth/requires-recent-login') {
        setError(tAccount('requiresRecentLogin'));
      } else {
        setError(tAccount('passwordChangeError'));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) {
      setError(tAccount('notAuthenticated'));
      return;
    }

    setError(null);
    setDeletingAccount(true);

    try {
      if (hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(
          authUser?.email || '',
          deletePassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      } else if (hasGoogleProvider) {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }

      await auth.currentUser.delete();
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/wrong-password') {
        setError(tAccount('incorrectPassword'));
      } else if (firebaseError.code === 'auth/requires-recent-login') {
        setError(tAccount('requiresRecentLogin'));
      } else {
        setError(tAccount('deleteAccountError'));
      }
    } finally {
      setDeletingAccount(false);
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
            {success}
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

      {/* Profile Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          {/* Profile Photo Row */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <Label className="text-base text-gray-900 dark:text-gray-100">
                {t('profilePhoto')}
              </Label>
            </div>
            <div className="sm:w-2/3">
              <ProfilePhotoUploader
                currentPhotoURL={photoURL}
                displayName={displayName}
                email={authUser?.email || undefined}
                authUser={authUser}
                onPhotoChange={async (newPhotoURL) => {
                  setPhotoURL(newPhotoURL);
                  // Save immediately when using Google photo
                  try {
                    await updateUserProfile({ photoURL: newPhotoURL });
                    await refreshUser();
                    setSuccess(t('saveSuccess'));
                    setTimeout(() => setSuccess(null), 3000);
                  } catch (err) {
                    console.error('Error saving photo:', err);
                    setError(t('saveError'));
                  }
                }}
                onUpload={async (file) => {
                  const newPhotoURL = await uploadProfilePhoto(file);
                  setPhotoURL(newPhotoURL);
                  await refreshUser();
                  await loadUserProfile();
                  setSuccess(t('saveSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                  return newPhotoURL;
                }}
                onDelete={async () => {
                  await deleteProfilePhoto();
                  setPhotoURL('');
                  await refreshUser();
                  await loadUserProfile();
                  setSuccess(t('saveSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                }}
              />
            </div>
          </div>

          {/* Display Name Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <Label
                htmlFor="displayName"
                className="text-base text-gray-900 dark:text-gray-100"
              >
                {t('displayName')}
              </Label>
            </div>
            <div className="sm:w-2/3">
              <Input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                className="rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Email Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <Label className="text-base text-gray-900 dark:text-gray-100">
                {t('email')}
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('emailHelp')}
              </p>
            </div>
            <div className="sm:w-2/3 flex items-center gap-3">
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {authUser?.email}
              </span>
              {authUser?.emailVerified ? (
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-3 w-3" />
                  {t('verified')}
                </Badge>
              ) : (
                <Badge
                  asChild
                  className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 cursor-pointer transition-colors"
                >
                  <button
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                  >
                    {sendingVerification ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {t('notVerified')}
                  </button>
                </Badge>
              )}
            </div>
          </div>

          {/* Account Created Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <Label className="text-base text-gray-900 dark:text-gray-100">
                {t('accountCreated')}
              </Label>
            </div>
            <div className="sm:w-2/3">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt).toLocaleDateString()
                  : '-'}
              </span>
            </div>
          </div>

          {/* Connected Accounts Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="sm:w-1/3">
              <Label className="text-base text-gray-900 dark:text-gray-100">
                {tAccount('connectedAccounts')}
              </Label>
            </div>
            <div className="sm:w-2/3 flex flex-wrap gap-2">
              {authUser?.providerData?.map((provider) => (
                <Badge
                  key={provider?.providerId}
                  variant="secondary"
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1"
                >
                  {provider?.providerId === 'password' &&
                    tAccount('emailPassword')}
                  {provider?.providerId === 'google.com' &&
                    tAccount('googleAccount')}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button
            variant="brand"
            onClick={handleSave}
            disabled={saving}
            icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {t('saveChanges')}
          </Button>
        </div>
      </div>

      {/* Security Section - Password Change (only for password provider) */}
      {hasPasswordProvider && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-6">
              {tAccount('changePassword')}
            </h3>

            <div className="space-y-4 max-w-md">
              {/* Current Password */}
              <div>
                <Label
                  htmlFor="current-password"
                  className="text-gray-700 dark:text-gray-300 mb-1"
                >
                  {tAccount('currentPassword')}
                </Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <Label
                  htmlFor="new-password"
                  className="text-gray-700 dark:text-gray-300 mb-1"
                >
                  {tAccount('newPassword')}
                </Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <Label
                  htmlFor="confirm-password"
                  className="text-gray-700 dark:text-gray-300 mb-1"
                >
                  {tAccount('confirmPassword')}
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                variant="brand"
                onClick={handlePasswordChange}
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                icon={changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                {tAccount('updatePassword')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone - Delete Account */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50">
        <div className="p-6">
          <h3 className="text-base font-medium text-red-600 dark:text-red-400 mb-2">
            {tAccount('dangerZone')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {tAccount('deleteAccountWarning')}
          </p>

          {!showDeleteConfirm ? (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              icon={<Trash2 className="h-4 w-4" />}
            >
              {tAccount('deleteAccount')}
            </Button>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {tAccount('deleteConfirmTitle')}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {tAccount('deleteConfirmMessage')}
                  </p>
                </div>
              </div>

              {hasPasswordProvider && (
                <div className="mb-4">
                  <Label
                    htmlFor="delete-password"
                    className="text-red-700 dark:text-red-400 mb-1"
                  >
                    {tAccount('enterPasswordToConfirm')}
                  </Label>
                  <div className="relative max-w-sm">
                    <Input
                      type={showDeletePassword ? 'text' : 'password'}
                      id="delete-password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="rounded-lg border-red-300 dark:border-red-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pr-10 focus-visible:ring-red-500/50 focus-visible:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showDeletePassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={
                    deletingAccount || (hasPasswordProvider && !deletePassword)
                  }
                  icon={deletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                >
                  {tAccount('confirmDelete')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                >
                  {tAccount('cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
