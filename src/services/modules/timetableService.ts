/**
 * Timetable Service
 * Handles API calls for timetable management operations
 * Uses centralized API client from services/api/client.ts
 */

import { getApiClient, getSchoolId } from '../api/client';
import { ITimetable } from '../../types/index';

interface ICreateTimetableRequest {
    classId: string;
    academicYear: string;
    timeSlots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        subjectId?: string;
        teacherId?: string;
        roomNumber?: string;
    }>;
}

interface IUpdateTimetableRequest {
    timeSlots?: Array<{
        id?: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        subjectId?: string;
        teacherId?: string;
        roomNumber?: string;
    }>;
}

interface ITimeSlotRequest {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjectId?: string;
    teacherId?: string;
    roomNumber?: string;
}

class TimetableService {
    private baseUrl = '/timeTable';

    /**
     * Get list of timetables with optional filtering
     */
    async list(academicyearId: number): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/list/${schoolId}/${academicyearId}`);
        return response.data;
    }

    /**
     * Get single timetable by ID or View
     */
    async getById(id: string): Promise<ITimetable> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/view/${schoolId}/${id}`);
        return response.data?.data || response.data;
    }

    /**
     * Get timetable for a specific class
     */
    async getByClassId(classId: string, academicYear?: string): Promise<ITimetable> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const params: any = {};
        if (academicYear) params.academicYear = academicYear;

        const response = await api.get(`${this.baseUrl}/class/${classId}/${schoolId}`, { params });
        return response.data;
    }

    /**
     * Create new timetable
     */
    async create(data: ICreateTimetableRequest): Promise<ITimetable> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to create timetable');
    }

    /**
     * Update timetable
     */
    async update(id: string, data: IUpdateTimetableRequest): Promise<ITimetable> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/${id}/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to update timetable');
    }

    /**
     * Delete timetable
     */
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/${id}/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete timetable');
        }
    }

    /**
     * Add time slot to timetable
     */
    async addTimeSlot(timetableId: string, slot: ITimeSlotRequest): Promise<ITimetable> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/${timetableId}/slots/${schoolId}`, slot);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to add time slot');
    }

    /**
     * Update time slot
     */
    async updateTimeSlot(
        timetableId: string,
        slotId: string,
        slot: ITimeSlotRequest
    ): Promise<ITimetable> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/${timetableId}/slots/${slotId}/${schoolId}`, slot);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to update time slot');
    }

    /**
     * Delete time slot
     */
    async deleteTimeSlot(timetableId: string, slotId: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/${timetableId}/slots/${slotId}/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete time slot');
        }
    }

    /**
     * Get timetable for teacher
     */
    async getTeacherTimetable(teacherId: string, academicYear?: string): Promise<ITimetable[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const params: any = {};
        if (academicYear) params.academicYear = academicYear;

        const response = await api.get(`/users/${teacherId}/timetable/${schoolId}`, { params });
        return response.data?.data || [];
    }

    /**
     * Duplicate timetable for another class/year
     */
    async duplicate(
        sourceId: string,
        targetClassId: string,
        academicYear: string
    ): Promise<ITimetable> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/${sourceId}/duplicate/${schoolId}`, {
            targetClassId,
            academicYear,
        });
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to duplicate timetable');
    }

    /**
     * Export timetable to PDF
     */
    async exportToPDF(timetableId: string): Promise<Blob> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${timetableId}/export/pdf/${schoolId}`, {
            responseType: 'blob',
        });
        return response.data;
    }

    /**
     * Export timetable to CSV
     */
    async exportToCSV(timetableId: string): Promise<Blob> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${timetableId}/export/csv/${schoolId}`, {
            responseType: 'blob',
        });
        return response.data;
    }

    /**
     * Bulk delete timetables
     */
    async bulkDelete(ids: string[]): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/bulk-delete/${schoolId}`, { ids });
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete timetables');
        }
    }

    /**
     * Generate time slots based on period configuration
     */
    async generateTimeSlots(config: {
        school_start_time: string;
        lunch_start_time: string;
        lunch_duration: number;
        period_duration: number;
        total_periods: number;
    }): Promise<any> {
        const api = getApiClient();

        const response = await api.post(`${this.baseUrl}/generate/time-slots`, config);
        if (response.code === 200 && response.status === 'success') {
            return response?.data || [];
        }
        throw new Error(response.data?.message || 'Failed to generate time slots');
    }

    /**
     * Check for teacher scheduling conflicts
     */
    async checkTeacherConflict(data: {
        skid: string;
        teacher_id: string;
        day: string;
        start_time: string;
        end_time: string;
        academic_year_id: string;
        semester: number | string;
        exclude_timetable_id?: string;
    }): Promise<any> {
        const api = getApiClient();

        const response = await api.post(`${this.baseUrl}/check-teacher-conflict`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data || { has_conflict: false, conflicts: [] };
        }
        throw new Error(response.data?.message || 'Failed to check teacher conflict');
    }

    /**
     * Validate timetable for conflicts before final save
     */
    async validateConflicts(data: {
        skid: string;
        class_id: string;
        section_id: string;
        academic_year_id: string;
        semester: number | string;
        entries: Record<string, any>;
        exclude_timetable_id?: string;
    }): Promise<any> {
        const api = getApiClient();

        const response = await api.post(`${this.baseUrl}/validate-conflicts`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data || { is_valid: false, validation_message: 'Validation failed' };
        }
        throw new Error(response.data?.message || 'Failed to validate timetable');
    }

    /**
     * Save timetable as draft
     */
    async saveDraft(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/save-draft`, {
            ...data,
            skid: schoolId,
            is_draft: true,
        });

        if (response.code === 201 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.data?.message || 'Failed to save timetable as draft');
    }

    /**
     * Create/publish final timetable
     */
    async createFinal(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create`, {
            ...data,
            skid: schoolId,
            is_draft: false,
        });

        if (response.code === 201 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to create timetable');
    }
}

// Export singleton instance
export const timetableService = new TimetableService();
