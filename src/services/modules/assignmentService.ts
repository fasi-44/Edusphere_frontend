import { getApiClient, getSchoolId } from '../api/client';
import { IAssignment, IAssignmentSubmission, ITeacherClassSubject } from '../../types/index';

class AssignmentService {
    private baseUrl = '/assignments';

    /**
     * Get the class/section/subject combos assigned to a teacher via timetable.
     */
    async getTeacherClassSubjects(teacherId: number): Promise<ITeacherClassSubject[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response: any = await api.get(`${this.baseUrl}/teacher-classes/${schoolId}`, {
            params: { teacher_id: teacherId },
        });
        return response.data || [];
    }

    /**
     * Create a new assignment.
     */
    async create(data: {
        teacher_id: number;
        class_id: number;
        section_id: number;
        subject_id: number;
        academic_year_id: number;
        assignment_text?: string;
        assignment_drawing?: string;
        assignment_date: string;
    }): Promise<IAssignment> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response: any = await api.post(`${this.baseUrl}/create/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to create assignment');
    }

    /**
     * Update an existing assignment.
     */
    async update(assignmentId: number, data: { assignment_text?: string; assignment_drawing?: string }): Promise<IAssignment> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response: any = await api.put(`${this.baseUrl}/update/${assignmentId}/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update assignment');
    }

    /**
     * List assignments by date for a teacher.
     */
    async listByDate(
        teacherId: number,
        date: string,
        academicYearId: number
    ): Promise<IAssignment[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response: any = await api.get(`${this.baseUrl}/list/${schoolId}`, {
            params: {
                teacher_id: teacherId,
                date,
                academic_year_id: academicYearId,
            },
        });
        return response.data || [];
    }

    /**
     * Get assignment details with student list and submission status.
     */
    async getWithStudents(assignmentId: number): Promise<IAssignment & { students: IAssignmentSubmission[] }> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response: any = await api.get(`${this.baseUrl}/${assignmentId}/${schoolId}`);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch assignment');
    }

    /**
     * Bulk update student submission status and remarks.
     */
    async updateSubmissions(
        assignmentId: number,
        submissions: Array<{
            student_id: number;
            is_completed: boolean;
            remarks: string;
        }>,
        reviewerId: number
    ): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response: any = await api.post(
            `${this.baseUrl}/${assignmentId}/submissions/${schoolId}`,
            {
                submissions,
                reviewer_id: reviewerId,
            }
        );
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to update submissions');
        }
    }

    /**
     * Get assignments for a student based on their class/section.
     */
    async getStudentAssignments(
        studentId: number,
        academicYearId: number,
        date?: string
    ): Promise<IAssignment[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const params: any = {
            student_id: studentId,
            academic_year_id: academicYearId,
        };
        if (date) params.date = date;

        const response: any = await api.get(`${this.baseUrl}/student/${schoolId}`, { params });
        return response.data || [];
    }

    /**
     * Soft delete an assignment.
     */
    async delete(assignmentId: number): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response: any = await api.delete(`${this.baseUrl}/${assignmentId}/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete assignment');
        }
    }
}

export const assignmentService = new AssignmentService();
