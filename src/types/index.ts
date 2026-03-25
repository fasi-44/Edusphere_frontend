/**
 * Global TypeScript Types & Interfaces
 * Centralized type definitions for the entire application
 */

// ============================================
// User & Authentication
// ============================================

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    SCHOOL_ADMIN = 'SCHOOL_ADMIN',
    PRINCIPAL = 'PRINCIPAL',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    PARENT = 'PARENT',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}

// String literal type for status comparisons (supports both uppercase enum and lowercase API values)
export type UserStatusString = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'active' | 'inactive' | 'suspended';

export interface IUser {
    id: string;
    name: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    email: string;
    phone?: string;
    role: UserRole;
    status: UserStatus | UserStatusString;
    avatar?: string;
    createdAt: string;
    created_at?: string; // Alias for createdAt (snake_case from API)
    updatedAt?: string;
    updated_at?: string; // Alias for updatedAt (snake_case from API)
    lastLogin?: string;
}

export interface IAuthState {
    user: IUser | null;
    token: string | null;
    refreshToken: string | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
}

// ============================================
// Common Data Types
// ============================================

export interface IPagination {
    page: number;
    pageSize: number;
    total: number;
}

export interface IApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: IPagination;
    errors?: Record<string, string[]>;
}

export interface IBreadcrumb {
    label: string;
    href?: string;
}

export interface IStatCard {
    title: string;
    value: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon?: React.ReactNode;
    trend?: number[];
    onClick?: () => void;
}

// ============================================
// School Management
// ============================================

export enum SchoolStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    ARCHIVED = 'ARCHIVED',
}

// Type alias to support both uppercase enum and lowercase literal values
export type SchoolStatusString = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'active' | 'inactive' | 'suspended' | 'archived';

export interface ISchool {
    id: string;
    name: string;
    code: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    website?: string;
    logo?: string;
    plan?: string;
    skid: string;
    status: SchoolStatus | SchoolStatusString;
    createdAt: string;
    updatedAt: string;
    created_at?: string;  // Alias for createdAt (snake_case from API)
    updated_at?: string;  // Alias for updatedAt (snake_case from API)
}

// ============================================
// Class Management
// ============================================

export interface IClass {
    id: string | number;
    name: string;
    class_name?: string; // Alias for name property
    section: string;
    classTeacherId: string;
    classTeacher?: IUser;
    totalStudents: number;
    academicYear: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
}

export interface ISection {
    id: number;
    section_name: string;
    class_id: number;
    teacher_name: string;
}

// ============================================
// Attendance
// ============================================

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LEAVE = 'LEAVE',
    LATE = 'LATE',
}

export interface IAttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
    markedAt: string;
    markedBy: string;
}

// ============================================
// Announcements
// ============================================

export enum AnnouncementPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export interface IAnnouncement {
    id: number;
    title: string;
    description?: string;
    announcement_type?: string;
    priority: AnnouncementPriority;
    created_by: number;
    creator_name?: string;
    target_audience: string;
    target_classes?: number[];
    target_sections?: number[];
    target_users?: number[];
    attachments?: string[];
    publish_date?: string;
    expiry_date?: string;
    created_at: string;
    academic_year_id: number;
    is_active: boolean;
    is_published?: boolean;
    updated_at: string;
}

// ============================================
// Timetable
// ============================================

export interface ITimeSlot {
    id: string;
    dayOfWeek: number; // 0-6 (Mon-Sun)
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    roomNumber?: string;
}

export interface ITimeSlotGenerated {
    label: string;           // e.g., "Period 1"
    time_display: string;    // e.g., "09:00 - 09:45"
    start_time: string;      // "09:00"
    end_time: string;        // "09:45"
    is_lunch: boolean;
}

export interface ITimetableConfiguration {
    period_duration: number;          // in minutes (30-90)
    school_start_time: string;        // HH:mm
    lunch_start_time: string;         // HH:mm
    lunch_duration: number;           // in minutes
    total_periods: number;            // 4-10
}

export interface ITimetableEntry {
    subject: ISubject;
    teacher: IUser;
    room: string;
    type: 'Regular' | 'Lab' | 'Tutorial' | 'Practical';
}

export interface ITeacherConflictDetail {
    teacher_name: string;
    day: string;
    start_time: string;
    end_time: string;
    class_name: string;
    section_name: string;
    subject_name: string;
}

export interface ITeacherConflict {
    has_conflict: boolean;
    conflict_count: number;
    message: string;
    conflicts: ITeacherConflictDetail[];
}

export interface IValidationResult {
    is_valid: boolean;
    validation_message: string;
    conflict_count: number;
    conflicts: any[];
}

export interface ITimetable {
    id: string;
    class_id: string;
    class_name: string;
    section_id: string;
    section_name: string;
    academic_year: string;
    academic_year_id: string;
    semester: number;
    configuration: ITimetableConfiguration;
    time_slots: ITimeSlotGenerated[];
    entries: Record<string, ITimetableEntry>; // key: "Monday-09:00 - 09:45"
    is_draft: boolean;
    classId?: string;  // Backwards compatibility
    academicYear?: string;  // Backwards compatibility
    timeSlots?: ITimeSlot[];  // Backwards compatibility
    createdAt: string;
    created_at: string;
    updated_at: string;
    updatedAt?: string;
}

// ============================================
// Exams
// ============================================

export enum ExamType {
    PERIODIC = 'PERIODIC',
    TERM_1 = 'TERM_1',
    TERM_2 = 'TERM_2',
    FINAL = 'FINAL',
    MOCK = 'MOCK',
}

export interface IExam {
    id: string;
    name: string;
    type: ExamType;
    description?: string;
    startDate: string;
    endDate: string;
    classIds: string[];
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
    publishResults: boolean;
    createdAt: string;
    exam_name?: string;
    exam_code?: string;
    exam_category?: string;
    sequence_order?: number;
}

// ============================================
// Syllabus Management
// ============================================

export enum SyllabusStatus {
    PLANNED = 'planned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
}

export interface ISubtopic {
    id: string;
    topic_id?: string;
    title: string;
    description?: string;
    estimated_duration_hours?: number;
    learning_objectives?: string;
    status: SyllabusStatus;
    planned_completion_date?: string;
    actual_completion_date?: string;
    actual_start_date?: string;
    actual_end_date?: string;
    planned_start_date?: string;
    planned_end_date?: string;
    teacher_notes?: string;
    is_completed: boolean;
    order_index?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ITopic {
    id: string;
    lesson_id?: string;
    title: string;
    description?: string;
    estimated_duration_hours?: number;
    status: SyllabusStatus;
    completion_percentage: number;
    planned_start_date?: string;
    planned_end_date?: string;
    actual_start_date?: string;
    actual_end_date?: string;
    teacher_notes?: string;
    order_index?: number;
    subtopics: ISubtopic[];
    created_at?: string;
    updated_at?: string;
}

export interface ILesson {
    id: string;
    title: string;
    description?: string;
    estimated_duration_hours?: number;
    lesson_notes?: string;
    teaching_method?: string;
    resources_url?: string;
    status: SyllabusStatus;
    completion_percentage: number;
    planned_start_date?: string;
    planned_end_date?: string;
    actual_start_date?: string;
    actual_end_date?: string;
    teacher_notes?: string;
    order_index?: number;
    topics: ITopic[];
    created_at?: string;
    updated_at?: string;
}

export interface ISyllabus {
    id: string;
    title: string;
    description?: string;
    subject_id: string;
    subject_name?: string;
    academic_year_id: string;
    academic_year_name?: string;
    creator_id?: string;
    creator_name?: string;
    estimated_duration_hours?: number;
    status: SyllabusStatus;
    completion_percentage: number;
    planned_start_date?: string;
    planned_end_date?: string;
    lessons: ILesson[];
    created_at?: string;
    updated_at?: string;
}

export interface ISyllabusFormData {
    subject_id: string;
    academic_year_id: string;
    title: string;
    description?: string;
    estimated_duration_hours?: number;
    status?: SyllabusStatus;
    planned_start_date?: string;
    planned_end_date?: string;
}

export interface ILessonFormData {
    title: string;
    description?: string;
    estimated_duration_hours?: number;
    lesson_notes?: string;
    teaching_method?: string;
    resources_url?: string;
    status?: SyllabusStatus;
    planned_start_date?: string;
    planned_end_date?: string;
}

export interface ITopicFormData {
    title: string;
    description?: string;
    estimated_duration_hours?: number;
    status?: SyllabusStatus;
    planned_start_date?: string;
    planned_end_date?: string;
}

export interface ISubtopicFormData {
    title: string;
    description?: string;
    estimated_duration_hours?: number;
    learning_objectives?: string;
    status?: SyllabusStatus;
    planned_completion_date?: string;
    is_completed?: boolean;
}

export interface ISyllabusAnalytics {
    total_lessons: number;
    lessons_completed: number;
    lessons_in_progress: number;
    lessons_planned: number;
    total_topics: number;
    topics_completed: number;
    topics_in_progress: number;
    topics_planned: number;
    total_subtopics: number;
    subtopics_completed: number;
    subtopics_in_progress: number;
    subtopics_planned: number;
    overall_completion_percentage: number;
    status_breakdown: {
        planned: number;
        in_progress: number;
        completed: number;
    };
    overdue_items: IOverdueItem[];
}

export interface IOverdueItem {
    id: string;
    title: string;
    type: 'lesson' | 'topic' | 'subtopic';
    status: SyllabusStatus;
    planned_end_date?: string;
    planned_completion_date?: string;
}

export interface ITeacherSectionInfo {
    section_id: number;
    section_name: string;
    class_id: number;
    class_name: string;
}

export interface ISyllabusTeacherProgress {
    teacher_id: number;
    teacher_name: string;
    completion_percentage: number;
    status: string;
    is_active: boolean;
    sections: ITeacherSectionInfo[];
}

export interface ITeacherSyllabusAssignment {
    id: number;
    syllabus_id: number;
    teacher_id: number;
    section_id: number;
    is_active: boolean;
    assigned_at: string | null;
    unassigned_at: string | null;
    teacher_name: string;
    section_name: string;
    class_id: number | null;
    class_name: string;
}

export interface IStudentSyllabusEntry {
    syllabus: ISyllabus;
    teacher_id: number;
    teacher_name: string;
    subject_id: number;
    subject_name: string;
    completion_percentage: number;
    status: string;
}

// ============================================
// Academics
// ============================================

export interface ISubject {
    id: string;
    name: string;
    subject_name: string;
    subject_code: string;
    grade_level: string;
    classId: string;
    teacherId: string;
    credits?: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
}

export interface IMarks {
    id: string;
    studentId: string;
    examId: string;
    subjectId: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade?: string;
    remarks?: string;
    recordedAt: string;
}

// ============================================
// Marks Entry (Exam Configuration & Entry)
// ============================================

export interface IExamConfig {
    id: string;
    exam_type_id: string;
    exam_name?: string;
    class_id: string;
    section_id?: string | null;
    subject_id: string;
    subject_name?: string;
    total_max_marks: number;
    min_passing_marks: number;
    has_internal_external: boolean;
    internal_max_marks?: number;
    external_max_marks?: number;
    created_at?: string;
}

export interface IStudentWithMarks {
    student_id: string;
    roll_no: string;
    student_name: string;
    existing_marks?: {
        internal_marks: number;
        external_marks: number;
        total_marks: number;
        is_absent: boolean;
        remarks: string;
    };
}

export interface IStudentMarkEntry {
    student_id: string;
    internal_marks: number;
    external_marks: number;
    total_marks: number;
    is_absent: boolean;
    remarks: string;
}

// ============================================
// Class Progress Report
// ============================================

export interface IClassStatistics {
    total_students: number;
    class_average: number;
    pass_count: number;
    pass_percentage: number;
    topper_name: string;
    topper_percentage: number;
}

export interface ISubjectAnalysis {
    subject_id: string;
    subject_name: string;
    subject_code: string;
    max_marks: number;
    average_marks: number;
    highest_marks: number;
    lowest_marks: number;
    pass_percentage: number;
}

export interface IStudentProgress {
    student_id: string;
    rank: number;
    roll_number: string;
    student_name: string;
    total_marks: number;
    max_marks: number;
    percentage: number;
    grade: string;
    status: 'Pass' | 'Fail';
}

// ============================================
// Individual Progress Card
// ============================================

export interface IProgressCardSubject {
    subject_id: string;
    subject_name: string;
    subject_code: string;
    has_internal_external: boolean;
    internal_marks: number;
    external_marks: number;
    total_marks: number;
    max_marks: number;
    percentage: number;
    grade: string;
    is_absent: boolean;
    remarks: string;
}

export interface IProgressCardAttendance {
    present_days: number;
    total_days: number;
    percentage: number;
}

export interface IProgressCard {
    student_name: string;
    roll_number: string;
    class_name: string;
    section_name: string;
    exam_name: string;
    overall_total_marks: number;
    overall_max_marks: number;
    overall_percentage: number;
    overall_grade: string;
    rank: number;
    total_students: number;
    subject_details: IProgressCardSubject[];
    attendance?: IProgressCardAttendance;
    class_teacher_remarks?: string;
    class_teacher_name?: string;
}

// ============================================
// Fee Structure
// ============================================

export interface IFeeRow {
    id?: number;
    fee_id?: number;
    fee_name: string;
    amount: number;
    is_mandatory: boolean;
    description?: string;
    is_recurring: boolean;
    recurrence_type: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    recurrence_amount: number;
    recurrence_months: number;
    allows_installments: boolean;
    is_active?: boolean;
}

export interface IGroupedFeeStructure {
    class_id: number;
    class_name: string;
    academic_year?: any;
    fees: IFeeRow[];
    total_amount: number;
    fee_count: number;
}

// ============================================
// Fee Collection
// ============================================

export interface IStudentFee {
    id: number;
    fee_structure: IFeeRow & { id: number };
    fee_name?: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    discount_amount?: number;
    status: string; // PAID, PARTIAL, PENDING, OVERDUE
    has_installments: boolean;
    receipt_number?: string; // For full payment (non-installment) receipts
    payment_date?: string;
    payment_mode?: string;
    transaction_id?: string;
    cheque_number?: string;
    bank_name?: string;
    remarks?: string;
}

export interface IStudentFeeSummary {
    student: any;
    fees: IStudentFee[];
    total_amount: number;
    total_paid: number;
    total_discount: number;
    total_balance: number;
    balance?: number;
}

export interface IInstallment {
    id: number;
    installment_name: string;
    installment_number: number;
    amount: number;
    paid_amount: number;
    balance_amount: number;
    due_date: string;
    status: string; // PAID, PARTIAL, PENDING, CANCELLED
    receipt_number?: string; // Set when payment is made
    payment_date?: string; // Actual payment date
    payment_mode?: string; // CASH, CHEQUE, ONLINE, etc.
    transaction_id?: string;
    cheque_number?: string;
    bank_name?: string;
    remarks?: string;
    updated_at?: string; // Timestamp
}

export interface IPaymentData {
    amount_paid: number;
    payment_mode: string;
    payment_date: string;
    transaction_id?: string;
    cheque_number?: string;
    bank_name?: string;
    remarks?: string;
}

export interface IPaymentRecord {
    id: number;
    receipt_number: string;
    amount_paid: number;
    payment_mode: string;
    payment_date: string;
    transaction_id?: string;
    cheque_number?: string;
    bank_name?: string;
    remarks?: string;
}

// ============================================
// Expenses
// ============================================

export interface IExpenseRecord {
    id: number;
    expense_category: string;
    expense_date: string;
    amount: number;
    vendor_name?: string;
    description?: string;
    payment_method: string;
    receipt_attachment_url?: string;
    approval_status: string;
    reference_type?: string;
    created_by?: number;
    academic_year_id?: number;
}

export interface IExpenseFormData {
    expense_category: string;
    expense_date: string;
    amount: number | string;
    vendor_name: string;
    description: string;
    payment_method: string;
    receipt_attachment_url: string;
}

// ============================================
// Salary
// ============================================

export interface ISalaryAllowances {
    hra: number | string;
    da: number | string;
    transport: number | string;
}

export interface ISalaryDeductions {
    pf: number | string;
    tax: number | string;
}

export interface ISalarySetup {
    id: number;
    staff_id: number;
    staff_name: string;
    employee_id?: string;
    basic_salary: number;
    allowances: ISalaryAllowances;
    deductions: ISalaryDeductions;
    gross_salary: number;
    net_salary: number;
    effective_from: string;
    is_active: boolean;
    academic_year_id?: number;
}

export interface ISalaryPayment {
    id: number;
    staff_name: string;
    staff_id: number;
    employee_id?: string;
    payment_month: number;
    payment_year: number;
    basic_salary: number;
    allowances_paid: ISalaryAllowances;
    deductions_applied: ISalaryDeductions;
    net_amount_paid: number;
    payment_date?: string;
    payment_method?: string;
    transaction_reference?: string;
    status: string; // pending, paid, cancelled
    paid_by?: number;
}

export interface ISalaryPaymentForm {
    payment_date: string;
    payment_method: string;
    transaction_reference: string;
}

// ============================================
// UI Component Props
// ============================================

export interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export interface IBadgeProps {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
    size?: 'sm' | 'md' | 'lg';
    children?: React.ReactNode;
    text?: string; // Alternative to children
    className?: string;
}

export interface ITagProps {
    label: string;
    onRemove?: () => void;
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
    className?: string;
}

export interface IFormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    help?: string;
    children: React.ReactNode;
    className?: string;
}

export interface IPageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: IBreadcrumb[];
    actions?: React.ReactNode;
    className?: string;
}

export interface IFilterBarProps {
    filters: IFilter[];
    onApply: (filters: Record<string, any>) => void;
    onReset: () => void;
    loading?: boolean;
}

export interface IFilter {
    name: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'daterange' | 'number';
    placeholder?: string;
    options?: Array<{ label: string; value: string | number }>;
}

// ============================================
// Table Component Types
// ============================================

export interface IColumn<T> {
    key: keyof T | string;
    label: string;
    width?: string | number;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, row: T, index: number) => React.ReactNode;
    className?: string;
}

export interface IDataTableProps<T> {
    columns: IColumn<T>[];
    data: T[];
    loading?: boolean;
    error?: string;
    selectable?: boolean;
    selectedRows?: string[];
    onSelectionChange?: (selected: T[]) => void;
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        onPageChange: (page: number) => void;
        onPageSizeChange?: (pageSize: number) => void;
    };
    actions?: (row: T) => React.ReactNode;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    className?: string;
    striped?: boolean;
    hover?: boolean;
}

// ============================================
// Modal/Dialog Types
// ============================================

export interface IModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
    className?: string;
    closeButton?: boolean;
}

export interface IConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger' | 'success';
    isDangerous?: boolean; // Alias for type="danger"
    isLoading?: boolean;
}

// ============================================
// Redux Store State
// ============================================

export interface IStore {
    auth: IAuthState;
    ui: IUIState;
    users: IUsersState;
    classes: IClassesState;
    attendance: IAttendanceState;
    announcements: IAnnouncementsState;
    timetable: ITimetableState;
    exams: IExamsState;
    academics: IAcademicsState;
    fees: IFeesState;
    expenses: IExpensesState;
}

export interface IUIState {
    sidebar: {
        isExpanded: boolean;
        isHovered: boolean;
        isMobileOpen: boolean;
    };
    theme: 'light' | 'dark';
    notifications: INotification[];
}

export interface INotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

export interface IUsersState {
    items: IUser[];
    selectedItem: IUser | null;
    loading: boolean;
    error: string | null;
    filters: Record<string, any>;
    pagination: IPagination;
}

export interface IClassesState {
    items: IClass[];
    selectedItem: IClass | null;
    loading: boolean;
    error: string | null;
    filters: Record<string, any>;
    pagination: IPagination;
}

export interface IAttendanceState {
    records: IAttendanceRecord[];
    loading: boolean;
    error: string | null;
    filters: Record<string, any>;
}

export interface IAnnouncementsState {
    items: IAnnouncement[];
    selectedItem: IAnnouncement | null;
    loading: boolean;
    error: string | null;
    filters: Record<string, any>;
    pagination: IPagination;
}

export interface ITimetableState {
    items: ITimetable[];
    loading: boolean;
    error: string | null;
}

export interface IExamsState {
    items: IExam[];
    selectedItem: IExam | null;
    loading: boolean;
    error: string | null;
    filters: Record<string, any>;
    pagination: IPagination;
}

export interface IAcademicsState {
    subjects: ISubject[];
    marks: IMarks[];
    loading: boolean;
    error: string | null;
}

export interface IFeesState {
    items: IGroupedFeeStructure[];
    loading: boolean;
    error: string | null;
    filters: Record<string, any>;
    pagination: IPagination;
}

export interface IExpensesState {
    items: IExpenseRecord[];
    loading: boolean;
    error: string | null;
    filters: Record<string, any>;
    pagination: IPagination;
}

// ============================================
// Assignments
// ============================================

export interface IAssignment {
    id: number;
    teacher_id: number;
    class_id: number;
    section_id: number;
    subject_id: number;
    academic_year_id: number;
    assignment_text: string;
    assignment_drawing?: string;
    assignment_date: string;
    is_active: boolean;
    class_name?: string;
    section_name?: string;
    subject_name?: string;
    teacher_name?: string;
    is_completed?: boolean;
    remarks?: string;
    created_at: string;
    updated_at?: string;
    completion_stats?: {
        total: number;
        completed: number;
        pending: number;
    };
}

export interface IAssignmentSubmission {
    student_id: number;
    student_name: string;
    roll_no: string;
    is_completed: boolean;
    remarks: string;
}

export interface ITeacherClassSubject {
    class_id: number;
    class_name: string;
    section_id: number;
    section_name: string;
    subject_id: number;
    subject_name: string;
}
