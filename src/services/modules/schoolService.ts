/**
 * School Service
 * Handles API calls for school management operations
 * Uses centralized API client from services/api/client.ts
 */

import { getApiClient } from '../api/client';
import { ISchool } from '../../types/index';

interface ISchoolListParams {
    search?: string;
    status?: 'active' | 'inactive';
    page?: number;
    limit?: number;
}

interface ISchoolListResponse {
    data: ISchool[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class SchoolService {
    private baseUrl = '/school';

    /**
     * Get list of all schools
     */
    async listSchools(): Promise<{ data: ISchool[] }> {
        const api = getApiClient();
        const response = await api.get(`${this.baseUrl}/list`);
        if (response.code === 200 && response.status === 'success') {
            return { data: response?.data };
        }
        throw new Error(response.data?.message || 'Failed to fetch schools');
    }

    /**
     * Get list of schools with optional filtering
     */
    async list(params?: ISchoolListParams): Promise<ISchoolListResponse> {
        const api = getApiClient();
        const response = await api.get(`${this.baseUrl}/list`, { params });
        return response.data;
    }

    /**
     * Get single school by ID
     */
    async getById(id: string): Promise<ISchool> {
        const api = getApiClient();
        const response = await api.get(`${this.baseUrl}/${id}`);
        return response.school;
    }

    /**
     * Create new school
     */
    async create(data: Omit<ISchool, 'id' | 'created_at' | 'updated_at'>): Promise<ISchool> {
        const api = getApiClient();
        const response = await api.post(`${this.baseUrl}/create`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data.school;
        }
        throw new Error(response.data?.message || 'Failed to create school');
    }

    /**
     * Update existing school
     */
    async update(id: string, data: Partial<ISchool>): Promise<ISchool> {
        const api = getApiClient();
        const response = await api.put(`${this.baseUrl}/update/${id}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.school;
        }
        throw new Error(response.message || 'Failed to update school');
    }

    /**
     * Delete school
     */
    async deleteSchool(id: string): Promise<void> {
        const api = getApiClient();
        const response = await api.delete(`${this.baseUrl}/delete/${id}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete school');
        }
    }

    /**
     * Legacy delete method (alias for deleteSchool)
     */
    async delete(id: string): Promise<void> {
        return this.deleteSchool(id);
    }

    /**
     * Activate school
     */
    async activateSchool(id: string): Promise<void> {
        const api = getApiClient();
        const response = await api.patch(`${this.baseUrl}/activate/${id}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to activate school');
        }
    }

    /**
     * Deactivate school
     */
    async deactivateSchool(id: string): Promise<void> {
        const api = getApiClient();
        const response = await api.patch(`${this.baseUrl}/deactivate/${id}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to deactivate school');
        }
    }

    /**
     * Update school status (activate/deactivate)
     */
    async updateStatus(id: string, status: 'active' | 'inactive'): Promise<ISchool> {
        if (status === 'active') {
            await this.activateSchool(id);
        } else {
            await this.deactivateSchool(id);
        }
        return await this.getById(id);
    }

    /**
     * Bulk delete schools
     */
    async bulkDelete(ids: string[]): Promise<void> {
        const api = getApiClient();
        await api.post(`${this.baseUrl}/bulk-delete`, { ids });
    }

    /**
     * Export schools to CSV
     */
    async exportToCSV(params?: ISchoolListParams): Promise<Blob> {
        const api = getApiClient();
        const response = await api.get(`${this.baseUrl}/export/csv`, {
            params,
            responseType: 'blob',
        });
        return response.data;
    }

    /**
     * Get list of school admins
     */
    async listSchoolAdmins(): Promise<{ data: any[] }> {
        const api = getApiClient();
        const response = await api.get(`${this.baseUrl}/list/school-admins`);
        if (response.code === 200 && response.status === 'success') {
            return { data: response?.data };
        }
        throw new Error(response.data?.message || 'Failed to fetch school admins');
    }

    /**
     * Change school admin password
     */
    async changeAdminPassword(adminId: string, newPassword: string): Promise<void> {
        const api = getApiClient();
        const response = await api.patch(`${this.baseUrl}/school-admin/change-password/${adminId}`, {
            new_password: newPassword,
        });
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to change password');
        }
    }

    /**
     * Get school admin by skid and admin ID
     * Uses the /users/schoolAdmin/{skid}/{admin_id} endpoint
     */
    async getSchoolAdmin(skid: string, adminId: string): Promise<any> {
        const api = getApiClient();
        const response = await api.get(`/users/schoolAdmin/${skid}/${adminId}`) as any;
        if (response.code === 200 && response.status === 'success') {
            return response.user;
        }
        throw new Error(response.message || 'Failed to fetch school admin');
    }

    /**
     * Create a school admin (super admin context - no schoolId in URL)
     * Uses the /users/create endpoint directly
     */
    async createSchoolAdmin(data: Record<string, any>): Promise<any> {
        const api = getApiClient();
        const response = await api.post('/users/create', data) as any;
        if (response.code === 200 && response.status === 'success') {
            return response.user;
        }
        throw new Error(response.message || 'Failed to create school admin');
    }

    /**
     * Update a school admin (super admin context - no schoolId in URL)
     * Uses the /users/update/{admin_id} endpoint directly
     */
    async updateSchoolAdmin(adminId: string, data: Record<string, any>): Promise<any> {
        const api = getApiClient();
        const response = await api.put(`/users/update/${adminId}`, data) as any;
        if (response.user) {
            return response.user;
        }
        throw new Error(response.message || 'Failed to update school admin');
    }

    /**
     * Get list of all system admins (super admins)
     */
    async listSuperAdmins(): Promise<{ data: any[] }> {
        const api = getApiClient();
        const response = await api.get('/users/super-admins') as any;
        if (response.code === 200 && response.status === 'success') {
            return { data: response.data };
        }
        throw new Error(response.message || 'Failed to fetch system admins');
    }

    /**
     * Create a new system admin (super admin)
     */
    async createSuperAdmin(data: { username?: string; email?: string; password: string }): Promise<any> {
        const api = getApiClient();
        const response = await api.post('/users/create-super-admin', data) as any;
        if (response.code === 200 && response.status === 'success') {
            return response.user;
        }
        throw new Error(response.message || 'Failed to create system admin');
    }
}

// Export singleton instance
export const schoolService = new SchoolService();
