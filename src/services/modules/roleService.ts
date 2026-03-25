/**
 * Role Service
 * Handles API calls for role and permissions management
 */

import { getApiClient, getSchoolId } from '../api/client';

// Generic API response interface for type assertions
interface ApiResponse {
    code?: number;
    status?: string;
    message?: string;
    data?: any;
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface IRoleListParams {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}

interface IRoleListResponse {
    data: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class RoleService {
    private baseUrl = '/roles';

    private getSchoolIdOrThrow(): string {
        const schoolId = getSchoolId();
        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }
        return schoolId;
    }

    /**
     * Get list of roles with pagination
     */
    async list(params?: IRoleListParams): Promise<IRoleListResponse> {
        const api = getApiClient();
        const schoolId = this.getSchoolIdOrThrow();

        try {
            const response = (await api.get(`${this.baseUrl}/list/${schoolId}`, { params })) as ApiResponse;

            if (response.data && response.meta) {
                return {
                    data: response.data,
                    meta: response.meta
                };
            } else if (Array.isArray(response.data)) {
                return {
                    data: response.data,
                    meta: {
                        total: response.data.length,
                        page: 1,
                        limit: response.data.length,
                        totalPages: 1
                    }
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch roles');
        }
    }

    /**
     * Get single role by ID
     * Backend: GET /roles/role/<skid>/<role_id>
     */
    async getById(id: string | number): Promise<any> {
        const api = getApiClient();
        const schoolId = this.getSchoolIdOrThrow();

        const response = (await api.get(`${this.baseUrl}/role/${schoolId}/${id}`)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch role');
    }

    /**
     * Create new role
     * Backend: POST /roles/create/role/<skid>
     */
    async create(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = this.getSchoolIdOrThrow();

        const response = (await api.post(`${this.baseUrl}/create/role/${schoolId}`, data)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to create role');
    }

    /**
     * Update role
     * Backend: PUT /roles/update/role/<skid>/<role_id>
     */
    async update(id: string | number, data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = this.getSchoolIdOrThrow();

        const response = (await api.put(`${this.baseUrl}/update/role/${schoolId}/${id}`, data)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update role');
    }

    /**
     * Delete role
     * Backend: DELETE /roles/delete/role/<skid>/<role_id>
     */
    async delete(id: string | number): Promise<void> {
        const api = getApiClient();
        const schoolId = this.getSchoolIdOrThrow();

        const response = (await api.delete(`${this.baseUrl}/delete/role/${schoolId}/${id}`)) as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete role');
        }
    }

    /**
     * Assign permissions to role
     * Backend: PUT /roles/addPermissionsToRole/<skid>/<role_id>
     * Permissions are stored as a flat string array on the Role model
     */
    async assignPermissions(roleId: string | number, permissions: string[]): Promise<any> {
        const api = getApiClient();
        const schoolId = this.getSchoolIdOrThrow();

        const response = (await api.put(
            `${this.baseUrl}/addPermissionsToRole/${schoolId}/${roleId}`,
            { permissions }
        )) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to assign permissions');
    }
}

export const roleService = new RoleService();
