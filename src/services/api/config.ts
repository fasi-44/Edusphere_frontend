/**
 * API Configuration
 * Centralized configuration for backend API connections
 */

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json',
    },
} as const;

/**
 * API Endpoints
 * Define all API routes used in the application
 */
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
    },
    INSTITUTIONS: {
        LIST: '/institutions',
        CREATE: '/institutions',
        GET_BY_ID: (id: string) => `/institutions/${id}`,
        UPDATE: (id: string) => `/institutions/${id}`,
        DELETE: (id: string) => `/institutions/${id}`,
    },
    USERS: {
        LIST: '/users',
        CREATE: '/users',
        GET_BY_ID: (id: string) => `/users/${id}`,
        UPDATE: (id: string) => `/users/${id}`,
        DELETE: (id: string) => `/users/${id}`,
    },
    STUDENTS: {
        LIST: '/students',
        CREATE: '/students',
        GET_BY_ID: (id: string) => `/students/${id}`,
        UPDATE: (id: string) => `/students/${id}`,
        DELETE: (id: string) => `/students/${id}`,
    },
    TEACHERS: {
        LIST: '/teachers',
        CREATE: '/teachers',
        GET_BY_ID: (id: string) => `/teachers/${id}`,
        UPDATE: (id: string) => `/teachers/${id}`,
    },
    CLASSES: {
        LIST: '/classes',
        LIST_BY_SCHOOL: (skid: string) => `/classes/list/${skid}`,
        SECTIONS: (skid: string, classId: number) => `/classes/sections/${skid}/${classId}`,
        CREATE: '/classes',
        GET_BY_ID: (id: string) => `/classes/${id}`,
        UPDATE: (id: string) => `/classes/${id}`,
    },
    SUBJECTS: {
        LIST: '/subjects',
        CREATE: '/subjects',
        GET_BY_ID: (id: string) => `/subjects/${id}`,
        UPDATE: (id: string) => `/subjects/${id}`,
    },
    ATTENDANCE: {
        LIST: '/attendance',
        CREATE: '/attendance',
        GET_BY_ID: (id: string) => `/attendance/${id}`,
    },
    EXAMS: {
        LIST: '/exams',
        CREATE: '/exams',
        GET_BY_ID: (id: string) => `/exams/${id}`,
    },
    MARKS: {
        LIST: '/marks',
        CREATE: '/marks',
        GET_BY_ID: (id: string) => `/marks/${id}`,
    },
    FEES: {
        LIST: '/fees',
        CREATE: '/fees',
        GET_BY_ID: (id: string) => `/fees/${id}`,
    },
    TIMETABLE: {
        LIST: '/timetable',
        CREATE: '/timetable',
        GET_BY_ID: (id: string) => `/timetable/${id}`,
    },
    PROGRESS_CARDS: {
        LIST: '/progress-cards',
        CREATE: '/progress-cards',
        GET_BY_ID: (id: string) => `/progress-cards/${id}`,
    },
    DASHBOARD: {
        SUPER_ADMIN_STATS: '/super-admin/stats',
        INSTITUTION_STATS: (skid: string) => `/schoolAdminDashboard/stats/${skid}`,
        INSTITUTION_ATTENDANCE_OVERVIEW: (skid: string) => `/schoolAdminDashboard/attendance-overview/${skid}`,
        INSTITUTION_FINANCE_SUMMARY: (skid: string) => `/schoolAdminDashboard/finance-summary/${skid}`,
        INSTITUTION_EXPENSE_BREAKDOWN: (skid: string) => `/schoolAdminDashboard/breakdown/monthly/${skid}`,
        INSTITUTION_TIMETABLE: (skid: string) => `/schoolAdminDashboard/timetable/${skid}`,
        // Teacher dashboard
        TEACHER_STUDENT_COUNT: (skid: string, teacherId: number) => `/teacherDashboard/students/teacher/count/${skid}/${teacherId}`,
        TEACHER_ABSENTEES: (skid: string, academicYearId: number, date: string) => `/teacherDashboard/attendance/absentees/count/${skid}/${academicYearId}/${date}`,
        TEACHER_DAY_TIMETABLE: (skid: string, teacherId: number, date: string) => `/teacherDashboard/timetable/teacher/${skid}/${teacherId}/${date}`,
        TEACHER_WEEK_TIMETABLE: (skid: string, teacherId: number) => `/teacherDashboard/timetable/teacher/week/${skid}/${teacherId}`,
        // Student dashboard
        STUDENT_DAY_TIMETABLE: (skid: string, studentId: number, date: string) => `/timeTable/student/${skid}/${studentId}/${date}`,
        // Legacy
        EDUCATOR_DASHBOARD: '/educator/dashboard',
        LEARNER_DASHBOARD: '/learner/dashboard',
        GUARDIAN_DASHBOARD: '/guardian/dashboard',
    },
    ANNOUNCEMENTS: {
        LIST: (skid: string) => `/announcements/list/${skid}`,
        CREATE: (skid: string) => `/announcements/create/${skid}`,
    },
    ACADEMIC_YEARS: {
        BASE: '/academic-years',
        CREATE: (skid: string) => `/academic-years/create/${skid}`,
        UPDATE: (skid: string, yearId: string) => `/academic-years/update/${skid}/${yearId}`,
        SET_CURRENT: (skid: string, yearId: string) => `/academic-years/patch/${skid}/${yearId}/set-current`,
    },
    STAFF: {
        CREATE: (skid: string) => `/staff/create/${skid}`,
        LIST: (skid: string) => `/staff/list/${skid}`,
    },
    BUS_SCAN: {
        SCAN: (skid: string) => `/bus-scan/scan/${skid}`,
        SCAN_QR: (skid: string) => `/bus-scan/scan-qr/${skid}`,
        TODAY: (skid: string) => `/bus-scan/today/${skid}`,
        STATUS: (skid: string) => `/bus-scan/status/${skid}`,
        STUDENT_HISTORY: (skid: string, studentUserId: number) =>
            `/bus-scan/student/${skid}/${studentUserId}`,
        SEARCH_STUDENTS: (skid: string) => `/bus-scan/search-students/${skid}`,
    },
    ASSIGNMENTS: {
        TEACHER_CLASSES: '/assignments/teacher-classes',
        CREATE: '/assignments/create',
        UPDATE: (assignmentId: number) => `/assignments/update/${assignmentId}`,
        LIST: '/assignments/list',
        GET_BY_ID: (assignmentId: number) => `/assignments/${assignmentId}`,
        UPDATE_SUBMISSIONS: (assignmentId: number) => `/assignments/${assignmentId}/submissions`,
        DELETE: (assignmentId: number) => `/assignments/${assignmentId}`,
    },
} as const;
