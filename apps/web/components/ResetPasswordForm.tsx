'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, AlertCircle, Loader2, CheckCircle, Check, X, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PasswordStrength {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  
  const { confirmPasswordReset, verifyPasswordResetCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tAuth = useTranslations('auth');

  useEffect(() => {
    const code = searchParams.get('oobCode');
    
    if (!code) {
      setError(tAuth('invalidResetLink'));
      setVerifying(false);
      return;
    }

    setOobCode(code);
    
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(code);
        setEmail(userEmail);
        setVerifying(false);
      } catch (error) {
        const errorObj = error as { message?: string };
        const errorMessage = errorObj.message || '';
        
        if (errorMessage.includes('expired')) {
          setError(tAuth('resetLinkExpired'));
        } else if (errorMessage.includes('invalid')) {
          setError(tAuth('invalidResetLink'));
        } else {
          setError(tAuth('verificationFailed'));
        }
        setVerifying(false);
      }
    };

    verifyCode();
  }, [searchParams, verifyPasswordResetCode, tAuth]);

  useEffect(() => {
    const strength: PasswordStrength = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordStrength(strength);
  }, [password]);

  const isPasswordValid = () => {
    return (
      passwordStrength.minLength &&
      passwordStrength.hasUppercase &&
      passwordStrength.hasLowercase &&
      passwordStrength.hasNumber
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(tAuth('passwordsDoNotMatch'));
      return;
    }

    if (!isPasswordValid()) {
      setError(tAuth('passwordRequirementsNotMet'));
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(oobCode, password);
      setResetComplete(true);
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message || '';
      
      if (errorMessage.includes('weak-password')) {
        setError(tAuth('weakPassword'));
      } else if (errorMessage.includes('expired')) {
        setError(tAuth('resetLinkExpired'));
      } else {
        setError(tAuth('resetPasswordFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="max-w-md w-full space-y-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#8D6AFA]" />
        <p className="text-gray-600 dark:text-gray-400">{tAuth('verifyingResetLink')}</p>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            {tAuth('passwordResetSuccess')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {tAuth('redirectingToLogin')}
          </p>
        </div>
      </div>
    );
  }

  if (error && verifying === false && !email) {
    return (
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            {tAuth('resetPasswordError')}
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-[#8D6AFA] dark:text-[#8D6AFA] hover:text-[#7A5AE0] dark:hover:text-[#7A5AE0]"
          >
            {tAuth('requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
          {tAuth('createNewPassword')}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {tAuth('enterNewPasswordFor')} <span className="font-medium dark:text-gray-200">{email}</span>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {tAuth('newPassword')}
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-[#8D6AFA] focus:border-[#8D6AFA] sm:text-sm"
              placeholder={tAuth('enterNewPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label={showPassword ? tAuth('hidePassword') : tAuth('showPassword')}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {tAuth('confirmNewPassword')}
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full px-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-[#8D6AFA] focus:border-[#8D6AFA] sm:text-sm"
              placeholder={tAuth('confirmYourPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label={showConfirmPassword ? tAuth('hidePassword') : tAuth('showPassword')}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {tAuth('passwordRequirements')}
          </p>
          <ul className="space-y-1">
            <li className="flex items-center text-sm">
              {passwordStrength.minLength ? (
                <Check className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mr-2" />
              )}
              <span className={passwordStrength.minLength ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                {tAuth('passwordMinLength')}
              </span>
            </li>
            <li className="flex items-center text-sm">
              {passwordStrength.hasUppercase ? (
                <Check className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mr-2" />
              )}
              <span className={passwordStrength.hasUppercase ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                {tAuth('passwordUppercase')}
              </span>
            </li>
            <li className="flex items-center text-sm">
              {passwordStrength.hasLowercase ? (
                <Check className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mr-2" />
              )}
              <span className={passwordStrength.hasLowercase ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                {tAuth('passwordLowercase')}
              </span>
            </li>
            <li className="flex items-center text-sm">
              {passwordStrength.hasNumber ? (
                <Check className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mr-2" />
              )}
              <span className={passwordStrength.hasNumber ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                {tAuth('passwordNumber')}
              </span>
            </li>
            <li className="flex items-center text-sm">
              {passwordStrength.hasSpecial ? (
                <Check className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mr-2" />
              )}
              <span className={passwordStrength.hasSpecial ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                {tAuth('passwordSpecialChar')} ({tAuth('optional')})
              </span>
            </li>
          </ul>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || !isPasswordValid() || password !== confirmPassword}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#8D6AFA] hover:bg-[#7A5AE0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8D6AFA] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              tAuth('resetPassword')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}