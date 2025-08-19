'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { Mail, Lock, User, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const tAuth = useTranslations('auth');

  // Password strength validation
  const passwordRequirements = [
    { met: password.length >= 8, text: tAuth('passwordMinLength') },
    { met: /[A-Z]/.test(password), text: tAuth('passwordUppercase') },
    { met: /[a-z]/.test(password), text: tAuth('passwordLowercase') },
    { met: /\d/.test(password), text: tAuth('passwordNumber') },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.met);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!displayName.trim()) {
      setError(tAuth('displayNameRequired'));
      return;
    }

    if (!isPasswordValid) {
      setError(tAuth('passwordRequirementsNotMet'));
      return;
    }

    if (password !== confirmPassword) {
      setError(tAuth('passwordsDoNotMatch'));
      return;
    }

    if (!acceptTerms) {
      setError(tAuth('acceptTermsRequired'));
      return;
    }

    setLoading(true);

    try {
      // Track signup started
      trackEvent('signup_started', {
        method: 'email'
      });
      
      // Create the user account
      await signUpWithEmail(email, password, displayName);
      
      // Track signup completed
      trackEvent('signup_completed', {
        method: 'email',
        email: email
      });
      
      // Send verification email
      if (auth.currentUser) {
        try {
          await sendEmailVerification(auth.currentUser, {
            url: `${window.location.origin}/dashboard`, // Redirect URL after verification
          });
          console.log('Verification email sent successfully');
        } catch (emailError: any) {
          console.error('Error sending verification email:', emailError);
          // Still redirect to verification page even if email fails
          // User can resend from there
        }
      }
      
      // Redirect to verification page
      router.push('/verify-email');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign up';
      
      if (errorMessage.includes('email-already-in-use')) {
        setError(tAuth('emailAlreadyInUse'));
      } else if (errorMessage.includes('invalid-email')) {
        setError(tAuth('invalidEmail'));
      } else if (errorMessage.includes('weak-password')) {
        setError(tAuth('weakPassword'));
      } else {
        setError(tAuth('signupFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      trackEvent('signup_completed', {
        method: 'google'
      });
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || tAuth('signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="mt-8 space-y-6" onSubmit={handleEmailSignup}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Display Name Field */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              {tAuth('displayName')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] focus:z-10 sm:text-sm"
                placeholder={tAuth('enterYourName')}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {tAuth('email')}
            </label>
            <div className="relative">
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
                className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] focus:z-10 sm:text-sm"
                placeholder={tAuth('enterYourEmail')}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {tAuth('password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] focus:z-10 sm:text-sm"
                placeholder={tAuth('createPassword')}
              />
            </div>
            
            {/* Password Requirements */}
            {password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center text-xs">
                    {req.met ? (
                      <Check className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <X className="h-3 w-3 text-gray-400 mr-1" />
                    )}
                    <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              {tAuth('confirmPassword')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] focus:z-10 sm:text-sm"
                placeholder={tAuth('confirmYourPassword')}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{tAuth('passwordsDoNotMatch')}</p>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="h-4 w-4 text-[#cc3399] focus:ring-[#cc3399] border-gray-300 rounded mt-0.5"
          />
          <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-600">
            {tAuth('iAgreeToThe')}{' '}
            <Link href="/terms" className="text-[#cc3399] hover:text-[#b82d89]">
              {tAuth('termsOfService')}
            </Link>{' '}
            {tAuth('and')}{' '}
            <Link href="/privacy" className="text-[#cc3399] hover:text-[#b82d89]">
              {tAuth('privacyPolicy')}
            </Link>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || !acceptTerms}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#cc3399] hover:bg-[#b82d89] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              tAuth('createAccount')
            )}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">{tAuth('orContinueWith')}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {tAuth('signUpWithGoogle')}
          </button>
        </div>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            {tAuth('alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-medium text-[#cc3399] hover:text-[#b82d89]">
              {tAuth('signIn')}
            </Link>
          </span>
        </div>
      </form>
    </>
  );
}