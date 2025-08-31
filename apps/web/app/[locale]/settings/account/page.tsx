'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { 
  Shield, 
  Key, 
  Trash2, 
  Download,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogIn
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { 
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export default function AccountSettingsPage() {
  const { user: authUser, logout } = useAuth();
  const t = useTranslations('settings.accountPage');
  const router = useRouter();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Check if user has password provider
  const hasPasswordProvider = authUser?.providerData?.some(
    provider => provider?.providerId === 'password'
  );
  
  const hasGoogleProvider = authUser?.providerData?.some(
    provider => provider?.providerId === 'google.com'
  );

  const handlePasswordChange = async () => {
    setError(null);
    setSuccess(false);
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    
    if (newPassword.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    
    if (!auth.currentUser) {
      setError(t('notAuthenticated'));
      return;
    }
    
    setChangingPassword(true);
    
    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        authUser?.email || '',
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        setError(t('incorrectPassword'));
      } else if (err.code === 'auth/requires-recent-login') {
        setError(t('requiresRecentLogin'));
      } else {
        setError(t('passwordChangeError'));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) {
      setError(t('notAuthenticated'));
      return;
    }
    
    setError(null);
    setDeletingAccount(true);
    
    try {
      // Re-authenticate user first
      if (hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(
          authUser?.email || '',
          deletePassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      } else if (hasGoogleProvider) {
        // Re-authenticate with Google
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
      
      // Delete user account
      await auth.currentUser.delete();
      
      // Logout and redirect
      await logout();
      router.push('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      if (err.code === 'auth/wrong-password') {
        setError(t('incorrectPassword'));
      } else if (err.code === 'auth/requires-recent-login') {
        setError(t('requiresRecentLogin'));
      } else {
        setError(t('deleteAccountError'));
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleExportData = async () => {
    // For future implementation
    setError(t('exportComingSoon'));
  };

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
                {t('passwordChangeSuccess')}
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

      {/* Security Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{t('security')}</h3>
          </div>

          {/* Connected Accounts */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('connectedAccounts')}</h4>
            <div className="space-y-2">
              {authUser?.providerData?.map((provider) => (
                <div key={provider?.providerId} className="flex items-center text-sm text-gray-600">
                  <LogIn className="h-4 w-4 mr-2 text-gray-400" />
                  {provider?.providerId === 'password' && t('emailPassword')}
                  {provider?.providerId === 'google.com' && t('googleAccount')}
                </div>
              ))}
            </div>
          </div>

          {/* Change Password (only for password provider) */}
          {hasPasswordProvider && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <Key className="h-4 w-4 mr-2 text-gray-400" />
                {t('changePassword')}
              </h4>
              
              <div className="space-y-3 ml-6">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                    {t('currentPassword')}
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#cc3399] focus:ring-[#cc3399] sm:text-sm text-gray-800 placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    {t('newPassword')}
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#cc3399] focus:ring-[#cc3399] sm:text-sm text-gray-800 placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#cc3399] focus:ring-[#cc3399] sm:text-sm text-gray-800 placeholder:text-gray-500"
                  />
                </div>
                
                <button
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#cc3399] hover:bg-[#b82d89] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('changingPassword')}
                    </>
                  ) : (
                    t('updatePassword')
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dataManagement')}</h3>
          
          {/* Export Data */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('exportData')}</h4>
            <p className="text-sm text-gray-500 mb-3">{t('exportDataDescription')}</p>
            <button
              onClick={handleExportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399]"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('downloadData')}
            </button>
          </div>
          
          {/* Delete Account */}
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2">{t('dangerZone')}</h4>
            <p className="text-sm text-gray-500 mb-3">{t('deleteAccountWarning')}</p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('deleteAccount')}
              </button>
            ) : (
              <div className="border border-red-300 rounded-md p-4 bg-red-50">
                <div className="flex items-start mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {t('deleteConfirmTitle')}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {t('deleteConfirmMessage')}
                    </p>
                  </div>
                </div>
                
                {hasPasswordProvider && (
                  <div className="mb-3">
                    <label htmlFor="delete-password" className="block text-sm font-medium text-red-700">
                      {t('enterPasswordToConfirm')}
                    </label>
                    <input
                      type="password"
                      id="delete-password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-800 placeholder:text-gray-500"
                    />
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount || (hasPasswordProvider && !deletePassword)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('deletingAccount')}
                      </>
                    ) : (
                      t('confirmDelete')
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}