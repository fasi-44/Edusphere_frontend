/**
 * Dashboard Types
 * Shared types for all role-based dashboards
 */

/**
 * Super Admin Dashboard Stats
 */
export interface SuperAdminStats {
  total_institutions: number;
  total_users: number;
  total_students: number;
  total_educators: number;
  active_institutions: number;
  inactive_institutions: number;
  system_health: number; // 0-100%
  last_updated: string;
}

/**
 * Administrator Dashboard Stats
 */
export interface AdministratorStats {
  total_students: number;
  total_educators: number;
  total_cohorts: number;
  total_courses: number;
  total_users: number;
  active_users: number;
  inactive_users: number;
  fees_collected: number;
  pending_fees: number;
  attendance_percentage: number;
  last_updated: string;
}

/**
 * Educator Dashboard Stats
 */
export interface EducatorStats {
  assigned_cohorts: number;
  total_students: number;
  total_courses: number;
  pending_assignments: number;
  attendance_marked: number;
  total_marks_entered: number;
  last_updated: string;
}

/**
 * Learner Dashboard Stats
 */
export interface LearnerStats {
  enrolled_cohorts: number;
  total_courses: number;
  pending_assignments: number;
  completed_assessments: number;
  overall_grade: string; // A+, A, B+, etc.
  attendance_percentage: number;
  last_updated: string;
}

/**
 * Guardian Dashboard Stats
 */
export interface GuardianStats {
  total_children: number;
  overall_attendance: number;
  overall_performance: string;
  pending_fees: number;
  recent_communications: number;
  last_updated: string;
}

/**
 * Stat Card Props
 */
export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

/**
 * Chart Data
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

/**
 * Recent Activity Item
 */
export interface RecentActivity {
  id: string;
  type: 'user_created' | 'class_created' | 'mark_entered' | 'fee_paid' | 'assignment_submitted';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

/**
 * Quick Action
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  href: string;
}

/**
 * Top Performer
 */
export interface TopPerformer {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  performance: number; // percentage
  department?: string;
}
