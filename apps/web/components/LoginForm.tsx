'use client';

import { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { auth } from '@/lib/firebase';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getPendingImport, clearPendingImport } from '@/lib/pendingImport';
import { importedConversationApi } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestGoogle, setSuggestGoogle] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileInstance>(null);

  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackEvent } = useAnalytics();
  const tAuth = useTranslations('auth');
  const isSuspended = searchParams.get('suspended') === 'true';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestGoogle(false);
    setShowPasswordReset(false);

    if (!turnstileToken) {
      setError(tAuth('captchaRequired'));
      return;
    }

    setLoading(true);

    try {
      // Verify Turnstile token server-side before signing in
      const verifyResponse = await fetch(`${getApiUrl()}/auth/verify-turnstile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });

      if (!verifyResponse.ok) {
        setError(tAuth('captchaFailed'));
        turnstileRef.current?.reset();
        setTurnstileToken('');
        setLoading(false);
        return;
      }

      await signInWithEmail(email, password);
      trackEvent('login', {
        method: 'email',
        email: email
      });
      // Small delay to ensure auth state is fully propagated
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check if account is suspended before proceeding
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const profileResponse = await fetch(`${getApiUrl()}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileResponse.status === 401) {
          const data = await profileResponse.json().catch(() => null);
          if (data?.message?.includes('suspended')) {
            await auth.signOut();
            setError(tAuth('accountSuspended'));
            setLoading(false);
            return;
          }
        }
      }

      // Force reload to get latest email verification status
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const refreshedUser = auth.currentUser;

        if (refreshedUser.emailVerified === false) {
          router.push('/verify-email');
        } else {
          // Check for pending import
          const pendingImport = getPendingImport();
          if (pendingImport) {
            try {
              await importedConversationApi.import(pendingImport.shareToken);
              clearPendingImport();
              router.push('/shared-with-me');
              return;
            } catch (importError) {
              console.error('Failed to auto-import conversation:', importError);
              clearPendingImport();
            }
          }
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

      // Check if account is suspended before proceeding
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const profileResponse = await fetch(`${getApiUrl()}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileResponse.status === 401) {
          const data = await profileResponse.json().catch(() => null);
          if (data?.message?.includes('suspended')) {
            await auth.signOut();
            setError(tAuth('accountSuspended'));
            setLoading(false);
            return;
          }
        }
      }

      // Check for pending import
      const pendingImport = getPendingImport();
      if (pendingImport) {
        try {
          await importedConversationApi.import(pendingImport.shareToken);
          clearPendingImport();
          router.push('/shared-with-me');
          return;
        } catch (importError) {
          console.error('Failed to auto-import conversation:', importError);
          clearPendingImport();
        }
      }
      router.push('/dashboard');
    } catch (error) {
      const errorObj = error as { message?: string };
      setError(errorObj.message || tAuth('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleEmailLogin}>
      {isSuspended && (
        <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-orange-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-orange-300">
              {tAuth('accountSuspended')}
            </p>
          </div>
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

      <div className="space-y-4">
        {/* Email */}
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
            className="h-11 bg-white/[0.08] border-white/[0.12] text-gray-100 placeholder:text-gray-500 focus-visible:border-[#8D6AFA] focus-visible:ring-[#8D6AFA]/30"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300">
            {tAuth('password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10 bg-white/[0.08] border-white/[0.12] text-gray-100 placeholder:text-gray-500 focus-visible:border-[#8D6AFA] focus-visible:ring-[#8D6AFA]/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label={showPassword ? tAuth('hidePassword') : tAuth('showPassword')}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500 hover:text-gray-300" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500 hover:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/forgot-password"
          className={`text-sm transition-all ${
            showPasswordReset
              ? 'text-[#8D6AFA] font-semibold animate-pulse hover:text-[#7A5AE0]'
              : 'text-[#8D6AFA] hover:text-[#7A5AE0]'
          }`}
        >
          {tAuth('forgotPassword')}
        </Link>
        <Link
          href="/signup"
          className="text-sm text-[#8D6AFA] hover:text-[#7A5AE0]"
        >
          {tAuth('dontHaveAccount')}
        </Link>
      </div>

      {/* Turnstile CAPTCHA */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken('')}
            onExpire={() => setTurnstileToken('')}
            options={{ theme: 'dark' }}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !turnstileToken}
        className="w-full h-11 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white font-medium rounded-lg"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          tAuth('signIn')
        )}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-white/[0.1]" />
        <span className="text-gray-400 text-xs">
          {tAuth('orContinueWith')}
        </span>
        <div className="flex-1 border-t border-white/[0.1]" />
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={loading}
        className={`w-full h-11 ${
          suggestGoogle
            ? 'border-[#8D6AFA] bg-purple-900/30 text-gray-200 hover:bg-purple-900/40 animate-pulse'
            : 'bg-white/10 dark:bg-white/10 border-white/20 dark:border-white/20 text-gray-200 hover:bg-white/[0.16] dark:hover:bg-white/[0.16] hover:text-white'
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
      </Button>
    </form>
  );
}
