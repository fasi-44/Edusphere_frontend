/**
 * Teacher Service
 * Handles API calls for teacher management operations
 */

import { getApiClient, getSchoolId } from '../api/client';

interface ITeacherListParams {
    search?: string;
    gender?: string;
    status?: string;
    page?: number;
    limit?: number;
}

interface ITeacherListResponse {
    data: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class TeacherService {
    private baseUrl = '/teachers';

    /**
     * Get list of teachers with pagination
     */
    async list(params?: ITeacherListParams): Promise<ITeacherListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        try {
            const response = await api.get(`${this.baseUrl}/list/${schoolId}`, { params });

            // Handle both old and new response formats
            if (response.data && response.meta) {
                // New format: { data: [], meta: { total, page, limit, totalPages } }
                return response;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch teachers');
        }
    }

    /**
     * Get single teacher by ID
     */
    async getById(id: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/profile/${schoolId}/${id}`);
        return response.teacher_data;
    }

    /**
     * Create new teacher
     */
    async create(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to create teacher');
    }

    /**
     * Update teacher
     */
    async update(id: string, data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/${schoolId}/${id}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.data?.message || 'Failed to update teacher');
    }

    /**
     * Delete teacher
     */
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/${id}/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete teacher');
        }
    }
    /**
     * Get subject IDs assigned to a teacher
     */
    async getSubjectIds(teacherId: string): Promise<number[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${teacherId}/subjects/${schoolId}`);
        return response.subject_ids || [];
    }

    /**
     * Assign subjects to a teacher (replaces all existing assignments)
     */
    async assignSubjects(teacherId: string, subjectIds: number[]): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/${teacherId}/assign-subjects/${schoolId}`, {
            subject_ids: subjectIds,
        });
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to assign subjects');
        }
    }
}

export const teacherService = new TeacherService();
