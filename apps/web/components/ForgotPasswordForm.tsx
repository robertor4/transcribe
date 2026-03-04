'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { sendPasswordResetEmail } = useAuth();
  const tAuth = useTranslations('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(email);
      setEmailSent(true);
    } catch (error) {
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message || 'Failed to send reset email';

      if (errorMessage.includes('user-not-found')) {
        setError(tAuth('userNotFound'));
      } else if (errorMessage.includes('invalid-email')) {
        setError(tAuth('invalidEmail'));
      } else if (errorMessage.includes('too-many-requests')) {
        setError(tAuth('tooManyRequests'));
      } else {
        setError(tAuth('resetEmailFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-900/30 border border-green-700/30">
            <CheckCircle className="h-7 w-7 text-green-400" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-white">
            {tAuth('resetLinkSent')}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {tAuth('checkEmailForReset')}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-200">
            {email}
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
          <p className="text-sm text-blue-300">
            {tAuth('checkSpamFolder')}
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
            className="text-sm text-[#8D6AFA] hover:text-[#7A5AE0]"
          >
            {tAuth('tryDifferentEmail')}
          </button>
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tAuth('backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">
          {tAuth('resetPassword')}
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          {tAuth('enterEmailForReset')}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">
            {tAuth('email')}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tAuth('enterYourEmail')}
            className="h-11 bg-white/[0.08] border-white/[0.12] text-gray-100 placeholder:text-gray-500 focus-visible:border-[#8D6AFA] focus-visible:ring-[#8D6AFA]/30"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white font-medium rounded-lg"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            tAuth('sendResetLink')
          )}
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tAuth('backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}
