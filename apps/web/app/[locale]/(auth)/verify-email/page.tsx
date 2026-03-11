'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase';
import { getApiUrl } from '@/lib/config';
import { transcriptionApi } from '@/lib/api';
import { getPendingImport, clearPendingImport } from '@/lib/pendingImport';
import { AmbientGradient } from '@/components/landing/shared/AmbientGradient';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const CODE_LENGTH = 6;

export default function VerifyEmailPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isResent = searchParams.get('resent') === 'true';
  const tAuth = useTranslations('auth');

  // Redirect logic
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Handle cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!loading && user && !user.emailVerified) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [loading, user]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return {};
    const token = await currentUser.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fillCode = (digits: string) => {
    const newCode = [...code];
    for (let i = 0; i < CODE_LENGTH; i++) {
      newCode[i] = digits[i] || '';
    }
    setCode(newCode);
    const focusIndex = Math.min(digits.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
    if (digits.length === CODE_LENGTH) {
      handleVerify(newCode.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (digits.length > 0) {
      fillCode(digits);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Multi-char input (e.g. autofill)
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
      if (digits.length > 0) {
        fillCode(digits);
        return;
      }
    }

    // Single character input
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when last digit entered
    if (digit && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join('');
      if (fullCode.length === CODE_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (isVerifying) return;
    setError('');
    setIsVerifying(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/auth/verify-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: verificationCode }),
      });

      if (res.ok) {
        // Force refresh the Firebase Auth token to sync emailVerified status
        await refreshUser();
        setSuccess(true);

        // Check for pending import (user signed up from a share page)
        const pendingImport = getPendingImport();
        if (pendingImport) {
          try {
            const result = await transcriptionApi.copyFromShare(pendingImport.shareToken);
            clearPendingImport();
            const newId = result.data?.transcriptionId;
            setTimeout(() => {
              router.push(newId ? `/conversation/${newId}` : '/dashboard');
            }, 2000);
            return;
          } catch (importError) {
            console.error('Failed to auto-import after verification:', importError);
            clearPendingImport();
          }
        }

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const data = await res.json();
        if (res.status === 429) {
          setError(tAuth('tooManyRequests'));
        } else {
          setError(data.message || tAuth('invalidVerificationCode'));
        }
        // Clear code and refocus first input
        setCode(Array(CODE_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError(tAuth('verificationFailed'));
      setCode(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/auth/resend-verification`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        setResendCooldown(60);
        setCodeSent(true);
        setCode(Array(CODE_LENGTH).fill(''));
        setTimeout(() => {
          setCodeSent(false);
          inputRefs.current[0]?.focus();
        }, 3000);
      } else if (res.status === 429) {
        setError(tAuth('tooManyRequests'));
      } else {
        setError(tAuth('resendFailed'));
      }
    } catch {
      setError(tAuth('resendFailed'));
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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-900/30 border border-green-700/30">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {tAuth('emailVerified')}
              </h2>
              <p className="text-sm text-gray-300">
                Welcome to Neural Summary
              </p>
              <p className="text-xs text-gray-500">
                {tAuth('redirectingToDashboard')}
              </p>
              <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'linear' }}
                  className="h-full bg-green-400 rounded-full"
                />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-[#8D6AFA]/10 border border-[#8D6AFA]/20 mb-4">
                  <Mail className="h-7 w-7 text-[#8D6AFA]" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {tAuth('enterVerificationCode')}
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
              </div>

              {/* Code sent success indicator */}
              {codeSent && (
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-300 font-medium flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {tAuth('codeSent')}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* 6-digit code input */}
              <div className="flex justify-center gap-2 sm:gap-3">
                {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={code[index]}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isVerifying}
                    className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold text-white bg-white/[0.08] border border-white/[0.15] rounded-lg focus:outline-none focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/30 transition-colors disabled:opacity-50"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {isVerifying && (
                <p className="text-sm text-gray-400 text-center animate-pulse">
                  {tAuth('verifyingCode')}
                </p>
              )}

              <div className="space-y-2 text-center">
                <p className="text-sm text-gray-400">
                  {tAuth('didntReceiveEmail')}{' '}
                  <button
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className="font-medium text-[#8D6AFA] hover:text-[#7A5AE0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0
                      ? `${tAuth('resendIn')} ${resendCooldown}s`
                      : tAuth('resendEmail')
                    }
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  {tAuth('checkSpamFolder')}
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
