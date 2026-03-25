/**
 * Forgot Password Form Component
 * Two-step form: Request reset email, then reset password
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '../../icons';
import Label from '../form/Label';
import Input from '../form/input/InputField';
import Button from '../ui/button/Button';
import { authService } from '../../services/auth/authService';
import toast from 'react-hot-toast';
import {
  ForgotPasswordStep,
  ForgotPasswordRequestData,
  ResetPasswordData,
  ForgotPasswordErrors,
} from '../../types/forgotPassword';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ForgotPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Initialize step based on URL token
  const initialStep = token
    ? ForgotPasswordStep.RESET
    : ForgotPasswordStep.REQUEST;

  // State
  const [step, setStep] = useState<ForgotPasswordStep>(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [requestData, setRequestData] = useState<ForgotPasswordRequestData>({
    email: '',
  });

  const [resetData, setResetData] = useState<ResetPasswordData>({
    token: token || '',
    password: '',
    passwordConfirmation: '',
  });

  // Errors
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});

  // Validate request email
  const validateRequestEmail = (email: string): string | undefined => {
    if (!email || email.trim().length === 0) {
      return 'Email is required';
    }
    if (!EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  // Validate reset password
  const validateResetPassword = (
    password: string,
    confirmation: string,
    resetToken: string
  ): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!resetToken) {
      newErrors.token = 'Invalid reset link';
    }

    if (!password || password.length === 0) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!PASSWORD_REGEX.test(password)) {
      newErrors.password =
        'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmation || confirmation.length === 0) {
      newErrors.passwordConfirmation = 'Please confirm your password';
    } else if (password !== confirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    return newErrors;
  };

  // Handle request submission
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailError = validateRequestEmail(requestData.email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: requestData.email });
      toast.success('Check your email for password reset instructions');
      setStep(ForgotPasswordStep.SUCCESS);
    } catch (error: any) {
      const message = error?.message || 'Failed to send reset email';
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset submission
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateResetPassword(
      resetData.password,
      resetData.passwordConfirmation,
      resetData.token
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        token: resetData.token,
        password: resetData.password,
        password_confirmation: resetData.passwordConfirmation,
      });
      toast.success('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/signin';
      }, 2000);
    } catch (error: any) {
      const message = error?.message || 'Failed to reset password';
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to sign in
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          {/* REQUEST STEP */}
          {step === ForgotPasswordStep.REQUEST && (
            <>
              <div className="mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-md dark:text-white/90">
                  Forgot Password
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              <form onSubmit={handleRequestSubmit}>
                <div className="space-y-6">
                  {errors.submit && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                      {errors.submit}
                    </div>
                  )}

                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={requestData.email}
                      onChange={(e) =>
                        setRequestData({ email: e.target.value })
                      }
                      disabled={isLoading}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>

              <div className="mt-5">
                <p className="text-sm text-center text-gray-700 dark:text-gray-400">
                  Remember your password?{' '}
                  <Link
                    to="/signin"
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* RESET STEP */}
          {step === ForgotPasswordStep.RESET && (
            <>
              <div className="mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-md dark:text-white/90">
                  Reset Password
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleResetSubmit}>
                <div className="space-y-6">
                  {errors.submit && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                      {errors.submit}
                    </div>
                  )}

                  {errors.token && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                      Invalid reset link. Please request a new one.
                    </div>
                  )}

                  <div>
                    <Label>
                      New Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={resetData.password}
                        onChange={(e) =>
                          setResetData({
                            ...resetData,
                            password: e.target.value,
                          })
                        }
                        disabled={isLoading}
                        className={
                          errors.password ? 'border-red-500' : ''
                        }
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>
                      Confirm Password{' '}
                      <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={resetData.passwordConfirmation}
                        onChange={(e) =>
                          setResetData({
                            ...resetData,
                            passwordConfirmation: e.target.value,
                          })
                        }
                        disabled={isLoading}
                        className={
                          errors.passwordConfirmation
                            ? 'border-red-500'
                            : ''
                        }
                      />
                      <span
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                    {errors.passwordConfirmation && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.passwordConfirmation}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isLoading || !resetData.token}
                    type="submit"
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* SUCCESS STEP */}
          {step === ForgotPasswordStep.SUCCESS && (
            <>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="mb-2 font-semibold text-gray-800 text-title-md dark:text-white/90">
                  Check Your Email
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We've sent a password reset link to{' '}
                  <strong>{requestData.email}</strong>. Click the link in your
                  email to reset your password.
                </p>
              </div>

              <div className="mt-8">
                <p className="text-sm text-center text-gray-700 dark:text-gray-400">
                  Didn't receive the email?{' '}
                  <button
                    onClick={() => {
                      setStep(ForgotPasswordStep.REQUEST);
                      setRequestData({ email: '' });
                      setErrors({});
                    }}
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
                  >
                    Try again
                  </button>
                </p>
              </div>

              <div className="mt-5">
                <p className="text-sm text-center text-gray-700 dark:text-gray-400">
                  Back to{' '}
                  <Link
                    to="/signin"
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
