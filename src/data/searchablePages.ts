/**
 * Searchable Pages Configuration
 * Defines all pages that can be searched with their metadata
 */

import { UserRole } from '../types/common';

export interface SearchablePage {
    id: string;
    name: string;
    description: string;
    route: string;
    keywords: string[];
    category: string;
    icon: string;
    roles: UserRole[];
}

export const searchablePages: SearchablePage[] = [
    // Dashboard
    {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'View overview and statistics',
        route: '/dashboard',
        keywords: ['home', 'overview', 'stats', 'analytics', 'main'],
        category: 'Dashboard',
        icon: '📊',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    },

    // School Management
    {
        id: 'schools-list',
        name: 'Schools List',
        description: 'View and manage all schools',
        route: '/schools',
        keywords: ['schools', 'institutions', 'list', 'manage'],
        category: 'School Management',
        icon: '🏫',
        roles: [UserRole.SUPER_ADMIN],
    },
    {
        id: 'schools-create',
        name: 'Create School',
        description: 'Register a new school',
        route: '/schools/new',
        keywords: ['school', 'create', 'add', 'register', 'new'],
        category: 'School Management',
        icon: '➕',
        roles: [UserRole.SUPER_ADMIN],
    },
    {
        id: 'school-admins',
        name: 'School Admins',
        description: 'Manage school administrators',
        route: '/school-admins',
        keywords: ['admin', 'administrators', 'manage'],
        category: 'School Management',
        icon: '👥',
        roles: [UserRole.SUPER_ADMIN],
    },

    // User Management
    {
        id: 'users-list',
        name: 'Users List',
        description: 'View and manage all users',
        route: '/users',
        keywords: ['users', 'list', 'manage', 'people'],
        category: 'User Management',
        icon: '👤',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'users-create',
        name: 'Create User',
        description: 'Add a new user',
        route: '/users/new',
        keywords: ['user', 'create', 'add', 'new'],
        category: 'User Management',
        icon: '➕',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'teachers-list',
        name: 'Teachers',
        description: 'Manage teachers',
        route: '/teachers',
        keywords: ['teachers', 'staff', 'faculty', 'educators'],
        category: 'User Management',
        icon: '👨‍🏫',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'students-list',
        name: 'Students',
        description: 'Manage students',
        route: '/students',
        keywords: ['students', 'pupils', 'learners'],
        category: 'User Management',
        icon: '🎓',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'students-create',
        name: 'Add Student',
        description: 'Register a new student',
        route: '/students/new',
        keywords: ['student', 'add', 'create', 'register', 'enroll'],
        category: 'User Management',
        icon: '➕',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'parents-list',
        name: 'Parents',
        description: 'Manage parents/guardians',
        route: '/parents',
        keywords: ['parents', 'guardians', 'family'],
        category: 'User Management',
        icon: '👪',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'roles-permissions',
        name: 'Roles & Permissions',
        description: 'Manage roles and permissions',
        route: '/roles',
        keywords: ['roles', 'permissions', 'access', 'rights'],
        category: 'User Management',
        icon: '🔐',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },

    // Class Management
    {
        id: 'classes-list',
        name: 'Classes',
        description: 'View and manage classes',
        route: '/classes',
        keywords: ['classes', 'sections', 'grades'],
        category: 'Class Management',
        icon: '🏛️',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'classes-create',
        name: 'Create Class',
        description: 'Add a new class',
        route: '/classes/new',
        keywords: ['class', 'create', 'add', 'new', 'grade'],
        category: 'Class Management',
        icon: '➕',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },

    // Room Management
    {
        id: 'rooms-list',
        name: 'Rooms',
        description: 'Manage rooms and halls',
        route: '/rooms',
        keywords: ['rooms', 'halls', 'classroom', 'laboratory', 'auditorium', 'capacity'],
        category: 'Class Management',
        icon: '🏠',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },

    // Attendance
    {
        id: 'attendance-mark',
        name: 'Mark Attendance',
        description: 'Record student attendance',
        route: '/attendance/mark',
        keywords: ['attendance', 'mark', 'record', 'present', 'absent'],
        category: 'Attendance',
        icon: '✅',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },
    {
        id: 'attendance-report',
        name: 'Attendance Report',
        description: 'View attendance reports',
        route: '/attendance/report',
        keywords: ['attendance', 'report', 'view', 'statistics'],
        category: 'Attendance',
        icon: '📋',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },

    // Announcements
    {
        id: 'announcements-list',
        name: 'Announcements',
        description: 'View all announcements',
        route: '/announcements',
        keywords: ['announcements', 'notices', 'news', 'updates'],
        category: 'Announcements',
        icon: '📢',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.STUDENT],
    },
    {
        id: 'announcements-create',
        name: 'Create Announcement',
        description: 'Post a new announcement',
        route: '/announcements/new',
        keywords: ['announcement', 'create', 'post', 'notice'],
        category: 'Announcements',
        icon: '➕',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },

    // Timetable
    {
        id: 'timetable-list',
        name: 'Timetable',
        description: 'View class timetables',
        route: '/timetable',
        keywords: ['timetable', 'schedule', 'classes', 'timing'],
        category: 'Timetable',
        icon: '📅',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },
    {
        id: 'timetable-create',
        name: 'Create Timetable',
        description: 'Create a new timetable',
        route: '/timetable/new',
        keywords: ['timetable', 'create', 'schedule', 'new'],
        category: 'Timetable',
        icon: '➕',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },

    // Exam Management
    {
        id: 'exams-list',
        name: 'Exam Types',
        description: 'Manage exam types',
        route: '/exams',
        keywords: ['exams', 'tests', 'assessments', 'types'],
        category: 'Exam Management',
        icon: '📝',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'exams-create',
        name: 'Create Exam Type',
        description: 'Add a new exam type',
        route: '/exams/new',
        keywords: ['exam', 'create', 'type', 'test'],
        category: 'Exam Management',
        icon: '➕',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'exam-configs',
        name: 'Exam Configuration',
        description: 'Configure exam subjects',
        route: '/exams/configs',
        keywords: ['exam', 'configuration', 'subjects', 'setup'],
        category: 'Exam Management',
        icon: '⚙️',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },
    {
        id: 'exam-timetable',
        name: 'Exam Timetable',
        description: 'Create and manage exam schedules',
        route: '/exams/timetable',
        keywords: ['exam', 'timetable', 'schedule', 'invigilator', 'exam date'],
        category: 'Exam Management',
        icon: '📅',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL],
    },

    // Academics
    {
        id: 'subjects-list',
        name: 'Subjects',
        description: 'Manage subjects',
        route: '/academics/subjects',
        keywords: ['subjects', 'courses', 'curriculum'],
        category: 'Academics',
        icon: '📚',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },
    {
        id: 'marks-entry',
        name: 'Marks Entry',
        description: 'Enter student marks',
        route: '/academics/marks/entry',
        keywords: ['marks', 'grades', 'scores', 'entry', 'results'],
        category: 'Academics',
        icon: '✏️',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },
    {
        id: 'class-progress',
        name: 'Class Progress',
        description: 'View class progress',
        route: '/academics/progress/class',
        keywords: ['progress', 'performance', 'class', 'results'],
        category: 'Academics',
        icon: '📈',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },

    // Syllabus Management
    {
        id: 'syllabus-list',
        name: 'Syllabus',
        description: 'View all syllabi',
        route: '/syllabus',
        keywords: ['syllabus', 'curriculum', 'lessons', 'topics'],
        category: 'Syllabus',
        icon: '📖',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },
    {
        id: 'syllabus-analytics',
        name: 'Syllabus Analytics',
        description: 'View syllabus analytics',
        route: '/syllabus/analytics',
        keywords: ['syllabus', 'analytics', 'progress', 'statistics'],
        category: 'Syllabus',
        icon: '📊',
        roles: [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER],
    },

    // Finance Management
    {
        id: 'fee-structure',
        name: 'Fee Structure',
        description: 'Manage fee structure',
        route: '/finance/fee-structure',
        keywords: ['fee', 'structure', 'tuition', 'charges'],
        category: 'Finance',
        icon: '💰',
        roles: [UserRole.SCHOOL_ADMIN],
    },
    {
        id: 'fee-collection',
        name: 'Fee Collection',
        description: 'Collect student fees',
        route: '/finance/fee-collection',
        keywords: ['fee', 'collection', 'payment', 'receipts'],
        category: 'Finance',
        icon: '💳',
        roles: [UserRole.SCHOOL_ADMIN],
    },
    {
        id: 'expenses',
        name: 'Expenses',
        description: 'Manage school expenses',
        route: '/finance/expenses',
        keywords: ['expenses', 'costs', 'expenditure', 'spending'],
        category: 'Finance',
        icon: '💸',
        roles: [UserRole.SCHOOL_ADMIN],
    },
    {
        id: 'salary-setup',
        name: 'Salary Setup',
        description: 'Configure staff salaries',
        route: '/finance/salary-setup',
        keywords: ['salary', 'setup', 'staff', 'payroll'],
        category: 'Finance',
        icon: '💼',
        roles: [UserRole.SCHOOL_ADMIN],
    },
    {
        id: 'salary-payments',
        name: 'Salary Payments',
        description: 'Process salary payments',
        route: '/finance/salary-payments',
        keywords: ['salary', 'payments', 'payroll', 'wages'],
        category: 'Finance',
        icon: '💵',
        roles: [UserRole.SCHOOL_ADMIN],
    },

    // Profile & Settings
    {
        id: 'profile',
        name: 'My Profile',
        description: 'View and edit your profile',
        route: '/profile',
        keywords: ['profile', 'account', 'settings', 'personal'],
        category: 'Settings',
        icon: '👤',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    },
    {
        id: 'calendar',
        name: 'Calendar',
        description: 'View calendar and events',
        route: '/calendar',
        keywords: ['calendar', 'events', 'schedule', 'dates'],
        category: 'Tools',
        icon: '📆',
        roles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    },
];
