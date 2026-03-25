import { FC, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    FormField,
    FormInput,
    FormSelect,
    LoadingSpinner,
    EmptyState,
    PrintActions,
} from '../../components';
import DataTable from '../../components/tables/DataTable';
import { attendanceService } from '../../services/modules/attendanceService';
import { classService } from '../../services/modules/classService';
import { useAuthStore } from '@/stores/authStore';
import { AttendanceStatus } from '../../types/index';
import { generateAttendanceReport } from '../../prints';
import type { SchoolData, PdfAction, AttendanceReportData } from '../../prints';

interface IAttendanceRecord {
    id: string;
    student_id: string;
    student_name?: string;
    student?: { id: string; full_name: string };
    status: AttendanceStatus;
    remarks?: string;
    date: string;
    class_id?: string;
    section_id?: string;
}

interface IFilterParams {
    classId: string;
    sectionId: string;
    date: string;
    startDate: string;
    endDate: string;
    viewType: 'single' | 'monthly';
}

const AttendanceReport: FC = () => {
    const navigate = useNavigate();
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);

    // State
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<IAttendanceRecord[]>([]);
    const [monthlyData, setMonthlyData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    // Filter state
    const [filters, setFilters] = useState<IFilterParams>({
        classId: '',
        sectionId: '',
        date: new Date().toISOString().split('T')[0],
        startDate: new Date(new Date().setDate(new Date().getDate() - 30))
            .toISOString()
            .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        viewType: 'single',
    });

    // Fetch classes on mount
    useEffect(() => {
        fetchClasses();
    }, [academicYearVersion]);

    // Fetch sections when class changes
    useEffect(() => {
        if (filters.classId && selectedClass) {
            fetchSections();
        } else {
            setSections([]);
        }
    }, [filters.classId, selectedClass]);

    // Auto-fetch attendance when all params are set
    useEffect(() => {
        if (filters.classId && filters.sectionId && filters.viewType === 'single' && filters.date) {
            fetchAttendance();
        }
    }, [filters.classId, filters.sectionId, filters.date]);

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
        setLoading(true);
        try {
            const response = await classService.getSections(filters.classId);
            setSections(response || []);
        } catch (err: any) {
            toast.error('Failed to load sections');
            console.error(err.message);
            setSections([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const authUser = useAuthStore.getState().user;
            if (!authUser?.current_academic_year?.id) {
                toast.error('Academic year not set');
                return;
            }

            if (filters.viewType === 'single') {
                fetchSingleDayAttendance(authUser);
            } else {
                fetchMonthlyAttendance(authUser);
            }
        } catch (err: any) {
            toast.error('Failed to fetch attendance');
            console.error(err.message);
        }
    };

    const fetchSingleDayAttendance = async (authUser: any) => {
        try {
            setLoading(true);
            const existingData = await attendanceService.checkExistingAttendance(
                filters.classId,
                filters.sectionId,
                filters.date,
                authUser.current_academic_year.id.toString()
            );

            if (existingData?.records && existingData.records.length > 0) {
                setAttendanceRecords(existingData.records);
                setCurrentPage(1);
            } else {
                setAttendanceRecords([]);
            }
        } catch (err: any) {
            console.error('Error fetching single day attendance:', err);
            setAttendanceRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyAttendance = async (authUser: any) => {
        try {
            setLoading(true);
            // Using the monthly endpoint from the old API
            const response = await attendanceService.getMonthlyAttendance?.(
                filters.classId,
                filters.sectionId,
                filters.startDate,
                filters.endDate,
                authUser.current_academic_year.id.toString()
            );
            console.log(response)

            if (response) {
                setMonthlyData(response);
                setCurrentPage(1);
            } else {
                setMonthlyData(null);
            }
        } catch (err: any) {
            console.error('Error fetching monthly attendance:', err);
            setMonthlyData(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle filter change
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Update selectedClass when classId changes
        if (name === 'classId') {
            setSelectedClass(value);
        }

        // Reset page when filters change
        setCurrentPage(1);
    };

    // Handle view type change
    const handleViewTypeChange = (viewType: 'single' | 'monthly') => {
        setFilters((prev) => ({
            ...prev,
            viewType,
        }));
        setCurrentPage(1);
    };

    // Get status color
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            [AttendanceStatus.PRESENT]: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            [AttendanceStatus.ABSENT]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            [AttendanceStatus.LEAVE]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            [AttendanceStatus.LATE]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            'Not Marked': 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400',
        };
        return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    };

    // Compute stats
    const stats = useMemo(() => {
        if (!attendanceRecords.length) return null;
        return {
            total: attendanceRecords.length,
            present: attendanceRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length,
            absent: attendanceRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length,
            leave: attendanceRecords.filter((r) => r.status === AttendanceStatus.LEAVE).length,
            late: attendanceRecords.filter((r) => r.status === AttendanceStatus.LATE).length,
        };
    }, [attendanceRecords]);

    // Paginate records
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return attendanceRecords.slice(start, start + pageSize);
    }, [attendanceRecords, currentPage]);

    const pagination = {
        page: currentPage,
        pageSize: pageSize,
        total: attendanceRecords.length,
        onPageChange: (page: number) => setCurrentPage(page),
    };

    // Build school data for PDF header from auth user
    const getSchoolData = useCallback((): SchoolData => {
        const authUser = useAuthStore.getState().user;
        return {
            schoolName: authUser?.school_name || 'School Name',
            schoolAddress: '', // Can be extended when institution details API is available
            schoolPhone: '',
            schoolEmail: authUser?.email || '',
            logo: null,
            generatedBy: authUser?.full_name || authUser?.name || 'System',
        };
    }, []);

    // Get selected class/section names from current filter IDs
    const getSelectedClassName = useCallback(() => {
        const cls = classes.find((c) => String(c.id) === String(filters.classId));
        return cls?.class_name || cls?.name || '';
    }, [classes, filters.classId]);

    const getSelectedSectionName = useCallback(() => {
        const sec = sections.find((s) => String(s.id) === String(filters.sectionId));
        return sec?.section_name || sec?.name || '';
    }, [sections, filters.sectionId]);

    // Handle PDF generation (download / print / open)
    const handlePrintReport = useCallback(async (action: PdfAction) => {
        try {
            const className = getSelectedClassName();
            const sectionName = getSelectedSectionName();
            const schoolData = getSchoolData();

            if (filters.viewType === 'single') {
                if (!attendanceRecords.length || !stats) {
                    toast.error('No attendance data to generate report');
                    return;
                }

                const reportData: AttendanceReportData = {
                    type: 'single',
                    date: filters.date,
                    className,
                    sectionName,
                    records: attendanceRecords.map((r) => ({
                        student: {
                            roll_no: (r as any).student?.roll_no || '',
                            name: (r as any).student?.name || r.student_name || '',
                        },
                        status: r.status,
                        remarks: r.remarks,
                    })),
                    statistics: {
                        total_students: stats.total,
                        present: stats.present,
                        absent: stats.absent,
                        late: stats.late,
                        attendance_rate: stats.total > 0
                            ? Math.round((stats.present / stats.total) * 100)
                            : 0,
                    },
                };

                await generateAttendanceReport(reportData, schoolData, action);
                toast.success(`Report ${action === 'download' ? 'downloaded' : action === 'print' ? 'sent to printer' : 'opened'} successfully`);
            } else {
                if (!monthlyData?.students?.length) {
                    toast.error('No monthly data to generate report');
                    return;
                }

                const reportData: AttendanceReportData = {
                    type: 'monthly',
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    className,
                    sectionName,
                    records: {
                        students: monthlyData.students.map((s: any) => ({
                            student: {
                                roll_no: s.student?.roll_no || '',
                                name: s.student?.name || '',
                            },
                            daily_attendance: s.daily_attendance || [],
                            summary: {
                                total_days: s.summary?.total_days || 0,
                                present_count: s.summary?.present_count || 0,
                                absent_count: s.summary?.absent_count || 0,
                                late_count: s.summary?.late_count || 0,
                                leave_count: s.summary?.leave_count || 0,
                                attendance_percentage: s.summary?.attendance_percentage || 0,
                            },
                        })),
                        dates: monthlyData.dates || [],
                        summary: monthlyData.summary || {
                            total_students: monthlyData.students.length,
                            total_days: monthlyData.dates?.length || 0,
                            total_present: monthlyData.students.reduce(
                                (sum: number, s: any) => sum + (s.summary?.present_count || 0), 0
                            ),
                            overall_attendance_rate: 0,
                        },
                    },
                };

                await generateAttendanceReport(reportData, schoolData, action);
                toast.success(`Report ${action === 'download' ? 'downloaded' : action === 'print' ? 'sent to printer' : 'opened'} successfully`);
            }
        } catch (err: any) {
            console.error('Error generating report:', err);
            toast.error('Failed to generate report');
        }
    }, [filters, attendanceRecords, monthlyData, stats, classes, sections, getSchoolData, getSelectedClassName, getSelectedSectionName]);

    // Whether print buttons should be enabled
    const canPrint = filters.viewType === 'single'
        ? attendanceRecords.length > 0
        : !!monthlyData?.students?.length;

    return (
        <div className="space-y-6 overflow-hidden">
            {/* Page Header */}
            <PageHeader
                title="Attendance Report"
                subtitle="View and analyze attendance records"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Attendance', href: '#' },
                    { label: 'Report', href: '#' },
                ]}
            />

            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* View Type Tabs */}
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
                    <button
                        onClick={() => handleViewTypeChange('single')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${filters.viewType === 'single'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                            }`}
                    >
                        Single Day View
                    </button>
                    <button
                        onClick={() => handleViewTypeChange('monthly')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${filters.viewType === 'monthly'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                            }`}
                    >
                        Monthly View
                    </button>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                    <FormField label="Class" required>
                        <FormSelect
                            name="classId"
                            value={filters.classId}
                            onChange={handleFilterChange}
                            options={classes.map((cls) => ({
                                label: cls.class_name || cls.name,
                                value: cls.id,
                            }))}
                            placeholder="Select class"
                            required
                        />
                    </FormField>

                    <FormField label="Section" required>
                        <FormSelect
                            name="sectionId"
                            value={filters.sectionId}
                            onChange={handleFilterChange}
                            options={sections.map((sec) => ({
                                label: sec.section_name || sec.name,
                                value: sec.id,
                            }))}
                            placeholder={!filters.classId ? 'Select class first' : 'Select section'}
                            disabled={!filters.classId}
                            required
                        />
                    </FormField>

                    {filters.viewType === 'single' ? (
                        <FormField label="Date">
                            <FormInput
                                name="date"
                                type="date"
                                value={filters.date}
                                onChange={handleFilterChange}
                            />
                        </FormField>
                    ) : (
                        <>
                            <FormField label="Start Date">
                                <FormInput
                                    name="startDate"
                                    type="date"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                />
                            </FormField>
                            <FormField label="End Date">
                                <FormInput
                                    name="endDate"
                                    type="date"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                />
                            </FormField>
                        </>
                    )}

                    {filters.viewType === 'monthly' && (
                        <div className="flex items-end">
                            <Button
                                variant="primary"
                                onClick={fetchAttendance}
                                disabled={!filters.classId || !filters.sectionId}
                                className="w-full"
                            >
                                View Report
                            </Button>
                        </div>
                    )}
                </div>

                {/* Data Content */}
                {loading && !attendanceRecords.length ? (
                    <div className="p-6 pt-0">
                        <LoadingSpinner message="Loading attendance..." />
                    </div>
                ) : (
                    <>
                        {/* Single Day View */}
                        {filters.viewType === 'single' && (
                            <>
                                {stats ? (
                                    <div className="space-y-6 p-6 pt-0">
                                        {/* Statistics Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                                            </div>
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                                                <p className="text-lg font-bold text-green-700 dark:text-green-400">{stats.present}</p>
                                                <p className="text-xs text-green-600 dark:text-green-400">Present</p>
                                            </div>
                                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
                                                <p className="text-lg font-bold text-red-700 dark:text-red-400">{stats.absent}</p>
                                                <p className="text-xs text-red-600 dark:text-red-400">Absent</p>
                                            </div>
                                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                                                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{stats.leave}</p>
                                                <p className="text-xs text-yellow-600 dark:text-yellow-400">Leave</p>
                                            </div>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                                                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{stats.late}</p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">Late</p>
                                            </div>
                                        </div>

                                        {/* Attendance Table */}
                                        <DataTable
                                            columns={[
                                                {
                                                    key: 'roll_no',
                                                    label: 'Roll no.',
                                                    width: '200px',
                                                    render: (value, row) => (
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {row.student?.roll_no || value || '-'}
                                                        </p>
                                                    ),
                                                },
                                                {
                                                    key: 'student_name',
                                                    label: 'Student Name',
                                                    width: '200px',
                                                    render: (value, row) => (
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {row.student?.name || value || '-'}
                                                        </p>
                                                    ),
                                                },
                                                {
                                                    key: 'status',
                                                    label: 'Status',
                                                    width: '150px',
                                                    render: (value) => (
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(value)}`}>
                                                            <span>{value}</span>
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    key: 'remarks',
                                                    label: 'Remarks',
                                                    width: '200px',
                                                    render: (value) => (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {value || '-'}
                                                        </p>
                                                    ),
                                                },
                                            ]}
                                            data={paginatedRecords}
                                            loading={loading}
                                            pagination={pagination}
                                            emptyMessage="No attendance records found for this date."
                                        />
                                    </div>
                                ) : (
                                    <div className="p-6 pt-0">
                                        <EmptyState
                                            icon="📋"
                                            title="No Data"
                                            description="Select a class, section, and date to view attendance."
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Monthly View */}
                        {filters.viewType === 'monthly' && monthlyData && (
                            <>
                                {/* Summary Statistics */}
                                {monthlyData.students && monthlyData.students.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-6 pb-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{monthlyData.students.length}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Students</p>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                                            <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                                {monthlyData.students.reduce((sum: number, s: any) => sum + (s.summary?.present_count || 0), 0)}
                                            </p>
                                            <p className="text-xs text-green-600 dark:text-green-400">Total Present</p>
                                        </div>
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
                                            <p className="text-lg font-bold text-red-700 dark:text-red-400">
                                                {monthlyData.students.reduce((sum: number, s: any) => sum + (s.summary?.absent_count || 0), 0)}
                                            </p>
                                            <p className="text-xs text-red-600 dark:text-red-400">Total Absent</p>
                                        </div>
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                                            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                                                {monthlyData.students.reduce((sum: number, s: any) => sum + (s.summary?.leave_count || 0), 0)}
                                            </p>
                                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Total Leave</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                                            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                                {monthlyData.students.reduce((sum: number, s: any) => sum + (s.summary?.late_count || 0), 0)}
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">Total Late</p>
                                        </div>
                                    </div>
                                )}

                                {/* Monthly Data Table - scrolls inside the card */}
                                <div className="overflow-auto max-h-[65vh] border-t border-gray-200 dark:border-gray-700">
                                    <table className="border-collapse w-max min-w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
                                            <tr>
                                                <th className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase border-r border-gray-200 dark:border-gray-600 min-w-[160px]">
                                                    Student
                                                </th>
                                                {monthlyData.dates?.map((date: string) => (
                                                    <th
                                                        key={date}
                                                        className="px-1.5 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase whitespace-nowrap min-w-[32px]"
                                                    >
                                                        {new Date(date).toLocaleDateString('en-US', { day: '2-digit' })}
                                                        <div className="text-[8px] font-normal text-gray-400">
                                                            {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase whitespace-nowrap border-l-2 border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600">Days</th>
                                                <th className="px-2 py-2 text-center text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase whitespace-nowrap bg-green-50 dark:bg-green-900/30">P</th>
                                                <th className="px-2 py-2 text-center text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase whitespace-nowrap bg-red-50 dark:bg-red-900/30">A</th>
                                                <th className="px-2 py-2 text-center text-[10px] font-semibold text-yellow-700 dark:text-yellow-400 uppercase whitespace-nowrap bg-yellow-50 dark:bg-yellow-900/30">Lv</th>
                                                <th className="px-2 py-2 text-center text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase whitespace-nowrap bg-blue-50 dark:bg-blue-900/30">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {monthlyData.students?.map((std: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-400 dark:text-gray-500 w-5">{idx + 1}.</span>
                                                            <div>
                                                                <p className="font-semibold text-xs leading-tight">{std.student?.name || '-'}</p>
                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Roll: {std.student?.roll_no || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {monthlyData.dates?.map((date: string) => {
                                                        const record = std.daily_attendance?.find((r: any) => r.date === date);
                                                        return (
                                                            <td key={date} className="px-1 py-2 text-center">
                                                                {record ? (
                                                                    <span className={`inline-block w-6 h-6 leading-6 rounded text-[10px] font-bold ${getStatusColor(record.status)}`}>
                                                                        {record.status === AttendanceStatus.PRESENT && 'P'}
                                                                        {record.status === AttendanceStatus.ABSENT && 'A'}
                                                                        {record.status === AttendanceStatus.LEAVE && 'L'}
                                                                        {record.status === AttendanceStatus.LATE && 'Lt'}
                                                                        {record.status === "Not Marked" && '-'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-300 text-[10px]">-</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-2 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-l-2 border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700/30">
                                                        {std.summary?.total_days || 0}
                                                    </td>
                                                    <td className="px-2 py-2 text-center text-xs font-bold text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10">
                                                        {std.summary?.present_count || 0}
                                                    </td>
                                                    <td className="px-2 py-2 text-center text-xs font-bold text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10">
                                                        {std.summary?.absent_count || 0}
                                                    </td>
                                                    <td className="px-2 py-2 text-center text-xs font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10">
                                                        {std.summary?.leave_count || 0}
                                                    </td>
                                                    <td className={`px-2 py-2 text-center text-xs font-bold bg-blue-50/50 dark:bg-blue-900/10 ${
                                                        (std.summary?.attendance_percentage || 0) >= 90 ? 'text-green-700 dark:text-green-400' :
                                                        (std.summary?.attendance_percentage || 0) >= 75 ? 'text-yellow-700 dark:text-yellow-400' :
                                                        'text-red-700 dark:text-red-400'
                                                    }`}>
                                                        {std.summary?.attendance_percentage || 0}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-medium">Legend:</span>
                                    <span className="flex items-center gap-1"><span className="inline-block w-5 h-5 leading-5 text-center rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-[10px]">P</span> Present</span>
                                    <span className="flex items-center gap-1"><span className="inline-block w-5 h-5 leading-5 text-center rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-[10px]">A</span> Absent</span>
                                    <span className="flex items-center gap-1"><span className="inline-block w-5 h-5 leading-5 text-center rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold text-[10px]">L</span> Leave</span>
                                    <span className="flex items-center gap-1"><span className="inline-block w-5 h-5 leading-5 text-center rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-[10px]">Lt</span> Late</span>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <PrintActions onAction={handlePrintReport} disabled={!canPrint} size="md" />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/attendance')}
                    >
                        Back
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/attendance/mark')}
                    >
                        Mark Attendance
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReport;
