
// Student Service
// Handles API calls for student management operations


import { getApiClient, getSchoolId } from '../api/client';

interface IStudentListParams {
    search?: string;
    gender?: string;
    status?: string;
    page?: number;
    limit?: number;
}

interface IStudentListResponse {
    data: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class StudentService {
    private baseUrl = '/students';


    // Get list of students with pagination
    async list(params?: IStudentListParams): Promise<IStudentListResponse> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        try {
            const response = await api.get(`${this.baseUrl}/list/${schoolId}`, { params });

            // Handle both old and new response formats
            if (response?.data && response?.meta) {
                // New format: { data: [], meta: { total, page, limit, totalPages } }
                return response;
            } else if (response.data?.students) {
                // Legacy format: { students: [] }
                return {
                    data: response.data.students,
                    meta: {
                        total: response.data.students.length,
                        page: 1,
                        limit: response.data.students.length,
                        totalPages: 1
                    }
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch students');
        }
    }


    // Get single student by ID 
    async getById(id: string): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(`${this.baseUrl}/get-by-id/${schoolId}/${id}`);
        return response.student;
    }


    // Create new student - Single
    async create(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/create/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to create student');
    }


    // Update student 
    async update(id: string, data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.put(`${this.baseUrl}/update/${schoolId}/${id}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response.data;
        }
        throw new Error(response?.message || 'Failed to update student');
    }


    // Delete student 
    async delete(id: string): Promise<void> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.delete(`${this.baseUrl}/delete/${id}/${schoolId}`);
        if (response.code !== 200 || response.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete student');
        }
    }


    // Bulk create students 
    async bulkCreate(studentsData: any[], defaultPassword: string = 'Admin@123'): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/bulk-create/${schoolId}`, {
            students: studentsData,
            default_password: defaultPassword,
        });
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to bulk create students');
    }


    // Get Section Specific Students
    async getSectionStudents(
        academicYearId: string,
        sectionId: string,
        page: number = 1,
        limit: number = 10,
        search: string = '',
        gender: string = '',
        status: string = ''
    ): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.get(
            `${this.baseUrl}/list/inSection/${schoolId}/${academicYearId}/${sectionId}`,
            {
                params: {
                    page,
                    limit,
                    search,
                    gender,
                    status
                }
            }
        );
        return response;
    }


    // Promote student to another class/section/academic year
    async promoteStudent(data: any): Promise<any> {
        const api = getApiClient();
        const schoolId = getSchoolId();

        if (!schoolId) {
            throw new Error('School ID not found. Please log in again.');
        }

        const response = await api.post(`${this.baseUrl}/promote/${schoolId}`, data);
        if (response.code === 200 && response.status === 'success') {
            return response?.data;
        }
        throw new Error(response.data?.message || 'Failed to promote student');
    }
}

export const studentService = new StudentService();
