'use client';

import { useState, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { AlertCircle, Loader2, Check, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase';
import { getPendingImport, clearPendingImport } from '@/lib/pendingImport';
import { importedConversationApi } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<React.ReactNode>('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileInstance>(null);

  const { signUpWithEmail, signInWithEmail, signInWithGoogle } = useAuth();
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

    if (!turnstileToken) {
      setError(tAuth('captchaRequired'));
      return;
    }

    setLoading(true);

    try {
      // Verify Turnstile token server-side before creating Firebase account
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

      // Send verification code via backend
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          await fetch(`${getApiUrl()}/auth/send-verification-code`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (emailError) {
          console.error('Error sending verification code:', emailError);
          // Still redirect to verification page even if email fails
          // User can resend from there
        }
      }

      // Redirect to verification page
      router.push('/verify-email');
    } catch (error) {
      const errorObj = error as { message?: string; code?: string };
      const errorCode = errorObj.code || '';

      if (errorCode === 'auth/email-already-in-use') {
        // Check which provider this email is registered with
        try {
          const { fetchSignInMethodsForEmail } = await import('firebase/auth');
          const signInMethods = await fetchSignInMethodsForEmail(auth, email);

          if (signInMethods.includes('google.com')) {
            setError(tAuth('emailRegisteredWithGoogle'));
            return;
          }

          // Password provider (or empty array if enumeration protection is on)
          // Attempt silent sign-in with the password the user already entered
          try {
            await signInWithEmail(email, password);

            // Sign-in succeeded — check verification status
            if (auth.currentUser) {
              await auth.currentUser.reload();

              if (!auth.currentUser.emailVerified) {
                // Unverified: resend verification code and redirect
                try {
                  const token = await auth.currentUser.getIdToken();
                  await fetch(`${getApiUrl()}/auth/send-verification-code`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  });
                } catch (emailError) {
                  console.error('Error resending verification code:', emailError);
                }
                router.push('/verify-email?resent=true');
              } else {
                // Already verified: auto sign-in, check for pending imports
                trackEvent('login', { method: 'email', source: 'signup_auto_signin' });
                const pendingImport = getPendingImport();
                if (pendingImport) {
                  try {
                    await importedConversationApi.import(pendingImport.shareToken);
                    clearPendingImport();
                    router.push('/shared-with-me');
                    return;
                  } catch (importError) {
                    console.error('Failed to auto-import:', importError);
                    clearPendingImport();
                  }
                }
                router.push('/dashboard');
              }
            }
          } catch (signInError) {
            const signInErrorObj = signInError as { code?: string; message?: string };
            const signInCode = signInErrorObj.code || '';
            const signInMsg = signInErrorObj.message || '';

            if (signInCode === 'auth/too-many-requests') {
              setError(tAuth('tooManyRequests'));
            } else if (
              signInCode === 'auth/wrong-password' ||
              signInCode === 'auth/invalid-credential' ||
              signInCode === 'auth/invalid-login-credentials' ||
              signInMsg.includes('INVALID_LOGIN_CREDENTIALS')
            ) {
              // Password mismatch: show helpful error with links
              setError(
                <span>
                  {tAuth('emailExistsPasswordMismatch')}{' '}
                  <Link href="/login" className="font-medium text-[#8D6AFA] hover:text-[#7A5AE0] underline">
                    {tAuth('signIn')}
                  </Link>
                  {' '}{tAuth('or')}{' '}
                  <Link href="/forgot-password" className="font-medium text-[#8D6AFA] hover:text-[#7A5AE0] underline">
                    {tAuth('resetYourPassword')}
                  </Link>
                </span>
              );
            } else {
              setError(tAuth('emailAlreadyInUse'));
            }
          }
        } catch {
          setError(tAuth('emailAlreadyInUse'));
        }
      } else if (errorCode === 'auth/invalid-email') {
        setError(tAuth('invalidEmail'));
      } else if (errorCode === 'auth/weak-password') {
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

      // Check for pending import and auto-import
      const pendingImport = getPendingImport();
      if (pendingImport) {
        try {
          await importedConversationApi.import(pendingImport.shareToken);
          clearPendingImport();
          // Redirect to shared-with-me to show the imported conversation
          router.push('/shared-with-me');
          return;
        } catch (importError) {
          console.error('Failed to auto-import:', importError);
          clearPendingImport();
          // Still redirect to dashboard even if import fails
        }
      }

      router.push('/dashboard');
    } catch (error) {
      const errorObj = error as { message?: string };
      setError(errorObj.message || tAuth('signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleEmailSignup}>
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-300">{error}</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-gray-300">
            {tAuth('displayName')}
          </Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-11 bg-white/[0.08] border-white/[0.12] text-gray-100 placeholder:text-gray-500 focus-visible:border-[#8D6AFA] focus-visible:ring-[#8D6AFA]/30"
          />
        </div>

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
              autoComplete="new-password"
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

          {/* Password Requirements */}
          {password && (
            <div className="space-y-1 pt-1">
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center text-xs">
                  {req.met ? (
                    <Check className="h-3 w-3 text-green-400 mr-1.5" />
                  ) : (
                    <X className="h-3 w-3 text-gray-500 mr-1.5" />
                  )}
                  <span className={req.met ? 'text-green-400' : 'text-gray-500'}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-300">
            {tAuth('confirmPassword')}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 pr-10 bg-white/[0.08] border-white/[0.12] text-gray-100 placeholder:text-gray-500 focus-visible:border-[#8D6AFA] focus-visible:ring-[#8D6AFA]/30"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label={showConfirmPassword ? tAuth('hidePassword') : tAuth('showPassword')}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500 hover:text-gray-300" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500 hover:text-gray-300" />
              )}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-400">{tAuth('passwordsDoNotMatch')}</p>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(checked === true)}
          className="mt-0.5 border-white/20 data-[state=checked]:bg-[#8D6AFA] data-[state=checked]:border-[#8D6AFA]"
        />
        <label htmlFor="acceptTerms" className="text-sm text-gray-400 leading-snug">
          {tAuth('iAgreeToThe')}{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#8D6AFA] hover:text-[#7A5AE0] inline-flex items-center gap-0.5">
            {tAuth('termsOfService')}<ExternalLink className="w-3 h-3" />
          </a>{' '}
          {tAuth('and')}{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#8D6AFA] hover:text-[#7A5AE0] inline-flex items-center gap-0.5">
            {tAuth('privacyPolicy')}<ExternalLink className="w-3 h-3" />
          </a>
        </label>
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
        disabled={loading || !acceptTerms || !turnstileToken}
        className="w-full h-11 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white font-medium rounded-lg"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          tAuth('createAccount')
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

      {/* Google Sign Up */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignup}
        disabled={loading}
        className="w-full h-11 bg-white/10 dark:bg-white/10 border-white/20 dark:border-white/20 text-gray-200 hover:bg-white/[0.16] dark:hover:bg-white/[0.16] hover:text-white"
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
      </Button>

      <p className="text-center text-sm text-gray-400">
        {tAuth('alreadyHaveAccount')}{' '}
        <Link href="/login" className="font-medium text-[#8D6AFA] hover:text-[#7A5AE0]">
          {tAuth('signIn')}
        </Link>
      </p>
    </form>
  );
}
