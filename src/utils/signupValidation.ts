/**
 * Signup Form Validation Utility
 * Validates signup form data before submission
 */

import { SignupFormData, SignupFormErrors } from '../types/signup';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation rules
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validate signup form data
 */
export const validateSignupForm = (
  data: SignupFormData
): SignupFormErrors => {
  const errors: SignupFormErrors = {};

  // Validate First Name
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  } else if (data.firstName.length > 50) {
    errors.firstName = 'First name must not exceed 50 characters';
  }

  // Validate Last Name
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  } else if (data.lastName.length > 50) {
    errors.lastName = 'Last name must not exceed 50 characters';
  }

  // Validate Email
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate Password
  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!PASSWORD_REGEX.test(data.password)) {
    errors.password =
      'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }

  // Validate Password Confirmation
  if (!data.passwordConfirmation || data.passwordConfirmation.length === 0) {
    errors.passwordConfirmation = 'Please confirm your password';
  } else if (data.password !== data.passwordConfirmation) {
    errors.passwordConfirmation = 'Passwords do not match';
  }

  // Validate Role
  if (!data.role || data.role.trim().length === 0) {
    errors.role = 'Please select a role';
  }

  // Validate Institution ID if required
  if (
    (data.role as string) !== 'super_admin' &&
    (!data.institutionId || data.institutionId.trim().length === 0)
  ) {
    errors.institutionId = 'Please select an institution';
  }

  // Validate Terms Agreement
  if (!data.agreeToTerms) {
    errors.agreeToTerms =
      'You must agree to the Terms and Conditions and Privacy Policy';
  }

  return errors;
};

/**
 * Check if form has any errors
 */
export const hasErrors = (errors: SignupFormErrors): boolean => {
  return Object.values(errors).some((error) => error !== undefined);
};

/**
 * Get full name from first and last name
 */
export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName.trim()} ${lastName.trim()}`;
};
