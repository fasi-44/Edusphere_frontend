
// Exam Service
// Handles API calls for exam management operations
// Uses centralized API client from services/api/client.ts


import { getApiClient, getSchoolId } from '../api/client';
import { IExam, ExamType } from '../../types/index';

interface IExamListResponse {
    data: IExam[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface ICreateExamRequest {
    name: string;
    type: ExamType;
    description?: string;
    startDate: string;
    endDate: string;
    classIds: string[];
    publishResults?: boolean;
}

interface IUpdateExamRequest {
    name?: string;
    type?: ExamType;
    description?: string;
    startDate?: string;
    endDate?: string;
    classIds?: string[];
    status?: 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
    publishResults?: boolean;
}

interface IExamSchedule {
    examId: string;
    classId: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
    room?: string;
}

class ExamService {
    private baseUrl = '/exams';


    // Get list of exams with optional filtering 
    async list(): Promise<IExamListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/fetch/exam-types/${schoolId}`);
        return response.data;
    }


    // Get single exam by ID 
    async getById(id: string): Promise<IExam> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${id}/${schoolId}`);
        return response.data;
    }


    // Create new exam 
    async create(data: ICreateExamRequest): Promise<IExam> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/exam-type/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response?.message || 'Failed to create exam');
    }


    // Update exam 
    async update(id: string, data: IUpdateExamRequest): Promise<IExam> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/exam-type/${schoolId}/${id}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response?.message || 'Failed to update exam');
    }


    // Delete exam 
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/${id}/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to delete exam');
        }
    }


    // Update exam status 
    async updateStatus(id: string, status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED'): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.patch(`${this.baseUrl}/${id}/status/${schoolId}`, { status });
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to update exam status');
        }
    }


    // Get exam schedule 
    async getSchedule(examId: string): Promise<IExamSchedule[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${examId}/schedule/${schoolId}`);
        return response?.data || [];
    }


    // Create exam schedule 
    async createSchedule(
        examId: string,
        schedule: Omit<IExamSchedule, 'examId'>
    ): Promise<IExamSchedule> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/${examId}/schedule/${schoolId}`, schedule);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response?.message || 'Failed to create exam schedule');
    }


    // Update exam schedule 
    async updateSchedule(
        examId: string,
        scheduleId: string,
        schedule: Partial<Omit<IExamSchedule, 'examId'>>
    ): Promise<IExamSchedule> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/${examId}/schedule/${scheduleId}/${schoolId}`, schedule);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response?.message || 'Failed to update exam schedule');
    }


    // Delete exam schedule 
    async deleteSchedule(examId: string, scheduleId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/${examId}/schedule/${scheduleId}/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to delete exam schedule');
        }
    }


    // Publish exam results 
    async publishResults(examId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/${examId}/publish-results/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to publish exam results');
        }
    }


    // Get exam statistics 
    async getStatistics(examId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${examId}/statistics/${schoolId}`);
        return response?.data || response.data;
    }


    // Bulk delete exams
    async bulkDelete(ids: string[]): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/bulk-delete/${schoolId}`, { ids });
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to delete exams');
        }
    }

    /**
     * Get exam subject configurations with filters
     */
    async getExamConfigs(filters?: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/fetch/exam-configs/${schoolId}`, {
            params: filters,
        });
        return response.data;
    }

    /**
     * Get single exam configuration by ID
     */
    async getExamConfigById(configId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/exam-config/${configId}/${schoolId}`);
        return response?.data || response.data;
    }

    /**
     * Create exam subject configuration
     */
    async createExamConfig(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/exam-config/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response?.message || 'Failed to create configuration');
    }

    /**
     * Update exam subject configuration
     */
    async updateExamConfig(configId: string, data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(
            `${this.baseUrl}/update/exam-config/${schoolId}/${configId}`,
            data
        );
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response?.message || 'Failed to update configuration');
    }

    /**
     * Delete exam subject configuration
     */
    async deleteExamConfig(configId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(
            `${this.baseUrl}/delete/exam-config/${schoolId}/${configId}`
        );
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to delete configuration');
        }
    }

    // ──────────────────────────────────────────────
    // Exam Timetable
    // ──────────────────────────────────────────────

    async getExamTimetables(filters?: {
        academic_year_id?: number;
        exam_type_id?: number;
        class_id?: number;
        section_id?: number;
    }): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');

        const response = await api.get(`${this.baseUrl}/fetch/exam-timetables/${schoolId}`, {
            params: filters,
        });
        return response.data;
    }

    async getExamTimetableById(entryId: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');

        const response = await api.get(`${this.baseUrl}/exam-timetable/${entryId}/${schoolId}`);
        return response?.data || response.data;
    }

    async createExamTimetable(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');

        const response = await api.post(`${this.baseUrl}/create/exam-timetable/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response?.message || 'Failed to create exam timetable entry');
    }

    async updateExamTimetable(entryId: string, data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');

        const response = await api.put(`${this.baseUrl}/update/exam-timetable/${schoolId}/${entryId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response?.message || 'Failed to update exam timetable entry');
    }

    async deleteExamTimetable(entryId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');

        const response = await api.delete(`${this.baseUrl}/delete/exam-timetable/${schoolId}/${entryId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to delete exam timetable entry');
        }
    }

    async getStudentExamTimetable(studentId: number, examTypeId: number, academicYearId?: number): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');

        const params: any = { exam_type_id: examTypeId };
        if (academicYearId) params.academic_year_id = academicYearId;

        const response = await api.get(`${this.baseUrl}/student-exam-timetable/${schoolId}/${studentId}`, { params });
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    }

    async getInvigilatorSchedule(teacherId: number, examTypeId: number, academicYearId?: number): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');

        const params: any = { exam_type_id: examTypeId };
        if (academicYearId) params.academic_year_id = academicYearId;

        const response = await api.get(`${this.baseUrl}/invigilator-schedule/${schoolId}/${teacherId}`, { params });
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    }

    async bulkDeleteExamTimetables(ids: number[]): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');

        const response = await api.post(`${this.baseUrl}/bulk-delete/exam-timetables/${schoolId}`, { ids });
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response?.message || 'Failed to bulk delete exam timetable entries');
    }

    /**
     * Bulk copy exam configurations
     */
    async bulkCopyConfigs(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(
            `${this.baseUrl}/bulk-copy/exam-configs/${schoolId}`,
            data
        );
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response?.message || 'Failed to copy configurations');
    }
}

// Export singleton instance
export const examService = new ExamService();
