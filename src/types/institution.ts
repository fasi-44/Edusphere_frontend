/**
 * Institution Types
 * Previously "School" - now "Institution" for generic education platforms
 */

import { BaseEntity } from './common';

/**
 * Institution (School, College, Coaching Institute, etc.)
 */
export interface Institution extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  logo_url?: string;
  established_year?: number;
  principal_name?: string;
  principal_email?: string;
  total_students?: number;
  total_educators?: number;
  status: 'active' | 'inactive';
  created_by?: string;
  updated_by?: string;
}

/**
 * Institution Create Request
 */
export interface CreateInstitutionRequest {
  code: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  principal_name?: string;
  principal_email?: string;
}

/**
 * Institution Update Request
 */
export interface UpdateInstitutionRequest {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  logo_url?: string;
  principal_name?: string;
  principal_email?: string;
  status?: 'active' | 'inactive';
}

/**
 * Institution Stats (Dashboard)
 */
export interface InstitutionStats {
  total_students: number;
  total_educators: number;
  total_users: number;
  total_cohorts: number;
  total_courses: number;
  total_fees_collected: number;
  pending_fees: number;
  attendance_percentage: number;
}
