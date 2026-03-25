
// Academics Service
// Handles API calls for academics management (subjects, marks, progress)
// Uses centralized API client from services/api/client.ts
//
// Note: The axios response interceptor in services/api/client.ts returns response.data directly,
// so API calls return the unwrapped data. We use type assertions to handle this.


import { getApiClient, getSchoolId } from '../api/client';
import { ISubject, IMarks } from '../../types/index';

// Common API response interface for type assertions
interface ApiResponse<T = any> {
    code?: number;
    status?: string;
    message?: string;
    data?: T;
    marks?: any[];
    total?: number;
    totalPages?: number;
    [key: string]: any;
}

// ============================================
// Subject Interfaces
// ============================================

interface ISubjectListParams {
    classId?: string;
    teacherId?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    page?: number;
    limit?: number;
    search?: string;
}

interface ISubjectListResponse {
    data: ISubject[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface ICreateSubjectRequest {
    name: string;
    code: string;
    classId: string;
    teacherId: string;
    credits?: number;
    status?: 'ACTIVE' | 'INACTIVE';
}

interface IUpdateSubjectRequest {
    name?: string;
    code?: string;
    teacherId?: string;
    credits?: number;
    status?: 'ACTIVE' | 'INACTIVE';
}

// ============================================
// Marks Interfaces
// ============================================

interface IMarksListParams {
    studentId?: string;
    examId?: string;
    subjectId?: string;
    classId?: string;
    page?: number;
    limit?: number;
}

interface IMarksListResponse {
    data: IMarks[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface ICreateMarksRequest {
    studentId: string;
    examId: string;
    subjectId: string;
    marksObtained: number;
    maxMarks: number;
    grade?: string;
    remarks?: string;
}

interface IUpdateMarksRequest {
    marksObtained?: number;
    maxMarks?: number;
    grade?: string;
    remarks?: string;
}

// ============================================
// Progress Report Interface
// ============================================

interface IProgressReport {
    studentId: string;
    studentName: string;
    classId: string;
    subjects: Array<{
        subjectId: string;
        subjectName: string;
        totalMarks: number;
        marksObtained: number;
        percentage: number;
        grade?: string;
        status: 'PASS' | 'FAIL';
    }>;
    overallPercentage: number;
    overallGrade?: string;
    remarks?: string;
    generatedAt: string;
}

class AcademicsService {
    private subjectsUrl = '/subjects';
    private marksUrl = '/marks';
    private progressUrl = '/progress';

    // ============================================
    // Subject Methods
    // ============================================


    // Get list of subjects with optional filtering
    async listSubjects(classId: string): Promise<ISubjectListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.subjectsUrl}/list/${schoolId}/${classId}`) as unknown as ApiResponse<ISubject[]>;
        return response as unknown as ISubjectListResponse;
    }


    // Get single subject by ID
    async getSubjectById(id: string): Promise<ISubject> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.subjectsUrl}/${id}/${schoolId}`) as unknown as ApiResponse<ISubject>;
        return (response.data || response) as unknown as ISubject;
    }


    // Create new subject
    async createSubject(data: ICreateSubjectRequest): Promise<ISubject> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.subjectsUrl}/create/${schoolId}`, data) as unknown as ApiResponse<ISubject>;
        if (response.code === 200 && response.status === 'success') {
            return response.data as ISubject;
        }
        throw new Error(response.message || 'Failed to create subject');
    }


    // Update subject
    async updateSubject(id: string, data: IUpdateSubjectRequest): Promise<ISubject> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.subjectsUrl}/update/${id}/${schoolId}`, data) as unknown as ApiResponse<ISubject>;
        if (response.code === 200 && response.status === 'success') {
            return response.data as ISubject;
        }
        throw new Error(response.message || 'Failed to update subject');
    }


    // Delete subject
    async deleteSubject(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.subjectsUrl}/delete/${id}/${schoolId}`) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete subject');
        }
    }


    // Get subjects for a class
    async getClassSubjects(classId: string): Promise<ISubject[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.subjectsUrl}/${schoolId}`, {
            params: { classId },
        }) as unknown as ApiResponse<ISubject[]>;
        return response.data || [];
    }

    // Get subjects for a class
    async getSectionSpecificSubjects(classId: string): Promise<ISubject[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.subjectsUrl}/section/${schoolId}/${classId}`) as unknown as ApiResponse<ISubject[]>;
        return response.data || [];
    }

    // Get available subjects for a section (not yet added to this section)
    async getAvailableSubjects(sectionId: string): Promise<ISubject[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.subjectsUrl}/available/${schoolId}/${sectionId}`) as unknown as ApiResponse<ISubject[]>;
        return response.data || [];
    }

    // Add subjects to a section
    async addSubjectsToSection(sectionId: string, subjectIds: string[]): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.subjectsUrl}/add-to-section/${schoolId}/${sectionId}`, {
            subject_ids: subjectIds
        }) as unknown as ApiResponse;

        if (response.code !== 200 && response.status !== 'success') {
            throw new Error(response.message || 'Failed to add subjects to section');
        }
    }

    // Remove subject from a section
    async removeSubjectFromSection(sectionId: string, subjectId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(
            `${this.subjectsUrl}/remove-from-section/${schoolId}/${sectionId}/${subjectId}`
        ) as unknown as ApiResponse;

        if (response.code !== 200 && response.status !== 'success') {
            throw new Error(response.message || 'Failed to remove subject from section');
        }
    }

    // ============================================
    // Marks Methods
    // ============================================


    // Get list of marks with optional filtering
    async listMarks(params?: IMarksListParams): Promise<IMarksListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.marksUrl}/list/${schoolId}`, { params }) as unknown as ApiResponse<IMarks[]>;

        // Handle API response format
        const marks = response.marks || response.data || [];
        const total = response.total || marks.length;
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const totalPages = response.totalPages || Math.ceil(total / limit);

        return {
            data: marks,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }


    // Get single marks record by ID
    async getMarksById(id: string): Promise<IMarks> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.marksUrl}/${id}/${schoolId}`) as unknown as ApiResponse<IMarks>;
        return (response.data || response) as unknown as IMarks;
    }


    // Create new marks record
    async createMarks(data: ICreateMarksRequest): Promise<IMarks> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.marksUrl}/create/${schoolId}`, data) as unknown as ApiResponse<IMarks>;
        if (response.code === 200 && response.status === 'success') {
            return response.data as IMarks;
        }
        throw new Error(response.message || 'Failed to create marks');
    }


    // Update marks record
    async updateMarks(id: string, data: IUpdateMarksRequest): Promise<IMarks> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.marksUrl}/update/${id}/${schoolId}`, data) as unknown as ApiResponse<IMarks>;
        if (response.code === 200 && response.status === 'success') {
            return response.data as IMarks;
        }
        throw new Error(response.message || 'Failed to update marks');
    }


    // Delete marks record
    async deleteMarks(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.marksUrl}/delete/${id}/${schoolId}`) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete marks');
        }
    }


    // Bulk create marks records
    async bulkCreateMarks(records: ICreateMarksRequest[]): Promise<IMarks[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.marksUrl}/bulk/${schoolId}`, { records }) as unknown as ApiResponse<IMarks[]>;
        if (response.code === 200 && response.status === 'success') {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to create marks');
    }


    // Get student marks for specific exam
    async getStudentExamMarks(studentId: string, examId: string): Promise<IMarks[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.marksUrl}/${schoolId}`, {
            params: { studentId, examId },
        }) as unknown as ApiResponse<IMarks[]>;
        return response.data || [];
    }

    // ============================================
    // Progress Methods
    // ============================================


    // Get student progress report
    async getStudentProgress(studentId: string, examId?: string): Promise<IProgressReport> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const params: Record<string, string> = {};
        if (examId) params.examId = examId;

        const response = await api.get(`${this.progressUrl}/student/${studentId}/${schoolId}`, { params }) as unknown as ApiResponse<IProgressReport>;
        return (response.data || response) as unknown as IProgressReport;
    }


    // Get class progress report
    async getClassProgress(classId: string, examId?: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const params: Record<string, string> = {};
        if (examId) params.examId = examId;

        const response = await api.get(`${this.progressUrl}/class/${classId}/${schoolId}`, { params }) as unknown as ApiResponse;
        return response.data || response;
    }


    // Export marks to CSV
    async exportMarksToCSV(params?: IMarksListParams): Promise<Blob> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.marksUrl}/export/csv/${schoolId}`, {
            params,
            responseType: 'blob',
        }) as unknown as Blob;
        return response;
    }


    // Export subjects to CSV
    async exportSubjectsToCSV(params?: ISubjectListParams): Promise<Blob> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.subjectsUrl}/export/csv/${schoolId}`, {
            params,
            responseType: 'blob',
        }) as unknown as Blob;
        return response;
    }


    // Bulk delete marks records
    async bulkDeleteMarks(ids: string[]): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.marksUrl}/bulk-delete/${schoolId}`, { ids }) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete marks');
        }
    }

    // ============================================
    // Marks Entry Specific Methods
    // ============================================

    // Fetch exam types
    async fetchExamTypes(): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`/exams/fetch/exam-types/${schoolId}`) as unknown as ApiResponse;
        return response.data || [];
    }

    // Fetch classes
    async fetchClasses(): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`/classes/list/${schoolId}`) as unknown as ApiResponse;
        return response.data || [];
    }

    // Fetch sections by class
    async fetchSections(classId: string): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`/classes/sections/${schoolId}/${classId}`) as unknown as ApiResponse;
        return response.data || [];
    }

    // Fetch section subjects
    async fetchSectionSubjects(sectionId: string): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`/subjects/section/${schoolId}/${sectionId}`) as unknown as ApiResponse;
        return response.data || [];
    }

    // Fetch exam configuration
    async fetchExamConfig(params: { examTypeId: string; classId: string; subjectId: string }): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`/exams/fetch/exam-configs/${schoolId}`, {
            params: {
                exam_type_id: params.examTypeId,
                class_id: params.classId,
                subject_id: params.subjectId,
            },
        }) as unknown as ApiResponse;
        return response.data || [];
    }

    // Fetch students with marks
    async fetchStudentsWithMarks(examConfigId: string, sectionId: string, academicYearId: string): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`/marks/fetch-students/${schoolId}/${academicYearId}`, {
            exam_config_id: examConfigId,
            section_id: sectionId,
        }) as unknown as ApiResponse;
        return response.data || [];
    }

    // Submit marks (with draft support)
    async submitMarks(payload: {
        exam_config_id: string;
        marks_data: any[];
        is_draft: boolean;
        teacher_id: string;
    }, academicYearId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`/marks/entry/${schoolId}/${academicYearId}`, payload) as unknown as ApiResponse;
        if (response.code === 200 || response.status === 'success') {
            return response;
        }
        throw new Error(response.message || 'Failed to submit marks');
    }

    // ============================================
    // Class Progress Specific Methods
    // ============================================

    // Fetch teacher's assigned class
    async fetchMyClass(teacherId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`/progress-card/my-class/${schoolId}/${teacherId}`) as unknown as ApiResponse;
        return response.data || null;
    }

    // Fetch class progress with academic year
    async fetchClassProgress(params: {
        classId: string;
        sectionId: string;
        examId: string;
        academicYearId: string;
    }): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `/progress-card/class-progress/${schoolId}/${params.academicYearId}/${params.examId}`,
            {
                params: {
                    class_id: params.classId,
                    section_id: params.sectionId,
                },
            }
        ) as unknown as ApiResponse;
        return response.data || {};
    }

    // Export class progress report
    async exportClassReport(params: {
        examId: string;
        classId: string;
        sectionId: string;
    }): Promise<Blob> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `/progress-card/export/class/${schoolId}/${params.examId}`,
            {
                params: {
                    class_id: params.classId,
                    section_id: params.sectionId,
                },
                responseType: 'blob',
            }
        ) as unknown as Blob;
        return response;
    }

    // Fetch individual student progress card
    async fetchProgressCard(studentId: string, examId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `/progress-card/view/${schoolId}/${studentId}/${examId}`
        ) as unknown as ApiResponse;
        return response.data || null;
    }

    // Fetch student annual report (all exams)
    async fetchStudentAnnualReport(studentId: string, academicYearId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `/progress-card/annual/${schoolId}/${studentId}`,
            {
                params: { academic_year_id: academicYearId }
            }
        ) as unknown as ApiResponse;
        return response.data || null;
    }
}

// Export singleton instance
export const academicsService = new AcademicsService();
