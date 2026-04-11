/**
 * User Service
 * Handles API calls for user management operations
 * Uses centralized API client from services/api/client.ts
 */

import { getApiClient, getSchoolId } from '../api/client';
import { IUser } from '../../types/index';

/**
 * Generic API response interface
 * The axios response interceptor returns response.data directly,
 * so we need type assertions when accessing these properties
 */
interface ApiResponse {
    code?: number;
    status?: string;
    message?: string;
    data?: IUser | IUser[];
    user?: IUser;
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

interface IUserListParams {
    search?: string;
    gender?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
}

interface IUserListResponse {
    data: IUser[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class UserService {
    private baseUrl = '/users';

    /**
     * Get list of users with optional filtering
     */
    async list(params?: IUserListParams): Promise<IUserListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        try {
            const response = (await api.get(`${this.baseUrl}/list/${schoolId}`, { params })) as ApiResponse;

            // Handle response format
            if (response.data && response.meta) {
                // New format: { data: [], meta: { total, page, limit, totalPages } }
                return {
                    data: response.data as IUser[],
                    meta: response.meta
                };
            } else if (response.data && !response.meta) {
                // Fallback for old format: ensure meta exists
                const dataArray = response.data as IUser[];
                return {
                    data: dataArray,
                    meta: {
                        total: response.total || dataArray.length,
                        page: response.page || 1,
                        limit: response.limit || dataArray.length,
                        totalPages: response.totalPages || 1
                    }
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch users');
        }
    }

    /**
     * Get single user by ID
     */
    async getById(id: string): Promise<IUser> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.get(`${this.baseUrl}/${id}/${schoolId}`)) as ApiResponse;
        return (response.user || response.data) as IUser;
    }

    /**
     * Create new user
     */
    async create(data: Omit<IUser, 'id' | 'created_at' | 'updated_at'>): Promise<IUser> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.post(`${this.baseUrl}/create`, data)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return (response.user || response.data) as IUser;
        }
        throw new Error(response.message || 'Failed to create user');
    }

    /**
     * Update existing user
     */
    async update(id: string, data: Partial<IUser>): Promise<IUser> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.put(`${this.baseUrl}/update/${id}/${schoolId}`, data)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return (response.user || response.data) as IUser;
        }
        throw new Error(response.message || 'Failed to update user');
    }

    /**
     * Delete user
     */
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.delete(`${this.baseUrl}/delete/${id}/${schoolId}`)) as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete user');
        }
    }

    /**
     * Change user password
     */
    async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.post(`${this.baseUrl}/${id}/change-password/${schoolId}`, {
            current_password: currentPassword,
            new_password: newPassword,
        })) as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to change password');
        }
    }

    /**
     * Reset user password (admin only)
     */
    async resetPassword(id: string, newPassword: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.post(`${this.baseUrl}/${id}/reset-password/${schoolId}`, {
            new_password: newPassword,
        })) as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to reset password');
        }
    }

    /**
     * Activate user login (main DB)
     */
    async activateUser(mainUserId: string): Promise<any> {
        const api = getApiClient();
        const response = (await api.post(`${this.baseUrl}/${mainUserId}/activate`)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response;
        }
        throw new Error(response.message || 'Failed to activate user');
    }

    /**
     * Deactivate user login (main DB)
     */
    async deactivateUser(mainUserId: string): Promise<any> {
        const api = getApiClient();
        const response = (await api.post(`${this.baseUrl}/${mainUserId}/deactivate`)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response;
        }
        throw new Error(response.message || 'Failed to deactivate user');
    }

    /**
     * Bulk delete users
     */
    async bulkDelete(ids: string[]): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.post(`${this.baseUrl}/bulk-delete/${schoolId}`, { ids })) as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to bulk delete users');
        }
    }

    /**
     * Export users to CSV
     */
    async exportToCSV(params?: IUserListParams): Promise<Blob> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/export/csv/${schoolId}`, {
            params,
            responseType: 'blob',
        });
        return response as unknown as Blob;
    }

    /**
     * Provision login for a single school user (STUDENT/PARENT)
     */
    async provisionLogin(data: {
        school_user_id: number;
        skid: string;
        school_id: number;
        password: string;
    }): Promise<any> {
        const api = getApiClient();
        const response = (await api.post(`${this.baseUrl}/provision-login`, data)) as any;
        if (response.code === 200 && response.status === 'success') {
            return response;
        }
        throw new Error(response.message || 'Failed to provision login');
    }

    /**
     * Bulk provision logins for STUDENT/PARENT users
     */
    async provisionBulkLogins(data: {
        skid: string;
        school_id: number;
        default_password: string;
        role_filter?: string;
    }): Promise<any> {
        const api = getApiClient();
        const response = (await api.post(`${this.baseUrl}/provision-bulk-logins`, data)) as any;
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to provision bulk logins');
    }

    /**
     * Get provisioning report for export
     */
    async getProvisioningReport(skid: string, schoolId: number): Promise<any> {
        const api = getApiClient();
        const response = (await api.get(`${this.baseUrl}/provisioning-report/${skid}/${schoolId}`)) as any;
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to get provisioning report');
    }
}

// Export singleton instance
export const userService = new UserService();
