import { studentService } from '@/services/modules/studentService';
import { useAuthStore } from '@/stores/authStore';
import { FC, useEffect, useMemo, useState } from 'react';

import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import {
    Button,
    FormField,
    FormInput,
    FormSelect,
    LoadingSpinner,
    PageHeader,
} from '../../components';
import DataTable from '../../components/tables/DataTable';
import { attendanceService } from '../../services/modules/attendanceService';
import { classService } from '../../services/modules/classService';
import { AttendanceStatus } from '../../types/index';

interface IAttendanceRow {
    studentId: string;
    full_name: string;
    studentEmail: string;
    studentRoll?: string;
    status: AttendanceStatus;
    remarks: string;
}

interface IFormData {
    classId: string;
    sectionId: string;
    date: string;
}

interface IFormErrors {
    [key: string]: string;
}


const MarkAttendance: FC = () => {
    const navigate = useNavigate();
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);
    const pageSize = 10;
    // State
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState<any | null>(null);
    const [allStudents, setAllStudents] = useState<IAttendanceRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<IFormErrors>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'ALL'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingAttendance, setExistingAttendance] = useState<any | null>(null);

    // Form state
    const [formData, setFormData] = useState<IFormData>({
        classId: '',
        sectionId: '',
        date: new Date().toISOString().split('T')[0], // Today's date
    });

    // Compute filtered and searched students
    const filteredStudents = useMemo(() => {
        return allStudents.filter((student) => {
            const matchesSearch = searchQuery === '' ||
                student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (student.studentRoll?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

            const matchesFilter = filterStatus === 'ALL' || student.status === filterStatus;

            return matchesSearch && matchesFilter;
        });
    }, [allStudents, searchQuery, filterStatus]);

    // Paginate filtered students
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredStudents.slice(start, end);
    }, [filteredStudents, currentPage, pageSize]);

    // Count statistics
    const stats = useMemo(() => ({
        total: allStudents.length,
        present: allStudents.filter(s => s.status === AttendanceStatus.PRESENT).length,
        absent: allStudents.filter(s => s.status === AttendanceStatus.ABSENT).length,
        leave: allStudents.filter(s => s.status === AttendanceStatus.LEAVE).length,
        late: allStudents.filter(s => s.status === AttendanceStatus.LATE).length,
    }), [allStudents]);

    // Pagination object
    const pagination = {
        page: currentPage,
        pageSize: pageSize,
        total: filteredStudents.length,
        onPageChange: (page: number) => setCurrentPage(page),
    };

    // Fetch classes on mount
    useEffect(() => {
        fetchClasses();
    }, [academicYearVersion]);

    // Fetch sections when class changes
    useEffect(() => {
        if (formData.classId && selectedClass) {
            fetchSections();
        } else {
            setSections([]);
            setSelectedSection(null);
            setAllStudents([]);
        }
    }, [formData.classId, selectedClass]);

    // Fetch students when section and date changes
    useEffect(() => {
        if (formData.sectionId && selectedSection) {
            fetchSectionStudents();
        } else {
            setAllStudents([]);
        }
    }, [formData.sectionId, selectedSection, formData.date]);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const response = await classService.list();
            setClasses(response);
        } catch (err: any) {
            toast.error('Failed to load classes');
            console.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSections = async () => {
        try {
            setLoading(true);
            const response = await classService.getSections(selectedClass);
            setSections(response || []);
        } catch (err: any) {
            toast.error('Failed to load sections');
            console.error(err.message);
            setSections([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSectionStudents = async () => {
        try {
            setLoading(true);
            setLoadingStudents(true);
            const authUser = useAuthStore.getState().user;
            if (!authUser) {
                toast.error('User not authenticated');
                return;
            }

            // Fetch all students at once (no pagination from API, we'll handle it client-side)
            let allData: any[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const classStudents = await studentService.getSectionStudents(
                    authUser.current_academic_year.id.toString(),
                    formData.sectionId,
                    page,
                    100, // Fetch 100 records per API call
                    '',
                    '',
                    ''
                );

                if (classStudents.data && classStudents.data.length > 0) {
                    allData = [...allData, ...classStudents.data];
                    page++;
                    hasMore = classStudents.data.length === 100;
                } else {
                    hasMore = false;
                }
            }

            // Check if attendance already exists for this date, class, and section
            try {
                const existingData = await attendanceService.checkExistingAttendance(
                    formData.classId,
                    formData.sectionId,
                    formData.date,
                    authUser.current_academic_year.id.toString()
                );

                if (existingData.records && Array.isArray(existingData.records) && existingData.records.length > 0) {
                    setIsEditMode(true);
                    setExistingAttendance(existingData);

                    const attendanceRows = allData.map((student: any) => {
                        const existingRecord = existingData.records.find((r: any) => r.student?.id === student.id);
                        return {
                            studentId: student.id,
                            full_name: student.full_name,
                            studentEmail: student.email,
                            studentRoll: student.profile?.roll_no || '',
                            status: existingRecord?.status || AttendanceStatus.PRESENT,
                            remarks: existingRecord?.remarks || '',
                        };
                    });
                    setAllStudents(attendanceRows);
                    // toast.info('Existing attendance loaded - You are in EDIT mode', { duration: 3000 });
                } else {
                    // NEW MODE: Initialize with default status
                    console.log('Setting NEW MODE');
                    setIsEditMode(false);
                    setExistingAttendance(null);

                    const attendanceRows = allData.map((student: any) => ({
                        studentId: student.id,
                        full_name: student.full_name,
                        studentEmail: student.email,
                        studentRoll: student.profile?.roll_no || '',
                        status: AttendanceStatus.PRESENT,
                        remarks: '',
                    }));
                    setAllStudents(attendanceRows);
                    // toast.info('No existing attendance found - You are in NEW mode', { duration: 3000 });
                }
            } catch (checkErr: any) {
                // If check fails, assume NEW mode
                console.warn('Could not check existing attendance:', checkErr.message);
                console.error('Check attendance error details:', checkErr);
                setIsEditMode(false);
                setExistingAttendance(null);

                const attendanceRows = allData.map((student: any) => ({
                    studentId: student.id,
                    full_name: student.full_name,
                    studentEmail: student.email,
                    studentRoll: student.profile?.roll_no || '',
                    status: AttendanceStatus.PRESENT,
                    remarks: '',
                }));
                setAllStudents(attendanceRows);
            }

            setCurrentPage(1); // Reset pagination
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.students;
                return newErrors;
            });
        } catch (err: any) {
            toast.error('Failed to load students');
            console.error(err.message);
            setAllStudents([]);
            setIsEditMode(false);
            setExistingAttendance(null);
        } finally {
            setLoadingStudents(false);
            setLoading(false);
        }
    };

    // Handle form input change
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Update selectedClass when classId changes
        if (name === 'classId') {
            setSelectedClass(value);
        }

        // Update selectedSection when sectionId changes
        if (name === 'sectionId') {
            setSelectedSection(value);
        }
    };

    // Handle quick status buttons - mark all as status
    const markAllStatus = (status: AttendanceStatus) => {
        setAllStudents((prev) =>
            prev.map((row) => ({
                ...row,
                status,
            }))
        );
        toast.success(`Marked all as ${status}`);
    };

    // Handle student status change
    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAllStudents((prev) =>
            prev.map((row) =>
                row.studentId === studentId ? { ...row, status } : row
            )
        );
    };

    // Handle remarks change
    const handleRemarksChange = (studentId: string, remarks: string) => {
        setAllStudents((prev) =>
            prev.map((row) =>
                row.studentId === studentId ? { ...row, remarks } : row
            )
        );
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: IFormErrors = {};

        if (!formData.classId) {
            newErrors.classId = 'Class is required';
        }

        if (!formData.sectionId) {
            newErrors.sectionId = 'Section is required';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        if (allStudents.length === 0) {
            newErrors.students = 'No students available for this section';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(isEditMode);
        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);
        try {
            const authUser = useAuthStore.getState().user;
            if (!authUser?.current_academic_year?.id) {
                toast.error('Academic year not set');
                return;
            }

            // Prepare records for submission
            const recordsToSubmit = allStudents.map((row) => ({
                student_id: row.studentId,
                class_id: formData.classId,
                section_id: formData.sectionId,
                status: row.status,
                remarks: row.remarks || undefined,
                date: formData.date,
                attendance_id: isEditMode
                    ? existingAttendance?.records?.find((r: any) => r.student?.id === row.studentId)?.id
                    : undefined,
            }));

            // Call appropriate API based on mode (already determined during fetch)
            if (isEditMode) {
                await attendanceService.bulkUpdateAttendance({
                    records: recordsToSubmit,
                    date: formData.date,
                    section_id: formData.sectionId,
                    academic_year_id: authUser.current_academic_year.id.toString(),
                });
                toast.success(`✅ Attendance updated for ${allStudents.length} student(s)`);
            } else {
                await attendanceService.bulkRecordAttendance({
                    records: recordsToSubmit,
                    date: formData.date,
                    section_id: formData.sectionId,
                    academic_year_id: authUser.current_academic_year.id.toString(),
                });
                toast.success(`✅ Attendance marked for ${allStudents.length} student(s)`);
            }

            // Reset form
            setTimeout(() => {
                setFormData({
                    classId: '',
                    sectionId: '',
                    date: new Date().toISOString().split('T')[0],
                });
                setAllStudents([]);
                setSelectedClass(null);
                setSelectedSection(null);
                setSections([]);
                setSearchQuery('');
                setFilterStatus('ALL');
                setCurrentPage(1);
                setIsEditMode(false);
                setExistingAttendance(null);
            }, 1500);
        } catch (err: any) {
            console.error('Error marking attendance:', err);
            toast.error(err.message || 'Failed to mark attendance');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Mark Attendance"
                subtitle="Record and manage student attendance efficiently"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Attendance', href: '#' },
                    { label: 'Mark', href: '#' },
                ]}
            />


            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Class & Date Selection Section - NOT in form */}
                <div className="space-y-8">
                    {/* Class & Date Selection Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Class Selection */}
                        <FormField
                            label="Select Class"
                            required
                            error={errors.classId}
                        >
                            <FormSelect
                                name="classId"
                                value={formData.classId}
                                onChange={handleFormChange}
                                options={classes.map((cls) => ({
                                    label: `${cls.class_name}`,
                                    value: cls.id,
                                }))}
                                placeholder="Choose a class"
                                required
                            />
                            {errors.classId && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.classId}</p>
                            )}
                        </FormField>

                        {/* Section Selection */}
                        <FormField
                            label="Select Section"
                            required
                            error={errors.sectionId}
                        >
                            <FormSelect
                                name="sectionId"
                                value={formData.sectionId}
                                onChange={handleFormChange}
                                options={sections.map((sec) => ({
                                    label: `${sec.section_name || sec.name || 'Section'}`,
                                    value: sec.id,
                                }))}
                                placeholder={sections.length === 0 ? 'Select class first' : 'Choose a section'}
                                disabled={!selectedClass}
                                required
                            />
                            {errors.sectionId && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.sectionId}</p>
                            )}
                        </FormField>

                        {/* Date Selection */}
                        <FormField
                            label="Attendance Date"
                            required
                            error={errors.date}
                        >
                            <FormInput
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleFormChange}
                                required
                            />
                            {errors.date && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
                            )}
                        </FormField>
                    </div>

                    {loading ? (
                        <LoadingSpinner message="Loading ..." />
                    ) : (
                        <>
                            {/* Students Attendance Section - Table */}
                            {formData.classId && formData.sectionId && allStudents.length > 0 && (
                                <div>
                                    <div className="flex flex-col gap-4 mb-6">
                                        {/* Section Header with Mode Indicator */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                    <span className="text-lg">👥</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Student Attendance
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Manage attendance for {stats.total} student(s)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mode Badge */}
                                            <div className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 ${isEditMode
                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                }`}>
                                                {isEditMode ? (
                                                    <>
                                                        <span>📝</span>
                                                        <span>EDIT MODE</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>✨</span>
                                                        <span>NEW MODE</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                                            </div>
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                                                <p className="text-lg font-bold text-green-700 dark:text-green-400">{stats.present}</p>
                                                <p className="text-xs text-green-600 dark:text-green-400">Present</p>
                                            </div>
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
                                                <p className="text-lg font-bold text-red-700 dark:text-red-400">{stats.absent}</p>
                                                <p className="text-xs text-red-600 dark:text-red-400">Absent</p>
                                            </div>
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                                                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{stats.leave}</p>
                                                <p className="text-xs text-yellow-600 dark:text-yellow-400">Leave</p>
                                            </div>
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                                                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{stats.late}</p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">Late</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Quick Actions - Mark All As:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => markAllStatus(AttendanceStatus.PRESENT)}
                                                className="px-4 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                            >
                                                All Present
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => markAllStatus(AttendanceStatus.ABSENT)}
                                                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                All Absent
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => markAllStatus(AttendanceStatus.LEAVE)}
                                                className="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                                            >
                                                All Leave
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => markAllStatus(AttendanceStatus.LATE)}
                                                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                            >
                                                All Late
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search and Filter */}
                                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, or roll number..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | 'ALL')}
                                            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="ALL">Filter by Status: All</option>
                                            {Object.values(AttendanceStatus).map((status) => (
                                                <option key={status} value={status}>
                                                    {status === AttendanceStatus.PRESENT && '✅ Present'}
                                                    {status === AttendanceStatus.ABSENT && '❌ Absent'}
                                                    {status === AttendanceStatus.LEAVE && '📋 Leave'}
                                                    {status === AttendanceStatus.LATE && '⏰ Late'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Students Table */}
                                    <DataTable
                                        columns={[
                                            {
                                                key: 'full_name',
                                                label: 'Student Name',
                                                width: '200px',
                                                render: (_value, row) => (
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{row.full_name}</p>
                                                        {row.studentRoll && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Roll: {row.studentRoll}
                                                            </p>
                                                        )}
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: 'studentEmail',
                                                label: 'Email',
                                                width: '200px',
                                                render: (value) => (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                        {value}
                                                    </p>
                                                ),
                                            },
                                            {
                                                key: 'status',
                                                label: 'Status',
                                                width: '200px',
                                                render: (_value, row) => (
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {Object.values(AttendanceStatus).map((status) => (
                                                            <button
                                                                key={status}
                                                                type="button"
                                                                onClick={() => handleStatusChange(row.studentId, status as AttendanceStatus)}
                                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${row.status === status
                                                                    ? status === AttendanceStatus.PRESENT
                                                                        ? 'bg-green-500 text-white'
                                                                        : status === AttendanceStatus.ABSENT
                                                                            ? 'bg-red-500 text-white'
                                                                            : status === AttendanceStatus.LEAVE
                                                                                ? 'bg-yellow-500 text-white'
                                                                                : 'bg-blue-500 text-white'
                                                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                                                    }`}
                                                            >
                                                                {status === AttendanceStatus.PRESENT && 'P'}
                                                                {status === AttendanceStatus.ABSENT && 'A'}
                                                                {status === AttendanceStatus.LEAVE && 'L'}
                                                                {status === AttendanceStatus.LATE && 'Lt'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ),
                                            },
                                            {
                                                key: 'remarks',
                                                label: 'Remarks',
                                                width: '200px',
                                                render: (_value, row) => (
                                                    <input
                                                        type="text"
                                                        placeholder="Add remark..."
                                                        value={row.remarks}
                                                        onChange={(e) => handleRemarksChange(row.studentId, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                ),
                                            },
                                        ]}
                                        data={paginatedStudents}
                                        loading={loadingStudents}
                                        pagination={pagination}
                                        emptyMessage="No students found. Try adjusting your search or filter criteria."
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Error Message */}
                    {errors.students && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{errors.students}</p>
                        </div>
                    )}

                    {/* Form Actions - ONLY THIS SECTION IS IN A FORM */}
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => navigate('/attendance')}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                isLoading={isSubmitting}
                                loadingText={isEditMode ? 'Updating...' : 'Marking...'}
                                disabled={allStudents.length === 0 || isSubmitting}
                            >
                                {isEditMode
                                    ? `📝 Update Attendance for ${allStudents.length} Student(s)`
                                    : `✅ Mark Attendance for ${allStudents.length} Student(s)`
                                }
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>💡 Tip:</strong> Select a class, section, and date to load students. Use Quick Actions to mark all students at once, or click individual status buttons. Search and filter help you find specific students quickly.
                </p>
            </div>
        </div>
    );
};

export default MarkAttendance;
