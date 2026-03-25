// Parent Service
// Handles API calls for parent management operations

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
    parents?: any[];
}

interface IParentListParams {
    search?: string;
    gender?: string;
    status?: string;
    page?: number;
    limit?: number;
}

interface IParentListResponse {
    data: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class ParentService {
    private baseUrl = '/parents';

    // Get list of parents with pagination
    async list(params?: IParentListParams): Promise<IParentListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        try {
            const response = (await api.get(`${this.baseUrl}/list/${schoolId}`, { params })) as ApiResponse;

            // Handle both old and new response formats
            if (response.data && response.meta) {
                // New format: { data: [], meta: { total, page, limit, totalPages } }
                return {
                    data: response.data,
                    meta: response.meta
                };
            } else if (response.parents) {
                // Legacy format: { parents: [] }
                return {
                    data: response.parents,
                    meta: {
                        total: response.parents.length,
                        page: 1,
                        limit: response.parents.length,
                        totalPages: 1
                    }
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch parents');
        }
    }

    // Get single parent by ID
    async getById(id: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${schoolId}/${id}`);
        return response;
    }

    // Create new parent
    async create(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.post(`${this.baseUrl}/create/details/${schoolId}`, data)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to create parent');
    }

    // Update parent
    async update(id: string, data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.put(`${this.baseUrl}/update/${schoolId}/${id}`, data)) as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update parent');
    }

    // Delete parent
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = (await api.delete(`${this.baseUrl}/delete/${id}/${schoolId}`)) as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete parent');
        }
    }
}

export const parentService = new ParentService();
