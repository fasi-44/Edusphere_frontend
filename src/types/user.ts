/**
 * User Management Types
 */

import { BaseEntity, UserRole, UserStatus, PaginatedResponse } from './common';

/**
 * User (All roles)
 */
export interface User extends BaseEntity {
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  institution_id: string;
  profile_picture?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  last_login?: string;
}

/**
 * Create User Request
 */
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

/**
 * Update User Request
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  profile_picture?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

/**
 * Change Password Request
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

/**
 * Users List Response
 */
export type UserListResponse = PaginatedResponse<User>;
