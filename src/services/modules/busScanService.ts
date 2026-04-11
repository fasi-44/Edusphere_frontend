import { getApiClient, getSchoolId } from '../api/client';
import { API_ENDPOINTS } from '../api/config';

export type ScanType = 'CHECK_IN' | 'CHECK_OUT';

export interface BusScanRecord {
    id: number;
    student_user_id: number;
    student_name: string | null;
    scan_type: ScanType;
    scanned_at: string;
    scanned_by_user_id: number | null;
    staff_name: string | null;
    academic_year_id: number | null;
    location: string | null;
}

export interface ScanPayload {
    student_user_id: number;
    scan_type: ScanType;
    academic_year_id?: number;
    location?: string;
}

export interface StudentSearchResult {
    id: number;
    full_name: string;
    roll_no: string;
    admission_number: string;
}

export interface QrScanPayload {
    qr_data: string;
    scan_type: ScanType;
    academic_year_id?: number;
    location?: string;
}

const busScanService = {
    /** Record a manual check-in / check-out */
    recordScan: async (payload: ScanPayload): Promise<BusScanRecord> => {
        const skid = getSchoolId();
        const client = getApiClient();
        const res = await client.post(API_ENDPOINTS.BUS_SCAN.SCAN(skid), payload);
        return (res as any).data;
    },

    /** Record a scan from a decoded QR payload string */
    scanQr: async (payload: QrScanPayload): Promise<{ student_user_id: number; data: BusScanRecord }> => {
        const skid = getSchoolId();
        const client = getApiClient();
        const res = await client.post(API_ENDPOINTS.BUS_SCAN.SCAN_QR(skid), payload);
        return res as any;
    },

    /** Get all bus scan records for a given date (defaults to today) */
    getToday: async (academicYearId?: number, forDate?: string): Promise<BusScanRecord[]> => {
        const skid = getSchoolId();
        const client = getApiClient();
        const params: Record<string, unknown> = {};
        if (academicYearId) params.academic_year_id = academicYearId;
        if (forDate) params.date = forDate;
        const res = await client.get(API_ENDPOINTS.BUS_SCAN.TODAY(skid), { params });
        return (res as any).data ?? [];
    },

    /** Get current bus status — last scan per student today */
    getStatus: async (academicYearId?: number): Promise<BusScanRecord[]> => {
        const skid = getSchoolId();
        const client = getApiClient();
        const params: Record<string, unknown> = {};
        if (academicYearId) params.academic_year_id = academicYearId;
        const res = await client.get(API_ENDPOINTS.BUS_SCAN.STATUS(skid), { params });
        return (res as any).data ?? [];
    },

    /** Get bus history for a specific student */
    getStudentHistory: async (studentUserId: number, limit = 50): Promise<BusScanRecord[]> => {
        const skid = getSchoolId();
        const client = getApiClient();
        const res = await client.get(
            API_ENDPOINTS.BUS_SCAN.STUDENT_HISTORY(skid, studentUserId),
            { params: { limit } }
        );
        return (res as any).data ?? [];
    },

    /** Search students by name or admission number */
    searchStudents: async (query: string): Promise<StudentSearchResult[]> => {
        const skid = getSchoolId();
        const client = getApiClient();
        const res = await client.get(API_ENDPOINTS.BUS_SCAN.SEARCH_STUDENTS(skid), { params: { q: query } });
        return (res as any).data ?? [];
    },
};

export { busScanService };
