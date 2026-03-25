
// Room Service
// Handles API calls for room management operations
// Uses centralized API client from services/api/client.ts


import { getApiClient, getSchoolId } from '../api/client';

interface IRoomListResponse {
    data: any[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class RoomService {
    private baseUrl = '/rooms';


    // Get list of rooms with optional filtering
    async list(filters?: { room_type?: string; building?: string; is_active?: boolean }): Promise<IRoomListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/list/${schoolId}`, { params: filters });
        return response.data;
    }


    // Get single room by ID
    async getById(id: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${id}/${schoolId}`);
        return response.data;
    }


    // Create new room
    async create(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/room/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response?.message || 'Failed to create room');
    }


    // Update room
    async update(id: string, data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/room/${schoolId}/${id}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response?.message || 'Failed to update room');
    }


    // Delete room
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/room/${schoolId}/${id}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response?.message || 'Failed to delete room');
        }
    }


    // Get available rooms (optionally filtered by type)
    async getAvailable(roomType?: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const params: any = {};
        if (roomType) params.room_type = roomType;

        const response = await api.get(`${this.baseUrl}/available/${schoolId}`, { params });
        return response.data;
    }
}

// Export singleton instance
export const roomService = new RoomService();
