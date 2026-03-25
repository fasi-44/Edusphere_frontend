/**
 * Print Module Types
 * TypeScript interfaces for PDF generation across the application
 */

// ============================================
// School Data (passed to all report headers)
// ============================================

export interface SchoolData {
    schoolName: string;
    schoolAddress: string;
    schoolPhone: string;
    schoolEmail: string;
    logo?: string | null; // Base64 image or URL
    generatedBy?: string;
}

// ============================================
// PDF Action Types
// ============================================

export type PdfAction = 'download' | 'print' | 'open';

// ============================================
// Signature Configuration
// ============================================

export interface SignatureConfig {
    label: string;
    position: 'left' | 'center' | 'right';
}

// ============================================
// Attendance Report Types
// ============================================

export interface AttendanceStudent {
    roll_no: string;
    name: string;
}

export interface SingleDayRecord {
    student: AttendanceStudent;
    status: string;
    remarks?: string;
}

export interface SingleDayStatistics {
    total_students: number;
    present: number;
    absent: number;
    late: number;
    attendance_rate: number;
}

export interface SingleDayReportData {
    type: 'single';
    date: string;
    className: string;
    sectionName: string;
    records: SingleDayRecord[];
    statistics: SingleDayStatistics;
}

export interface DailyAttendance {
    status: string;
    remarks?: string;
    date?: string;
}

export interface MonthlyStudentSummary {
    total_days: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    leave_count?: number;
    attendance_percentage: number;
}

export interface MonthlyStudentRecord {
    student: AttendanceStudent;
    daily_attendance: DailyAttendance[];
    summary: MonthlyStudentSummary;
}

export interface MonthlyOverallSummary {
    total_students: number;
    total_days: number;
    total_present: number;
    overall_attendance_rate: number;
}

export interface MonthlyRecords {
    students: MonthlyStudentRecord[];
    dates: string[];
    summary: MonthlyOverallSummary;
}

export interface MonthlyReportData {
    type: 'monthly';
    startDate: string;
    endDate: string;
    className: string;
    sectionName: string;
    records: MonthlyRecords;
}

export type AttendanceReportData = SingleDayReportData | MonthlyReportData;

// ============================================
// Timetable Report Types
// ============================================

export interface TimetableTimeSlot {
    label: string;
    time_display: string;
    start_time: string;
    end_time: string;
    is_lunch: boolean;
}

export interface TimetableEntrySubject {
    subject_name: string;
    subject_code: string;
}

export interface TimetableEntryTeacher {
    name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
}

export interface TimetableEntry {
    subject: TimetableEntrySubject;
    teacher: TimetableEntryTeacher;
    room?: string;
    type?: string;
}

export interface TimetableConfiguration {
    period_duration: number;
    school_start_time: string;
    lunch_start_time: string;
    lunch_duration: number;
    total_periods: number;
}

export interface TimetableReportData {
    className: string;
    sectionName: string;
    academicYear: string;
    semester: number;
    configuration: TimetableConfiguration;
    timeSlots: TimetableTimeSlot[];
    entries: Record<string, TimetableEntry>;
    isDraft: boolean;
}
