/**
 * Common Types
 * Shared types used across the application
 */

/**
 * User Roles
 * Backend role names exactly as defined
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',      // System admin - creates schools
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',    // School admin - manages school
  PRINCIPAL = 'PRINCIPAL',          // Principal/Leadership
  TEACHER = 'TEACHER',              // Teacher/Educator
  STUDENT = 'STUDENT',              // Student/Learner
  PARENT = 'PARENT',                // Parent/Guardian
}

/**
 * User Role Display Names (for UI)
 */
export const USER_ROLE_DISPLAY: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'System Administrator',
  [UserRole.SCHOOL_ADMIN]: 'School Administrator',
  [UserRole.PRINCIPAL]: 'Principal',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.STUDENT]: 'Student',
  [UserRole.PARENT]: 'Parent',
};

/**
 * User Status
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Base Entity with Common Fields
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Pagination Request
 */
export interface PaginationRequest {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Pagination Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * API Response with Message
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * API Error
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Async State
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Date Range Filter
 */
export interface DateRange {
  from: string;
  to: string;
}
