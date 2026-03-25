/**
 * Signup Form Types
 * Types specific to the signup form and validation
 */

import { UserRole } from './common';

/**
 * Signup Form Data (Client-side)
 */
export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: UserRole;
  institutionId?: string;
  agreeToTerms: boolean;
}

/**
 * Signup Form Errors
 */
export interface SignupFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  role?: string;
  institutionId?: string;
  agreeToTerms?: string;
  submit?: string;
}

/**
 * Signup Step (for multi-step signup in future)
 */
export enum SignupStep {
  BASIC_INFO = 'basic_info',
  CREDENTIALS = 'credentials',
  ROLE_SELECTION = 'role_selection',
  CONFIRMATION = 'confirmation',
}

/**
 * Role-Specific Config
 */
export interface RoleConfig {
  value: UserRole;
  label: string;
  description: string;
  requiresInstitution: boolean;
  color: string;
}

/**
 * Institution Option (for selector)
 */
export interface InstitutionOption {
  id: string;
  name: string;
  code: string;
}
