
// Attendance Service
// Handles API calls for attendance management operations
// Uses centralized API client from services/api/client.ts


import { getApiClient, getSchoolId } from '../api/client';
import { IAttendanceRecord, AttendanceStatus } from '../../types/index';

// API Response interface for type assertions
// The axios interceptor returns response.data directly, so we need this for type safety
interface ApiResponse<T = unknown> {
    code?: number;
    status?: string;
    message?: string;
    data?: T;
    attendance?: IAttendanceRecord[];
    total?: number;
    totalPages?: number;
}

interface IAttendanceListParams {
    classId?: string;
    studentId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: AttendanceStatus;
    page?: number;
    limit?: number;
}

interface IAttendanceListResponse {
    data: IAttendanceRecord[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface IMarkAttendanceRequest {
    classId: string;
    date: string;
    attendance: Array<{
        studentId: string;
        status: AttendanceStatus;
        remarks?: string;
    }>;
}

class AttendanceService {
    private baseUrl = '/attendance';


    // Get list of attendance records with optional filtering 
    async list(params?: IAttendanceListParams): Promise<IAttendanceListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/list/${schoolId}`, { params }) as unknown as ApiResponse<IAttendanceRecord[]>;

        // Handle API response format
        const records = response.attendance || response.data || [];
        const total = response.total || records.length;
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const totalPages = response.totalPages || Math.ceil(total / limit);

        return {
            data: records,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }


    // Get single attendance record by ID 
    async getById(id: string): Promise<IAttendanceRecord> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/${id}/${schoolId}`) as unknown as ApiResponse<IAttendanceRecord>;
        return response.data as IAttendanceRecord;
    }


    // Mark attendance for a class on a specific date 
    async markAttendance(data: IMarkAttendanceRequest): Promise<IAttendanceRecord[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/mark/${schoolId}`, data) as unknown as ApiResponse<IAttendanceRecord[]>;
        if (response.code === 200 && response.status === 'success') {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to mark attendance');
    }


    // Update single attendance record 
    async update(id: string, data: Partial<IAttendanceRecord>): Promise<IAttendanceRecord> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/${id}/${schoolId}`, data) as unknown as ApiResponse<IAttendanceRecord>;
        if (response.code === 200 && response.status === 'success') {
            return response.data as IAttendanceRecord;
        }
        throw new Error(response.message || 'Failed to update attendance');
    }


    // Delete attendance record 
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/${id}/${schoolId}`) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete attendance');
        }
    }


    // Get attendance summary for a class 
    async getClassSummary(
        classId: string,
        startDate: string,
        endDate: string
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/class/${classId}/summary/${schoolId}`, {
            params: { startDate, endDate },
        }) as unknown as ApiResponse;
        return response.data || response;
    }


    // Get attendance summary for a student 
    async getStudentSummary(
        studentId: string,
        startDate: string,
        endDate: string
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/student/${studentId}/summary/${schoolId}`, {
            params: { startDate, endDate },
        }) as unknown as ApiResponse;
        return response.data || response;
    }


    // Get students in a class for marking attendance 
    async getClassStudentsForAttendance(classId: string, date?: string): Promise<any[]> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/class/${classId}/students/${schoolId}`, {
            params: { date },
        }) as unknown as ApiResponse<unknown[]>;
        return response.data || [];
    }


    // Get attendance report for class 
    async getClassReport(
        classId: string,
        startDate: string,
        endDate: string,
        limit: number = 100
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/class/${classId}/report/${schoolId}`, {
            params: { startDate, endDate, limit },
        }) as unknown as ApiResponse;
        return response.data || response;
    }


    // Bulk mark attendance for multiple students (NEW RECORDS)
    async bulkRecordAttendance(
        data: {
            records: Array<{
                student_id: string;
                class_id: string;
                section_id: string;
                status: string;
                remarks?: string;
                date: string;
            }>;
            date: string;
            section_id: string;
            academic_year_id: string;
        }
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/record/bulk/${schoolId}`, data) as unknown as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to record attendance');
    }


    // Bulk update attendance for existing records
    async bulkUpdateAttendance(
        data: {
            records: Array<{
                student_id: string;
                class_id: string;
                section_id: string;
                status: string;
                remarks?: string;
                date: string;
                attendance_id?: string;
            }>;
            date: string;
            section_id: string;
            academic_year_id: string;
        }
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/update/bulk/${schoolId}`, data) as unknown as ApiResponse;
        if (response.code === 200 && response.status === 'success') {
            return response.data || [];
        }
        throw new Error(response.message || 'Failed to update attendance');
    }


    // Check if attendance exists for a date, class, and section
    async checkExistingAttendance(
        classId: string,
        sectionId: string,
        date: string,
        academicYearId: string
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/view/${schoolId}/${academicYearId}`, {
            params: {
                class_id: classId,
                section_id: sectionId,
                date: date
            }
        }) as unknown as ApiResponse;
        return response.data || null;
    }


    // Get monthly attendance report
    async getMonthlyAttendance(
        classId: string,
        sectionId: string,
        startDate: string,
        endDate: string,
        academicYearId: string
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/monthly/${schoolId}/${academicYearId}`, {
            params: {
                class_id: classId,
                section_id: sectionId,
                start_date: startDate,
                end_date: endDate
            }
        }) as unknown as ApiResponse;

        // API returns response in format: { code, status, data: { students: [...], dates: [...], summary: {...} } }
        if (response.code === 200 && response.data) {
            return response.data;
        }
        return null;
    }


    // Bulk mark attendance for multiple students (legacy method)
    async bulkMarkAttendance(
        classId: string,
        date: string,
        attendanceData: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>
    ): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/bulk-mark/${schoolId}`, {
            classId,
            date,
            attendance: attendanceData,
        }) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to bulk mark attendance');
        }
    }


    // Bulk delete attendance records 
    async bulkDelete(ids: string[]): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/bulk-delete/${schoolId}`, { ids }) as unknown as ApiResponse;
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.message || 'Failed to delete attendance records');
        }
    }


    // Export attendance to CSV 
    async exportToCSV(params?: IAttendanceListParams): Promise<Blob> {
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
export const attendanceService = new AttendanceService();
