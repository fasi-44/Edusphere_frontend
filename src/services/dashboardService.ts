/**
 * Dashboard Service
 * API calls for school admin / principal dashboard
 */

import { getApiClient } from './api/client';
import { API_ENDPOINTS } from './api/config';

// ============================================
// Types
// ============================================

export interface DashboardStats {
    academic_year: { id: number; year_name: string };
    stats: {
        students_count: number;
        male_students: number;
        female_students: number;
        teachers_count: number;
        parents_count: number;
        overall_users_count: number;
        today_attendance_present: number;
        today_attendance_total_students: number;
    };
}

export interface AttendanceDay {
    day: string;
    date: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
}

export interface AttendanceOverview {
    total_students: number;
    weekly_trend: AttendanceDay[];
    today_present: number;
    today_absent: number;
    today_total_marked: number;
    today_percentage: number;
}

export interface FinanceSummary {
    total_fees: number;
    total_collected: number;
    total_pending: number;
    total_discount: number;
    total_expenses: number;
    collection_rate: number;
    status_breakdown: {
        paid: number;
        partial: number;
        pending: number;
        overdue: number;
    };
    recent_payments: Array<{
        id: number;
        student_name: string;
        amount: number;
        payment_mode: string;
        payment_date: string | null;
        receipt_number: string;
    }>;
}

export interface ExpenseBreakdown {
    month: number;
    year: number;
    month_name: string;
    total_expenses: number;
    categories: string[];
    dates: Array<{ date: string; day: number }>;
    category_data: Record<string, Array<{ date: string; day: number; amount: number }>>;
    category_totals: Record<string, number>;
}

export interface AnnouncementItem {
    id: number;
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    announcement_type: string;
    creator_name: string;
    created_at?: string;
}

export interface TimetableData {
    timetable: {
        id: number;
        class_id: number;
        class_name: string;
        section_id: number;
        section_name: string;
        total_periods: number;
        period_duration: number;
        school_start_time: string;
        lunch_start_time: string;
        lunch_duration: number;
    } | null;
    entries: Array<{
        id: number;
        day_of_week: string;
        period_number: number;
        start_time: string;
        end_time: string;
        subject_name: string;
        teacher_name: string;
        room_number: string;
        class_type: string;
    }>;
    timetable_by_day: Record<string, Array<{
        period_number: number;
        subject_name: string;
        teacher_name: string;
        room_number?: string;
    }>>;
}

export interface TeacherTimetablePeriod {
    period_number: number;
    start_time: string;
    end_time: string;
    subject_name: string;
    class_name: string;
    section_name: string;
    room: string;
    day: string;
}

export interface TeacherWeekTimetable {
    week_start: string;
    timetable_by_day: Record<string, TeacherTimetablePeriod[]>;
}

export interface AbsenteesData {
    count: number;
    date: string;
    preview: Array<{
        student_id: number;
        full_name: string;
        roll_no: string;
        class_name: string;
        section_name: string;
        remarks: string;
    }>;
}

export interface StudentTimetablePeriod {
    id?: number;
    period_number: number;
    start_time: string;
    end_time: string;
    subject_name: string;
    teacher_name: string;
    room?: string;
    day?: string;
}

export interface ClassItem {
    id: number;
    class_name: string;
}

export interface SectionItem {
    id: number;
    section_name: string;
}

// ============================================
// API Calls
// ============================================

const dashboardService = {
    /**
     * Get dashboard stats (students, teachers, parents, attendance)
     */
    getStats: async (skid: string, academicYearId: number): Promise<DashboardStats> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.INSTITUTION_STATS(skid),
            { params: { academic_year_id: academicYearId } }
        );
        if (response.code === 200) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch stats');
    },

    /**
     * Get weekly attendance overview, optionally filtered by class/section
     */
    getAttendanceOverview: async (
        skid: string,
        academicYearId: number,
        classId?: number,
        sectionId?: number
    ): Promise<AttendanceOverview> => {
        const client = getApiClient();
        const params: Record<string, any> = { academic_year_id: academicYearId };
        if (classId) params.class_id = classId;
        if (sectionId) params.section_id = sectionId;

        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.INSTITUTION_ATTENDANCE_OVERVIEW(skid),
            { params }
        );
        if (response.code === 200) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch attendance overview');
    },

    /**
     * Get finance summary (fees, collections, expenses)
     */
    getFinanceSummary: async (skid: string, academicYearId: number): Promise<FinanceSummary> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.INSTITUTION_FINANCE_SUMMARY(skid),
            { params: { academic_year_id: academicYearId } }
        );
        if (response.code === 200) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch finance summary');
    },

    /**
     * Get monthly expense breakdown by category
     */
    getExpenseBreakdown: async (skid: string, academicYearId: number, month: number): Promise<ExpenseBreakdown> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.INSTITUTION_EXPENSE_BREAKDOWN(skid),
            { params: { academic_year_id: academicYearId, month } }
        );
        if (response.code === 200 || response.status === 'success') {
            return response.breakdown || response.data;
        }
        throw new Error(response.message || 'Failed to fetch expense breakdown');
    },

    /**
     * Get announcements list
     */
    getAnnouncements: async (
        skid: string,
        academicYearId: number,
        userRole: string,
        schoolUserId: number
    ): Promise<AnnouncementItem[]> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.ANNOUNCEMENTS.LIST(skid),
            {
                params: {
                    academic_year_id: academicYearId,
                    user_role: userRole,
                    school_user_id: schoolUserId,
                },
            }
        );
        if (response.code === 200) {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to fetch announcements');
    },

    /**
     * Get timetable for a class/section
     */
    getTimetable: async (
        skid: string,
        academicYearId: number,
        classId?: number,
        sectionId?: number
    ): Promise<TimetableData> => {
        const client = getApiClient();
        const params: Record<string, any> = { academic_year_id: academicYearId };
        if (classId) params.class_id = classId;
        if (sectionId) params.section_id = sectionId;

        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.INSTITUTION_TIMETABLE(skid),
            { params }
        );
        if (response.code === 200) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch timetable');
    },

    /**
     * Get classes list for a school
     */
    getClasses: async (skid: string): Promise<ClassItem[]> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.CLASSES.LIST_BY_SCHOOL(skid)
        );
        if (response.code === 200) {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to fetch classes');
    },

    /**
     * Get sections for a class
     */
    getSections: async (skid: string, classId: number): Promise<SectionItem[]> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.CLASSES.SECTIONS(skid, classId)
        );
        if (response.code === 200) {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to fetch sections');
    },

    // ============================================
    // Teacher Dashboard APIs
    // ============================================

    /**
     * Get count of students assigned to a teacher
     */
    getTeacherStudentCount: async (skid: string, teacherId: number): Promise<number> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.TEACHER_STUDENT_COUNT(skid, teacherId)
        );
        if (response.code === 200) {
            return response.data?.count ?? 0;
        }
        throw new Error(response.message || 'Failed to fetch student count');
    },

    /**
     * Get today's absentees count and preview
     */
    getTeacherAbsentees: async (skid: string, academicYearId: number, date: string): Promise<AbsenteesData> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.TEACHER_ABSENTEES(skid, academicYearId, date)
        );
        if (response.code === 200) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch absentees');
    },

    /**
     * Get teacher's timetable for a specific day
     */
    getTeacherDayTimetable: async (skid: string, teacherId: number, date: string): Promise<TeacherTimetablePeriod[]> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.TEACHER_DAY_TIMETABLE(skid, teacherId, date)
        );
        if (response.code === 200) {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to fetch day timetable');
    },

    /**
     * Get teacher's full week timetable
     */
    getTeacherWeekTimetable: async (skid: string, teacherId: number, startDate?: string): Promise<TeacherWeekTimetable> => {
        const client = getApiClient();
        const params: Record<string, any> = {};
        if (startDate) params.start_date = startDate;

        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.TEACHER_WEEK_TIMETABLE(skid, teacherId),
            { params }
        );
        if (response.code === 200) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch week timetable');
    },

    // ============================================
    // Student Dashboard APIs
    // ============================================

    /**
     * Get student's timetable for a specific day
     */
    getStudentDayTimetable: async (skid: string, studentId: number, date: string): Promise<StudentTimetablePeriod[]> => {
        const client = getApiClient();
        const response: any = await client.get(
            API_ENDPOINTS.DASHBOARD.STUDENT_DAY_TIMETABLE(skid, studentId, date)
        );
        if (response.code === 200) {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to fetch student timetable');
    },
};

export default dashboardService;
