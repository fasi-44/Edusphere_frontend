/**
 * SeatingArrangement — shared TypeScript types
 */

export interface IClassAssignment {
    class_id: number;
    section_id?: number;
    columns: number[]; // absolute column numbers assigned to this class
}

export interface IClassAssignmentDetail extends IClassAssignment {
    class_name: string;
    section_name: string; // 'All Sections' if no section
}

export interface IRoomLayout {
    name: string;
    rows: number;
    columns: number;
}

export interface IRoom {
    id: number;
    room_name: string;
    capacity: number;
    building?: string;
    floor?: number | null;
    seating_layout: IRoomLayout[];
}

export interface ISeatingPlan {
    id: number;
    config_id: number;
    student_id: number;
    seat_row: number;
    seat_column: number;
    seat_label: string;
    student_name: string;
    roll_no?: string;
    class_id?: number;
    section_id?: number;
    class_name?: string;
    section_name?: string;
}

export interface ISeatingConfig {
    id: number;
    academic_year_id: number;
    exam_type_id: number;
    room_id: number;
    class_assignments: IClassAssignment[];
    exam_date: string;
    start_time: string;
    end_time: string;
    invigilator_id?: number | null;
    is_generated: boolean;
    notes?: string;
    // Enriched
    room?: IRoom;
    exam_type_name?: string;
    invigilator_name?: string | null;
    class_assignment_details?: IClassAssignmentDetail[];
    student_count?: number;
    seating_grid?: ISeatingPlan[];
}

export interface IFormClassAssignment {
    class_id: string;
    section_id: string;
    columns: number[];
}

export interface IFormData {
    exam_type_id: string;
    room_id: string;
    invigilator_id: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    notes: string;
    class_assignments: IFormClassAssignment[];
}

export const INITIAL_FORM: IFormData = {
    exam_type_id: '',
    room_id: '',
    invigilator_id: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    notes: '',
    class_assignments: [{ class_id: '', section_id: '', columns: [] }],
};

/** Colors for class assignment rows — index maps to class assignment position */
export const CLASS_COLORS = [
    { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-500' },
    { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-400', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-500' },
    { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-500' },
    { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-500' },
    { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-400', text: 'text-pink-700 dark:text-pink-300', badge: 'bg-pink-500' },
    { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-500' },
];
