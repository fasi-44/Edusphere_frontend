import { getApiClient, getSchoolId } from '../api/client';
import {
    ISyllabus,
    ISyllabusFormData,
    ILesson,
    ILessonFormData,
    ITopic,
    ITopicFormData,
    ISubtopic,
    ISubtopicFormData,
    ISyllabusAnalytics,
    IStudentSyllabusEntry,
    ISyllabusTeacherProgress,
} from '../../types/index';

interface ApiResponse<T = any> {
    code?: string | number;
    message?: string;
    status?: string;
    data?: T;
    [key: string]: any;
}

class SyllabusService {
    private baseUrl = '/syllabus';

    // ============== SYLLABUS OPERATIONS ==============

    // Get all syllabi for the school (Admin/Principal view)
    async fetchAllSyllabi(academicYearId: string): Promise<ISyllabus[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `${this.baseUrl}/get/list/${schoolId}?academic_year_id=${academicYearId}`
        );
        return response.data || [];
    }

    // Get syllabi assigned to a specific teacher
    async fetchSyllabiByTeacher(teacherId: string, academicYearId: string): Promise<ISyllabus[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `${this.baseUrl}/list/teacher/${schoolId}/${teacherId}?academic_year_id=${academicYearId}`
        );
        return response.data || [];
    }

    // Get syllabi for a specific subject
    async fetchSyllabiBySubject(subjectId: string, academicYearId: string): Promise<ISyllabus[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `${this.baseUrl}/list/subject/${schoolId}/${subjectId}?academic_year_id=${academicYearId}`
        );
        return response.data || [];
    }

    // Get syllabus detail with full hierarchy (lessons -> topics -> subtopics)
    async fetchSyllabusDetail(
        syllabusId: string,
        includeHierarchy: boolean = true,
        teacherId?: number | 'combined',
        teacherIds?: number[]
    ): Promise<ISyllabus> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        let url = `${this.baseUrl}/get/${schoolId}/${syllabusId}?include_hierarchy=${includeHierarchy}`;
        if (teacherId !== undefined && teacherId !== null) {
            url += `&teacher_id=${teacherId}`;
        }
        if (teacherId === 'combined' && teacherIds && teacherIds.length > 0) {
            url += `&teacher_ids=${teacherIds.join(',')}`;
        }

        const response = await api.get(url);
        return response.data || response;
    }

    // Get teachers assigned to a syllabus's subject with their progress
    async fetchTeachersForSyllabus(syllabusId: string): Promise<ISyllabusTeacherProgress[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `${this.baseUrl}/teachers-for-syllabus/${schoolId}/${syllabusId}`
        );
        return response.data || [];
    }

    // Create a new syllabus
    async createSyllabus(data: ISyllabusFormData): Promise<ISyllabus> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/${schoolId}`, data) as ApiResponse<ISyllabus>;
        if (response.code === 200 || response.status === 'success') {
            return response.data as ISyllabus;
        }
        throw new Error(response.message || 'Failed to create syllabus');
    }

    // Update an existing syllabus
    async updateSyllabus(syllabusId: string, data: Partial<ISyllabusFormData>): Promise<ISyllabus> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/${schoolId}/${syllabusId}`, data) as ApiResponse<ISyllabus>;
        if (response.code === 200 || response.status === 'success') {
            return response.data as ISyllabus;
        }
        throw new Error(response.message || 'Failed to update syllabus');
    }

    // Delete a syllabus
    async deleteSyllabus(syllabusId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/${schoolId}/${syllabusId}`) as ApiResponse;
        if (response.code !== 200 && response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete syllabus');
        }
    }

    // ============== LESSON OPERATIONS ==============

    // Create a new lesson under a syllabus
    async createLesson(syllabusId: string, data: ILessonFormData): Promise<ILesson> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(
            `${this.baseUrl}/lesson/create/${schoolId}/${syllabusId}`,
            data
        ) as ApiResponse<ILesson>;
        if (response.code === 200 || response.status === 'success') {
            return response.data as ILesson;
        }
        throw new Error(response.message || 'Failed to create lesson');
    }

    // Update an existing lesson
    async updateLesson(lessonId: string, data: Partial<ILessonFormData>): Promise<ILesson> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(
            `${this.baseUrl}/lesson/update/${schoolId}/${lessonId}`,
            data
        ) as ApiResponse<ILesson>;
        if (response.code === 200 || response.status === 'success') {
            return response.data as ILesson;
        }
        throw new Error(response.message || 'Failed to update lesson');
    }

    // Delete a lesson
    async deleteLesson(lessonId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/lesson/delete/${schoolId}/${lessonId}`) as ApiResponse;
        if (response.code !== 200 && response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete lesson');
        }
    }

    // ============== TOPIC OPERATIONS ==============

    // Create a new topic under a lesson
    async createTopic(lessonId: string, data: ITopicFormData): Promise<ITopic> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(
            `${this.baseUrl}/topic/create/${schoolId}/${lessonId}`,
            data
        ) as ApiResponse<ITopic>;
        if (response.code === 200 || response.status === 'success') {
            return response.data as ITopic;
        }
        throw new Error(response.message || 'Failed to create topic');
    }

    // Update an existing topic
    async updateTopic(topicId: string, data: Partial<ITopicFormData>): Promise<ITopic> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(
            `${this.baseUrl}/topic/update/${schoolId}/${topicId}`,
            data
        ) as ApiResponse<ITopic>;
        if (response.code === 200 || response.status === 'success') {
            return response.data as ITopic;
        }
        throw new Error(response.message || 'Failed to update topic');
    }

    // Delete a topic
    async deleteTopic(topicId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/topic/delete/${schoolId}/${topicId}`) as ApiResponse;
        if (response.code !== 200 && response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete topic');
        }
    }

    // ============== SUBTOPIC OPERATIONS ==============

    // Create a new subtopic under a topic
    async createSubtopic(topicId: string, data: ISubtopicFormData): Promise<ISubtopic> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(
            `${this.baseUrl}/subtopic/create/${schoolId}/${topicId}`,
            data
        ) as ApiResponse<ISubtopic>;
        if (response.code === 200 || response.status === 'success') {
            return response.data as ISubtopic;
        }
        throw new Error(response.message || 'Failed to create subtopic');
    }

    // Update an existing subtopic
    async updateSubtopic(subtopicId: string, data: Partial<ISubtopicFormData>): Promise<ISubtopic> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(
            `${this.baseUrl}/subtopic/update/${schoolId}/${subtopicId}`,
            data
        ) as ApiResponse<ISubtopic>;
        if (response.code === 200 || response.status === 'success') {
            return response.data as ISubtopic;
        }
        throw new Error(response.message || 'Failed to update subtopic');
    }

    // Delete a subtopic
    async deleteSubtopic(subtopicId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/subtopic/delete/${schoolId}/${subtopicId}`) as ApiResponse;
        if (response.code !== 200 && response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete subtopic');
        }
    }

    // ============== ANALYTICS OPERATIONS ==============

    // Get analytics for a specific syllabus
    async fetchSyllabusAnalytics(syllabusId: string): Promise<ISyllabusAnalytics> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/analytics/${schoolId}/${syllabusId}`);
        return response.data || response;
    }

    // Get progress summary for a teacher
    async fetchTeacherProgressSummary(teacherId: string, academicYearId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `${this.baseUrl}/analytics/teacher/${schoolId}/${teacherId}?academic_year_id=${academicYearId}`
        );
        return response.data || response;
    }

    // ============== TIMELINE CONFIGURATION ==============

    // Configure planned dates and notes for a syllabus item
    async configureTimeline(
        itemType: string,
        itemId: string,
        data: { planned_start_date: string; planned_end_date: string; teacher_notes?: string }
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/progress/configure/${schoolId}`, {
            item_type: itemType,
            item_id: itemId,
            ...data,
        }) as ApiResponse;
        if (response.code === 200 || response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to configure timeline');
    }

    // Start teaching a syllabus item (must be configured first)
    async startItem(itemType: string, itemId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/progress/start/${schoolId}`, {
            item_type: itemType,
            item_id: itemId,
        }) as ApiResponse;
        if (response.code === 200 || response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to start item');
    }

    // ============== PROGRESS MARKING ==============

    // Mark a syllabus item as complete/incomplete (teacher only)
    async markProgress(itemType: string, itemId: string, isCompleted: boolean): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/progress/mark/${schoolId}`, {
            item_type: itemType,
            item_id: itemId,
            is_completed: isCompleted,
        }) as ApiResponse;
        if (response.code === 200 || response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to mark progress');
    }

    // ============== STUDENT VIEW ==============

    // Get student's syllabus progress overview
    async fetchStudentSyllabusView(academicYearId: string, studentUserId?: string): Promise<IStudentSyllabusEntry[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        let url = `${this.baseUrl}/student-view/${schoolId}?academic_year_id=${academicYearId}`;
        if (studentUserId) {
            url += `&student_user_id=${studentUserId}`;
        }

        const response = await api.get(url);
        return response.data || [];
    }

    // Get full syllabus detail with teacher progress (student read-only view)
    async fetchStudentSyllabusDetail(syllabusId: string, teacherId: string): Promise<ISyllabus> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `${this.baseUrl}/student-view/${schoolId}/${syllabusId}?teacher_id=${teacherId}`
        );
        return response.data || response;
    }

    // ============== TEACHER ASSIGNMENT OPERATIONS ==============

    // Assign a teacher to a syllabus for a specific section
    async assignTeacher(syllabusId: string, teacherId: number, sectionId: number): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/assign-teacher/${schoolId}/${syllabusId}`, {
            teacher_id: teacherId,
            section_id: sectionId,
        }) as ApiResponse;
        if (response.code === 201 || response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to assign teacher');
    }

    // Unassign a teacher from a syllabus section
    async unassignTeacher(assignmentId: number): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/unassign-teacher/${schoolId}/${assignmentId}`) as ApiResponse;
        if (response.code !== 200 && response.status !== 'success') {
            throw new Error(response.message || 'Failed to unassign teacher');
        }
    }

    // Get teachers assigned to a subject (via TeacherSubject)
    async getTeachersBySubject(subjectId: number): Promise<{ teacher_id: number; teacher_name: string }[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/teachers-by-subject/${schoolId}/${subjectId}`);
        return response.data || [];
    }

    // Get all teacher assignments for a syllabus
    async getAssignments(syllabusId: string): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/assignments/${schoolId}/${syllabusId}`);
        return response.data || [];
    }

    // ============== HELPER METHODS ==============

    // Get subjects for syllabus creation (based on user role)
    async getSubjectsForUser(loggedUser: any): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        let url: string;
        if (loggedUser?.role === 'TEACHER') {
            // Teachers only see their assigned subjects
            url = `/teachers/${loggedUser.school_user_id}/subjects/${schoolId}`;
        } else {
            // Admins/Principals see all subjects
            url = `/subjects/list/${schoolId}`;
        }

        const response = await api.get(url);
        return response.data || [];
    }
}

// Export singleton instance
export const syllabusService = new SyllabusService();
