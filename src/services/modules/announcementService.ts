
// Announcement Service
// Handles API calls for announcement management operations
// Uses centralized API client from services/api/client.ts


import { getApiClient, getSchoolId } from '../api/client';
import { IAnnouncement, AnnouncementPriority, UserRole } from '../../types/index';

interface ApiResponse<T = any> {
    code?: string | number;
    message?: string;
    data?: T;
    announcements?: any[];
    total?: number;
    totalPages?: number;
    status?: string;
    [key: string]: any;
}

interface IAnnouncementListParams {
    classId?: string;
    userId?: string;
    category?: string;
    priority?: AnnouncementPriority;
    targetAudience?: UserRole[];
    page?: number;
    limit?: number;
    search?: string;
}

interface IAnnouncementListResponse {
    data: IAnnouncement[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface ICreateAnnouncementRequest {
    academic_year_id?: number;
    title?: string;
    description?: string;
    announcement_type?: string;
    priority?: AnnouncementPriority;
    created_by: number;
    target_audience: string;
    target_classes?: number[];
    target_sections?: number[];
    target_users?: number[];
    is_published: boolean;
    publish_date?: string;
    expiry_date?: string;
    attachments?: string[];
}

interface IUpdateAnnouncementRequest {
    academic_year_id?: number;
    title?: string;
    description?: string;
    announcement_type?: string;
    priority?: AnnouncementPriority;
    created_by: number;
    target_audience: string;
    target_classes?: number[];
    target_sections?: number[];
    target_users?: number[];
    is_published: boolean;
    publish_date?: string;
    expiry_date?: string;
    attachments?: string[];
}

class AnnouncementService {
    private baseUrl = '/announcements';


    // Get list of announcements with optional filtering
    async list(params?: IAnnouncementListParams): Promise<IAnnouncementListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/list/${schoolId}`, { params }) as unknown as ApiResponse;

        // Handle API response format
        const announcements = response.announcements || response.data || [];
        const total = response.total || announcements.length;
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const totalPages = response.totalPages || Math.ceil(total / limit);

        return {
            data: announcements,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }


    // Get single announcement by ID
    async getById(id: string | number): Promise<IAnnouncement> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/get-by-id/${schoolId}/${id}`) as unknown as ApiResponse<IAnnouncement>;
        return response.data as IAnnouncement;
    }


    // Create new announcement
    async create(data: ICreateAnnouncementRequest): Promise<IAnnouncement> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/${schoolId}`, data) as unknown as ApiResponse<IAnnouncement>;
        if (response.code === 201 && response.status === 'success') {
            return response.data as IAnnouncement;
        }
        throw new Error(response.message || 'Failed to create announcement');
    }


    // Update announcement
    async update(id: string, data: IUpdateAnnouncementRequest): Promise<IAnnouncement> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/${schoolId}/${id}`, data) as unknown as ApiResponse<IAnnouncement>;
        if (response.code === 200 && response.status === 'success') {
            return response.data as IAnnouncement;
        }
        throw new Error(response.message || 'Failed to update announcement');
    }


    // Delete announcement 
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/${id}/${schoolId}`) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete announcement');
        }
    }


    // Publish announcement 
    async publish(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/${id}/publish/${schoolId}`) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to publish announcement');
        }
    }


    // Archive announcement 
    async archive(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/${id}/archive/${schoolId}`) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to archive announcement');
        }
    }


    // Get announcements for current user 
    async getMyAnnouncements(page = 1, limit = 20): Promise<IAnnouncementListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/me/${schoolId}`, {
            params: { page, limit },
        }) as unknown as ApiResponse<IAnnouncementListResponse>;
        return response as unknown as IAnnouncementListResponse;
    }


    // Bulk delete announcements 
    async bulkDelete(ids: string[]): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/bulk-delete/${schoolId}`, { ids }) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete announcements');
        }
    }


    // Export announcements to CSV 
    async exportToCSV(params?: IAnnouncementListParams): Promise<Blob> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/export/csv/${schoolId}`, {
            params,
            responseType: 'blob',
        }) as unknown as ApiResponse<Blob>;
        return response.data as Blob;
    }
}

// Export singleton instance
export const announcementService = new AnnouncementService();
