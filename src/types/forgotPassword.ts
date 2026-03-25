/**
 * Forgot Password Types
 */

/**
 * Forgot Password Step
 */
export enum ForgotPasswordStep {
  REQUEST = 'request', // Ask for email
  RESET = 'reset', // Ask for new password with token
  SUCCESS = 'success', // Show success message
}

/**
 * Forgot Password Request Data
 */
export interface ForgotPasswordRequestData {
  email: string;
}

/**
 * Reset Password Data
 */
export interface ResetPasswordData {
  token: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Forgot Password Form Errors
 */
export interface ForgotPasswordErrors {
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  token?: string;
  submit?: string;
}
