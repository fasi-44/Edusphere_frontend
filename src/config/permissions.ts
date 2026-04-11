/**
 * Central Permission Configuration
 * Single source of truth for all permission keys, route mappings, and sidebar mappings.
 */

// ──────────────────────────────────────────────
// Permission Enum — all granular permission keys
// ──────────────────────────────────────────────
export enum Permission {
  // User Management
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  DELETE_USERS = 'delete_users',

  // Teachers
  VIEW_TEACHERS = 'view_teachers',
  MANAGE_TEACHERS = 'manage_teachers',
  DELETE_TEACHERS = 'delete_teachers',

  // Students
  VIEW_STUDENTS = 'view_students',
  MANAGE_STUDENTS = 'manage_students',
  DELETE_STUDENTS = 'delete_students',

  // Roles
  MANAGE_ROLES = 'manage_roles',

  // Classes
  VIEW_CLASSES = 'view_classes',
  MANAGE_CLASSES = 'manage_classes',

  // Attendance
  VIEW_ATTENDANCE = 'view_attendance',
  MANAGE_ATTENDANCE = 'manage_attendance',

  // Announcements
  VIEW_ANNOUNCEMENTS = 'view_announcements',
  MANAGE_ANNOUNCEMENTS = 'manage_announcements',

  // Timetable
  VIEW_TIMETABLE = 'view_timetable',
  MANAGE_TIMETABLE = 'manage_timetable',

  // Exams
  VIEW_EXAMS = 'view_exams',
  MANAGE_EXAMS = 'manage_exams',

  // Marks / Academics
  VIEW_MARKS = 'view_marks',
  MANAGE_MARKS = 'manage_marks',

  // Fees
  VIEW_FEES = 'view_fees',
  MANAGE_FEES = 'manage_fees',

  // Expenses
  VIEW_EXPENSES = 'view_expenses',
  MANAGE_EXPENSES = 'manage_expenses',

  // Syllabus
  VIEW_SYLLABUS_AND_PROGRESS = 'view_syllabus_and_progress',
  MANAGE_SYLLABUS = 'manage_syllabus',

  // Assignments
  VIEW_ASSIGNMENTS = 'view_assignments',
  MANAGE_ASSIGNMENTS = 'manage_assignments',

  // Bus Scan
  VIEW_BUS_SCAN = 'view_bus_scan',
  MANAGE_BUS_SCAN = 'manage_bus_scan',
}

// ──────────────────────────────────────────────
// Route → Permission Map
// ──────────────────────────────────────────────
export interface RoutePermissionConfig {
  permission?: Permission;
  /** Access granted if user has ANY of these permissions (OR logic) */
  anyPermission?: Permission[];
  superAdminOnly?: boolean;
}

/**
 * Maps route paths to required permissions.
 * Routes not listed here are accessible to any authenticated user.
 * `superAdminOnly: true` means only SUPER_ADMIN can access (School Management).
 */
export const ROUTE_PERMISSION_MAP: Record<string, RoutePermissionConfig> = {
  // School Management — super admin only
  '/schools': { superAdminOnly: true },
  '/schools/new': { superAdminOnly: true },
  '/schools/:id/edit': { superAdminOnly: true },
  '/schools/:id': { superAdminOnly: true },
  '/school-admins': { superAdminOnly: true },
  '/system-admins': { superAdminOnly: true },

  // User Management
  '/users': { permission: Permission.VIEW_USERS },
  '/users/new': { permission: Permission.MANAGE_USERS },
  '/users/:id/edit': { permission: Permission.MANAGE_USERS },
  '/users/:id': { permission: Permission.VIEW_USERS },

  // Teachers
  '/teachers': { permission: Permission.VIEW_TEACHERS },
  '/teachers/new': { permission: Permission.MANAGE_TEACHERS },
  '/teachers/:id/edit': { permission: Permission.MANAGE_TEACHERS },

  // Students
  '/students': { permission: Permission.VIEW_STUDENTS },
  '/students/new': { permission: Permission.MANAGE_STUDENTS },
  '/students/:id/edit': { permission: Permission.MANAGE_STUDENTS },

  // Parents
  '/parents': { permission: Permission.VIEW_STUDENTS },
  '/parents/new': { permission: Permission.MANAGE_STUDENTS },
  '/parents/:id/edit': { permission: Permission.MANAGE_STUDENTS },

  // Roles & Permissions
  '/roles': { permission: Permission.MANAGE_ROLES },
  '/roles/new': { permission: Permission.MANAGE_ROLES },
  '/roles/:id/edit': { permission: Permission.MANAGE_ROLES },

  // Class Management
  '/classes': { permission: Permission.VIEW_CLASSES },
  '/classes/new': { permission: Permission.MANAGE_CLASSES },
  '/classes/:id/edit': { permission: Permission.MANAGE_CLASSES },
  '/classes/:id': { permission: Permission.VIEW_CLASSES },

  // Room Management
  '/rooms': { permission: Permission.VIEW_CLASSES },

  // Attendance
  '/attendance/mark': { permission: Permission.MANAGE_ATTENDANCE },
  '/attendance/report': { permission: Permission.VIEW_ATTENDANCE },

  // Announcements
  '/announcements': { permission: Permission.VIEW_ANNOUNCEMENTS },
  '/announcements/new': { permission: Permission.MANAGE_ANNOUNCEMENTS },
  '/announcements/:id/edit': { permission: Permission.MANAGE_ANNOUNCEMENTS },

  // Timetable
  '/timetable': { permission: Permission.VIEW_TIMETABLE },
  '/timetable/new': { permission: Permission.MANAGE_TIMETABLE },
  '/timetable/:id': { permission: Permission.VIEW_TIMETABLE },
  '/timetable/:id/edit': { permission: Permission.MANAGE_TIMETABLE },

  // Exam Management
  '/exams': { permission: Permission.VIEW_EXAMS },
  '/exams/new': { permission: Permission.MANAGE_EXAMS },
  '/exams/:id/edit': { permission: Permission.MANAGE_EXAMS },
  '/exams/:id': { permission: Permission.VIEW_EXAMS },
  '/exams/configs': { permission: Permission.MANAGE_EXAMS },
  '/exams/timetable': { permission: Permission.MANAGE_EXAMS },
  '/exams/seating': { permission: Permission.MANAGE_EXAMS },
  '/exams/my-timetable': { permission: Permission.VIEW_EXAMS },
  '/exams/invigilator-schedule': { permission: Permission.MANAGE_EXAMS },

  // Academics
  '/academics/subjects': { permission: Permission.VIEW_EXAMS },
  '/academics/assign-subjects': { permission: Permission.MANAGE_TEACHERS },
  '/academics/marks/entry': { permission: Permission.MANAGE_MARKS },
  '/academics/progress/class': { permission: Permission.VIEW_MARKS },
  '/academics/progress-card/:studentId/:examId': { permission: Permission.VIEW_MARKS },

  // Finance
  '/finance/fee-structure': { permission: Permission.VIEW_FEES },
  '/finance/fee-structure/create': { permission: Permission.MANAGE_FEES },
  '/finance/fee-structure/edit/:classId': { permission: Permission.MANAGE_FEES },
  '/finance/fee-collection': { permission: Permission.MANAGE_FEES },
  '/finance/expenses': { permission: Permission.VIEW_EXPENSES },
  '/finance/salary-setup': { permission: Permission.MANAGE_FEES },
  '/finance/salary-payments': { permission: Permission.MANAGE_FEES },

  // Assignments
  '/assignments': { permission: Permission.MANAGE_ASSIGNMENTS },
  '/assignments/:id/review': { permission: Permission.MANAGE_ASSIGNMENTS },
  '/assignments/my-assignments': { permission: Permission.VIEW_ASSIGNMENTS },

  // Bus Scan
  '/bus-scan': { permission: Permission.MANAGE_BUS_SCAN },
  '/bus-scan/scan': { permission: Permission.MANAGE_BUS_SCAN },
  '/bus-scan/report': { permission: Permission.VIEW_BUS_SCAN },

  // Syllabus
  '/syllabus': { permission: Permission.MANAGE_SYLLABUS },
  '/syllabus/analytics': { permission: Permission.MANAGE_SYLLABUS },
  '/syllabus/my-progress': { permission: Permission.VIEW_SYLLABUS_AND_PROGRESS },
  '/syllabus/my-progress/:id': { permission: Permission.VIEW_SYLLABUS_AND_PROGRESS },
  '/syllabus/:id': { permission: Permission.VIEW_SYLLABUS_AND_PROGRESS },
};

// ──────────────────────────────────────────────
// Sidebar → Permission Map
// ──────────────────────────────────────────────
export interface SidebarGroupPermissionConfig {
  /** Group is visible if user has ANY of these permissions */
  groupPermissions: Permission[];
  /** If true, group is only visible to SUPER_ADMIN (overrides groupPermissions) */
  superAdminOnly?: boolean;
  /** Maps sub-item paths to the permission required to show that item */
  itemPermissions: Record<string, Permission>;
  /** Paths to hide for full-access roles (SCHOOL_ADMIN) — e.g. role-specific personal views */
  excludeFromFullAccess?: string[];
  /** Hide a path if the user HAS a given permission (inverse check).
   *  Use case: hide "My Assignments" from users who have manage_assignments. */
  excludeIfHasPermission?: Record<string, Permission>;
}

export const SIDEBAR_PERMISSION_MAP: Record<string, SidebarGroupPermissionConfig> = {
  'School Management': {
    groupPermissions: [],
    superAdminOnly: true,
    itemPermissions: {
      '/schools': Permission.VIEW_USERS, // placeholder — superAdminOnly overrides
      '/schools/new': Permission.MANAGE_USERS,
      '/school-admins': Permission.VIEW_USERS,
      '/system-admins': Permission.VIEW_USERS,
    },
  },
  'User Management': {
    groupPermissions: [
      Permission.VIEW_USERS,
      Permission.VIEW_TEACHERS,
      Permission.VIEW_STUDENTS,
      Permission.MANAGE_ROLES,
    ],
    itemPermissions: {
      '/users': Permission.VIEW_USERS,
      '/users/new': Permission.MANAGE_USERS,
      '/teachers': Permission.VIEW_TEACHERS,
      '/students': Permission.VIEW_STUDENTS,
      '/parents': Permission.VIEW_STUDENTS,
      '/roles': Permission.MANAGE_ROLES,
    },
  },
  'Class Management': {
    groupPermissions: [Permission.VIEW_CLASSES],
    itemPermissions: {
      '/classes': Permission.VIEW_CLASSES,
      '/classes/new': Permission.MANAGE_CLASSES,
      '/rooms': Permission.VIEW_CLASSES,
    },
  },
  'Attendance': {
    groupPermissions: [Permission.VIEW_ATTENDANCE, Permission.MANAGE_ATTENDANCE],
    itemPermissions: {
      '/attendance/mark': Permission.MANAGE_ATTENDANCE,
      '/attendance/report': Permission.VIEW_ATTENDANCE,
    },
  },
  'Announcements': {
    groupPermissions: [Permission.VIEW_ANNOUNCEMENTS],
    itemPermissions: {
      '/announcements': Permission.VIEW_ANNOUNCEMENTS,
      '/announcements/new': Permission.MANAGE_ANNOUNCEMENTS,
    },
  },
  'Timetable': {
    groupPermissions: [Permission.VIEW_TIMETABLE],
    itemPermissions: {
      '/timetable': Permission.VIEW_TIMETABLE,
    },
  },
  'Exam Management': {
    groupPermissions: [Permission.MANAGE_EXAMS],
    itemPermissions: {
      '/exams': Permission.VIEW_EXAMS,
      '/exams/new': Permission.MANAGE_EXAMS,
      '/exams/configs': Permission.MANAGE_EXAMS,
      '/exams/timetable': Permission.MANAGE_EXAMS,
      '/exams/seating': Permission.MANAGE_EXAMS,
    },
  },
  'My Exam Timetable': {
    groupPermissions: [Permission.VIEW_EXAMS],
    itemPermissions: {
      '/exams/my-timetable': Permission.VIEW_EXAMS,
    },
    excludeIfHasPermission: {
      '/exams/my-timetable': Permission.MANAGE_EXAMS,
    },
    excludeFromFullAccess: ['/exams/my-timetable'],
  },
  'My Invigilator Schedule': {
    groupPermissions: [Permission.MANAGE_EXAMS],
    itemPermissions: {
      '/exams/invigilator-schedule': Permission.MANAGE_EXAMS,
    },
    excludeFromFullAccess: ['/exams/invigilator-schedule'],
  },
  'Academics Management': {
    groupPermissions: [Permission.VIEW_EXAMS, Permission.VIEW_MARKS, Permission.MANAGE_MARKS, Permission.MANAGE_TEACHERS],
    itemPermissions: {
      '/academics/subjects': Permission.VIEW_EXAMS,
      '/academics/assign-subjects': Permission.MANAGE_TEACHERS,
      '/academics/marks/entry': Permission.MANAGE_MARKS,
      '/academics/progress/class': Permission.VIEW_MARKS,
    },
  },
  'Assignments': {
    groupPermissions: [Permission.MANAGE_ASSIGNMENTS],
    itemPermissions: {
      '/assignments': Permission.MANAGE_ASSIGNMENTS,
    },
  },
  'My Assignments': {
    groupPermissions: [Permission.VIEW_ASSIGNMENTS],
    itemPermissions: {
      '/assignments/my-assignments': Permission.VIEW_ASSIGNMENTS,
    },
    excludeFromFullAccess: ['/assignments/my-assignments'],
    excludeIfHasPermission: {
      '/assignments/my-assignments': Permission.MANAGE_ASSIGNMENTS,
    },
  },
  'Syllabus Management': {
    groupPermissions: [Permission.MANAGE_SYLLABUS, Permission.VIEW_SYLLABUS_AND_PROGRESS],
    itemPermissions: {
      '/syllabus': Permission.MANAGE_SYLLABUS,
      '/syllabus/analytics': Permission.MANAGE_SYLLABUS,
      '/syllabus/my-progress': Permission.VIEW_SYLLABUS_AND_PROGRESS,
    },
    excludeFromFullAccess: ['/syllabus/my-progress'],
  },
  'Bus Management': {
    groupPermissions: [Permission.VIEW_BUS_SCAN, Permission.MANAGE_BUS_SCAN],
    itemPermissions: {
      '/bus-scan': Permission.MANAGE_BUS_SCAN,
      '/bus-scan/scan': Permission.MANAGE_BUS_SCAN,
      '/bus-scan/report': Permission.VIEW_BUS_SCAN,
    },
  },
  'Finance Management': {
    groupPermissions: [Permission.VIEW_FEES, Permission.VIEW_EXPENSES],
    itemPermissions: {
      '/finance/fee-structure': Permission.VIEW_FEES,
      '/finance/fee-collection': Permission.MANAGE_FEES,
      '/finance/expenses': Permission.VIEW_EXPENSES,
      '/finance/salary-setup': Permission.MANAGE_FEES,
      '/finance/salary-payments': Permission.MANAGE_FEES,
    },
  },
};
