'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AmbientGradient } from '@/components/landing/shared/AmbientGradient';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);

  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isResent = searchParams.get('resent') === 'true';
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
  if (loading) {
    return (
      <div className="dark relative min-h-screen flex items-center justify-center bg-[#22184C]">
        <AmbientGradient />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D6AFA] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading completes, show nothing (useEffect will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="dark relative min-h-screen flex items-center justify-center bg-[#22184C] py-12 px-4 sm:px-6 lg:px-8">
      <AmbientGradient />

      <div className="relative z-10 max-w-md w-full">
        <div className="mb-8">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/neural-summary-logo-white-wTagLine.svg"
              alt="Neural Summary - Create with your voice."
              className="h-16 w-auto"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.1] bg-white/[0.06] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-900/30 border border-green-700/30">
                <CheckCircle className="h-7 w-7 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {tAuth('emailVerified')}
              </h2>
              <p className="text-sm text-gray-400">
                {tAuth('redirectingToDashboard')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-[#8D6AFA]/10 border border-[#8D6AFA]/20 mb-4">
                  <Mail className="h-7 w-7 text-[#8D6AFA]" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {tAuth('verifyYourEmail')}
                </h2>
                {isResent && (
                  <div className="mt-3 bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                    <p className="text-sm text-green-300 font-medium">
                      {tAuth('welcomeBackVerification')}
                    </p>
                  </div>
                )}
                <p className="mt-3 text-sm text-gray-400">
                  {tAuth('verificationEmailSent')} <strong className="text-gray-200">{user.email}</strong>
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {tAuth('checkYourInbox')}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {tAuth('checkSpamFolder')}
                </p>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                <div className="flex items-start">
                  <Mail className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-0.5">{tAuth('checkYourEmail')}</p>
                    <p className="text-blue-400">{tAuth('clickVerificationLink')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-400">
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

                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="text-sm text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]"
                >
                  {tAuth('backToLogin')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
