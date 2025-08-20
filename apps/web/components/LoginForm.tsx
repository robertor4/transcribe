'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { auth } from '@/lib/firebase';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestGoogle, setSuggestGoogle] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const tAuth = useTranslations('auth');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuggestGoogle(false);
    setShowPasswordReset(false);

    try {
      await signInWithEmail(email, password);
      trackEvent('login', {
        method: 'email',
        email: email
      });
      // Small delay to ensure auth state is fully propagated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Force reload to get latest email verification status
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const refreshedUser = auth.currentUser;
        
        if (refreshedUser.emailVerified === false) {
          router.push('/verify-email');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Fallback to dashboard if no current user (shouldn't happen)
        router.push('/dashboard');
      }
    } catch (error) {
      const errorObj = error as { message?: string; code?: string };
      const errorMessage = errorObj.message || 'Failed to sign in';
      const errorCode = errorObj.code || '';
      
      // Map Firebase errors to user-friendly messages
      // Note: Firebase v9+ uses different error codes depending on the version
      // 'auth/invalid-credential' is the new unified error
      // 'auth/invalid-login-credentials' is also used in some versions
      if (errorCode === 'auth/invalid-credential' || 
          errorCode === 'auth/user-not-found' || 
          errorCode === 'auth/wrong-password' || 
          errorCode === 'auth/invalid-login-credentials' ||
          errorMessage.includes('auth/invalid-credential') ||
          errorMessage.includes('INVALID_LOGIN_CREDENTIALS')) {
        // Check if this email exists with a different provider
        try {
          const { fetchSignInMethodsForEmail } = await import('firebase/auth');
          const signInMethods = await fetchSignInMethodsForEmail(auth, email);
          
          if (signInMethods.length === 0) {
            // No account exists with this email
            setError('No account found with this email. Please sign up first.');
            setSuggestGoogle(false);
          } else if (!signInMethods.includes('password')) {
            // User exists but with different provider (likely Google)
            if (signInMethods.includes('google.com')) {
              setError('This email is registered with Google sign-in. Please use the "Sign in with Google" button below.');
              setSuggestGoogle(true);
            } else {
              setError('This email is registered with a different sign-in method. Please use the appropriate sign-in option.');
            }
          } else {
            // Account exists with password, so password must be wrong
            setError('Incorrect password. Please try again or use the "Forgot password?" link below.');
            setSuggestGoogle(false);
            setShowPasswordReset(true);
          }
        } catch {
          setError(tAuth('invalidCredentials'));
        }
      } else if (errorCode === 'auth/too-many-requests') {
        setError(tAuth('tooManyRequests'));
      } else {
        setError(tAuth('invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      trackEvent('login', {
        method: 'google'
      });
      // Small delay to ensure auth state is fully propagated
      await new Promise(resolve => setTimeout(resolve, 200));
      router.push('/dashboard');
    } catch (error) {
      const errorObj = error as { message?: string };
      setError(errorObj.message || tAuth('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email" className="sr-only">
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
                className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] focus:z-10 sm:text-sm"
                placeholder={tAuth('email')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#cc3399] focus:border-[#cc3399] focus:z-10 sm:text-sm"
                placeholder={tAuth('password')}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link 
            href="/forgot-password"
            className={`text-sm transition-all ${
              showPasswordReset 
                ? 'text-[#cc3399] font-semibold animate-pulse hover:text-[#b82d89]' 
                : 'text-[#cc3399] hover:text-[#b82d89]'
            }`}
          >
            {tAuth('forgotPassword')}
          </Link>
          <Link 
            href="/signup"
            className="text-sm text-[#cc3399] hover:text-[#b82d89]"
          >
            {tAuth('dontHaveAccount')}
          </Link>
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
              tAuth('signIn')
            )}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">{tAuth('alreadyHaveAccount')}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex justify-center items-center px-4 py-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc3399] disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              suggestGoogle 
                ? 'border-[#cc3399] bg-pink-50 text-gray-900 hover:bg-pink-100 animate-pulse' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
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
            {tAuth('signInWithGoogle')}
          </button>
        </div>
      </form>
    </>
  );
}