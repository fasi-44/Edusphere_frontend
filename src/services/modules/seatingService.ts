// Seating Arrangement Service

import { getApiClient, getSchoolId } from '../api/client';
import type { ISeatingConfig, IClassAssignment } from '../../pages/ExamManagement/SeatingArrangement/types';

export type { ISeatingConfig, IClassAssignment };
export type { ISeatingPlan } from '../../pages/ExamManagement/SeatingArrangement/types';

class SeatingService {
    private baseUrl = '/seating';

    async getConfigs(filters?: {
        academic_year_id?: number;
        exam_type_id?: number;
        exam_date?: string;
    }): Promise<ISeatingConfig[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const response = await api.get(`${this.baseUrl}/fetch/configs/${schoolId}`, { params: filters });
        return response.data || [];
    }

    async getConfigById(configId: number): Promise<ISeatingConfig> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const response = await api.get(`${this.baseUrl}/config/${configId}/${schoolId}`);
        return response?.data || response.data;
    }

    async createConfig(data: {
        academic_year_id: number;
        exam_type_id: number;
        room_id: number;
        class_assignments: IClassAssignment[];
        exam_date: string;
        start_time: string;
        end_time: string;
        invigilator_id?: number | null;
        notes?: string;
    }): Promise<ISeatingConfig> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const response = await api.post(`${this.baseUrl}/create/config/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') return response.data;
        throw new Error(response?.message || 'Failed to create seating config');
    }

    async updateConfig(configId: number, data: any): Promise<ISeatingConfig> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const response = await api.put(`${this.baseUrl}/update/config/${schoolId}/${configId}`, data);
        if (response.code === 200 && response.status === 'success') return response.data;
        throw new Error(response?.message || 'Failed to update seating config');
    }

    async deleteConfig(configId: number): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const response = await api.delete(`${this.baseUrl}/delete/config/${schoolId}/${configId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to delete seating config');
        }
    }

    async generateSeating(configId: number): Promise<{ newly_seated: number; unassigned_remaining: number; message: string }> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const response = await api.post(`${this.baseUrl}/generate/${configId}/${schoolId}`);
        if (response.code === 200 && response.status === 'success') return response.data;
        throw new Error(response?.message || 'Failed to generate seating arrangement');
    }

    async clearSeating(configId: number): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const response = await api.post(`${this.baseUrl}/clear/${configId}/${schoolId}`);
        if (response.code === 200 && response.status === 'success') return response.data;
        throw new Error(response?.message || 'Failed to clear seating arrangement');
    }

    async validateConfig(
        data: any,
        configId?: number
    ): Promise<{ valid: boolean; errors: string[] }> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const params = configId ? { config_id: configId } : {};
        const response = await api.post(`${this.baseUrl}/validate/${schoolId}`, data, { params });
        if (response.code === 200 && response.status === 'success') return response.data;
        throw new Error(response?.message || 'Validation failed');
    }

    async swapSeats(data: {
        seat_a: { config_id: number; student_id: number };
        seat_b: { config_id: number; student_id?: number; seat_row: number; seat_col: number; seat_label?: string };
    }): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error('School ID not found. Please log in again.');
        const response = await api.post(`${this.baseUrl}/swap/${schoolId}`, data);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to swap seats');
        }
    }
}

export const seatingService = new SeatingService();
