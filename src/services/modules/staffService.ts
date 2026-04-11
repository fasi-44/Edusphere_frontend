import { getApiClient, getSchoolId } from '../api/client';
import { API_ENDPOINTS } from '../api/config';

export interface CreateStaffPayload {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: string;           // 'PRINCIPAL' | 'BUS_STAFF'
    phone?: string;
    designation?: string;
    employee_id?: string;
}

export interface StaffMember {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string | null;
    role_id: number;
    role: any;
    profile: any;
    is_active: boolean;
}

const staffService = {
    create: async (payload: CreateStaffPayload): Promise<StaffMember> => {
        const skid = getSchoolId();
        const client = getApiClient();
        const res = await client.post(API_ENDPOINTS.STAFF.CREATE(skid), payload) as any;
        if (res.code === 200 && res.status === 'success') {
            return res.user;
        }
        throw new Error(res.message || 'Failed to create staff member');
    },

    list: async (): Promise<StaffMember[]> => {
        const skid = getSchoolId();
        const client = getApiClient();
        const res = await client.get(API_ENDPOINTS.STAFF.LIST(skid)) as any;
        return res.data ?? [];
    },
};

export { staffService };
