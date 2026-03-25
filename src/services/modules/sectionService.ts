/**
 * Section Service
 * Handles API calls for section management operations
 */

import { getApiClient, getSchoolId } from '../api/client';
import { ISection } from '../../types/index';

class SectionService {
    private baseUrl = '/classes';

    /**
     * Get sections for a specific class
     */
    async getByClass(classId: string): Promise<ISection[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/sections/${schoolId}/${classId}`);
        return response?.data || [];
    }

    /**
     * Get single section by ID
     */
    async getById(sectionId: string): Promise<ISection> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/section/${sectionId}/${schoolId}`);
        return response.data?.data || response.data;
    }

    /**
     * Create new section for a class
     */
    async create(classId: string, sectionName: string, teacherId: string): Promise<ISection> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/section/${schoolId}`, {
            class_id: classId,
            section_name: sectionName,
            teacher_id: teacherId,
        });

        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }

        throw new Error(response.data || 'Failed to create section');
    }

    /**
     * Update existing section
     */
    async update(sectionId: string, classId: string, sectionName: string, teacherId: string): Promise<ISection> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/section/${schoolId}/${sectionId}`, {
            class_id: classId,
            section_name: sectionName,
            teacher_id: teacherId,
        });

        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }

        throw new Error(response.data?.message || 'Failed to update section');
    }

    /**
     * Delete section
     */
    async delete(sectionId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/section/${schoolId}/${sectionId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete section');
        }
    }
}

// Export singleton instance
export const sectionService = new SectionService();
