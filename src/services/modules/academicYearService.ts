/**
 * Academic Year Service
 * Handles API calls for Academic Year CRUD operations
 */

import { getApiClient, getSchoolId } from '../api/client';
import { API_ENDPOINTS } from '../api/config';
import { AcademicYear } from '../../types/auth';

export interface AcademicYearFormData {
    year_name: string;
    start_date: string;
    end_date: string;
    is_current?: boolean;
    is_active?: boolean;
}

class AcademicYearService {
    /**
     * Create a new academic year
     */
    async createAcademicYear(data: AcademicYearFormData): Promise<AcademicYear> {
        const skid = getSchoolId();
        if (!skid) {
            throw new Error('School ID not found');
        }

        const payload = {
            ...data,
            is_current: data.is_current ?? false,
            is_active: data.is_active ?? true,
        };

        const response: any = await getApiClient().post(
            API_ENDPOINTS.ACADEMIC_YEARS.CREATE(skid),
            payload
        );

        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }

        throw new Error(response.message || 'Failed to create academic year');
    }

    /**
     * Update an academic year
     */
    async updateAcademicYear(yearId: string, data: AcademicYearFormData): Promise<AcademicYear> {
        const skid = getSchoolId();
        if (!skid) {
            throw new Error('School ID not found');
        }

        const response: any = await getApiClient().put(
            API_ENDPOINTS.ACADEMIC_YEARS.UPDATE(skid, yearId),
            data
        );

        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }

        throw new Error(response.message || 'Failed to update academic year');
    }

    /**
     * Set an academic year as current
     */
    async setCurrentAcademicYear(yearId: string): Promise<void> {
        const skid = getSchoolId();
        if (!skid) {
            throw new Error('School ID not found');
        }

        const response: any = await getApiClient().patch(
            API_ENDPOINTS.ACADEMIC_YEARS.SET_CURRENT(skid, yearId)
        );

        if (response.code === 200 && response.status === 'success') {
            return;
        }

        throw new Error(response.message || 'Failed to set current academic year');
    }
}

export const academicYearService = new AcademicYearService();
