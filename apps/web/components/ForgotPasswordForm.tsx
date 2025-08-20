'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { sendPasswordResetEmail } = useAuth();
  // const router = useRouter();
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
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {tAuth('resetLinkSent')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {tAuth('checkEmailForReset')}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {email}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            {tAuth('checkSpamFolder')}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
            className="text-sm text-[#cc3399] hover:text-[#b82d89]"
          >
            {tAuth('tryDifferentEmail')}
          </button>
          <Link 
            href="/login"
            className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tAuth('backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          {tAuth('resetPassword')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {tAuth('enterEmailForReset')}
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {tAuth('email')}
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-10 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] sm:text-sm"
              placeholder={tAuth('enterYourEmail')}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#cc3399] hover:bg-[#b82d89] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              tAuth('sendResetLink')
            )}
          </button>
        </div>

        <div className="text-center">
          <Link 
            href="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tAuth('backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}