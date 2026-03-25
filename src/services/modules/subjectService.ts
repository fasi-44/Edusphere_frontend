/**
 * Subject Service
 * Handles API calls for subject management operations
 */

import { getApiClient, getSchoolId } from '../api/client';
import { ISubject } from '../../types/index';

interface ISubjectListResponse {
    data: ISubject[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class SubjectService {
    private baseUrl = '/subjects';

    /**
     * Get all subjects across all classes
     */
    async listAll(): Promise<ISubjectListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/list/${schoolId}`);
        return response.data;
    }

    /**
     * Get list of subjects for a specific class
     */
    async listByClass(classId: string): Promise<ISubjectListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/list/${schoolId}/${classId}`);
        return response.data;
    }

    /**
     * Get subjects for a specific section
     */
    async getBySection(sectionId: string): Promise<ISubject[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/section/${schoolId}/${sectionId}`);
        return response.data || [];
    }

    /**
     * Get single subject by ID
     */
    async getById(id: string): Promise<ISubject> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${id}/${schoolId}`);
        return response.data?.data || response.data;
    }

    /**
     * Create new subject
     */
    async create(data: Omit<ISubject, 'id' | 'createdAt'>): Promise<ISubject> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to create subject');
    }

    /**
     * Update existing subject
     */
    async update(id: string, data: Partial<ISubject>): Promise<ISubject> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/${id}/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to update subject');
    }

    /**
     * Delete subject
     */
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/${id}/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete subject');
        }
    }
}

// Export singleton instance
export const subjectService = new SubjectService();
