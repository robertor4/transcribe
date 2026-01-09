'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function VerifyEmailPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);

  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const tAuth = useTranslations('auth');

  // Check verification status periodically
  useEffect(() => {
    // Don't redirect while still loading auth state
    if (loading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // If already verified, redirect to dashboard
    if (user.emailVerified) {
      router.push('/dashboard');
      return;
    }

    // Check verification status every 3 seconds
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          // Update the AuthContext state so dashboard sees verified status
          await refreshUser();
          setSuccess(true);
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, loading, router, refreshUser]);

  // Handle cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setCheckingVerification(true);

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, {
          url: `${window.location.origin}/dashboard`, // Redirect URL after verification
        });
        setResendCooldown(60); // 60 second cooldown
        console.log('Verification email resent successfully');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      const errorWithCode = error as { code?: string; message?: string };
      if (errorWithCode.code === 'auth/too-many-requests') {
        setError(tAuth('tooManyRequests'));
      } else {
        setError(tAuth('resendFailed') + ': ' + (errorWithCode.message || 'Unknown error'));
      }
    } finally {
      setCheckingVerification(false);
    }
  };

  // Show loading state only while auth is initializing
  // If not loading and no user, the useEffect will redirect to login
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D6AFA] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading completes, show nothing (useEffect will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo-wTagLine.png"
              alt="Neural Summary - You speak. It creates."
              className="h-16 w-auto"
            />
          </div>
          
          {success ? (
            <>
              <h2 className="text-center text-3xl font-extrabold text-gray-900 uppercase tracking-wide">
                {tAuth('emailVerified')}
              </h2>
              <div className="mt-6 flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                {tAuth('redirectingToDashboard')}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-center text-3xl font-extrabold text-gray-900 uppercase tracking-wide">
                {tAuth('verifyYourEmail')}
              </h2>
              <p className="mt-4 text-center text-sm text-gray-600">
                {tAuth('verificationEmailSent')} <strong>{user.email}</strong>
              </p>
              <p className="mt-2 text-center text-sm text-gray-600">
                {tAuth('checkYourInbox')}
              </p>
              <p className="mt-2 text-center text-xs text-gray-500">
                {tAuth('checkSpamFolder')}
              </p>
            </>
          )}
        </div>

        {!success && (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">{tAuth('checkYourEmail')}</p>
                  <p>{tAuth('clickVerificationLink')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {tAuth('didntReceiveEmail')}{' '}
                  <button
                    onClick={handleResendEmail}
                    disabled={resendCooldown > 0 || checkingVerification}
                    className="font-medium text-[#8D6AFA] hover:text-[#7A5AE0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 
                      ? `${tAuth('resendIn')} ${resendCooldown}s`
                      : tAuth('resendEmail')
                    }
                  </button>
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {tAuth('backToLogin')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}