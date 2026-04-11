/**
 * Authentication Types
 */

import { UserRole } from './common';

/**
 * Academic Year
 */
export interface AcademicYear {
  id: number;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_current: boolean;
}

/**
 * Role Object
 */
export interface RoleObj {
  id: number;
  role_code: string;
  role_name: string;
  is_active: boolean;
  is_system_role: boolean;
  school_id: number | null;
  permissions: string[];
}

/**
 * Authenticated User
 */
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  name?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  plan: string;
  school_id: number;
  school_code: string;
  school_name: string;
  school_logo?: string;
  school_address?: string;
  school_phone?: string;
  school_email?: string;
  skid: string;
  school_user_id: number;
  role_obj: RoleObj;
  academicYear?: string | number;
  academic_year?: string | number;
  current_academic_year: AcademicYear;
  academic_years: AcademicYear[];
  created_at: string;
  updated_at: string;
  last_login: string;
}

/**
 * Login Request
 */
export interface LoginRequest {
  identifier: string; // Can be email or username
  password: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  message: string;
  user: AuthUser;
}

/**
 * Logout Request
 */
export interface LogoutRequest {
  // No payload needed for logout
}

/**
 * Logout Response
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Token Refresh Request
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Token Refresh Response
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  message: string;
}

/**
 * Forgot Password Request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Forgot Password Response
 */
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Reset Password Request
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

/**
 * Reset Password Response
 */
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Signup Request
 */
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: UserRole;
  institution_id?: string;
}

/**
 * Signup Response
 */
export interface SignupResponse {
  access_token?: string;
  refresh_token?: string;
  message: string;
  user?: AuthUser;
}
