import { FC, lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, DataTable, Button, ConfirmDialog, Badge } from '../../components';

const StudentExamTimetableModal = lazy(() => import('../ExamManagement/components/StudentExamTimetableModal'));
import { studentService } from '../../services/modules/studentService';
import { useAuthStore } from '../../stores/authStore';
import StudentDetailDialog from './components/StudentDetailDialog';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';
import { useDebounce } from '../../hooks/useDebounce';
import { useLoginAccess } from '../../hooks/useLoginAccess';

interface IColumn {
    key: string;
    label: string;
    width?: number;
    render?: (value: any, row: any) => React.ReactNode;
}

interface IPaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const StudentList: FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { academicYearVersion } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [pagination, setPagination] = useState<IPaginationMeta>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
    const [selectedStudentIdForDialog, setSelectedStudentIdForDialog] = useState<string | null>(null);

    // Exam Timetable Print Modal
    const [showExamTimetableModal, setShowExamTimetableModal] = useState(false);
    const [examTimetableStudent, setExamTimetableStudent] = useState<any>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Debounce search term to avoid excessive API calls (500ms delay)
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const handleMenuClick = (event: React.MouseEvent, studentId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setShowActionsMenu(showActionsMenu === studentId ? null : studentId);
    };

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
    }, [debouncedSearchTerm, genderFilter, statusFilter]);

    useEffect(() => {
        fetchStudents(currentPage, pageSize);
    }, [currentPage, pageSize, debouncedSearchTerm, genderFilter, statusFilter, academicYearVersion]);

    const fetchStudents = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await studentService.list({
                page,
                limit,
                search: debouncedSearchTerm,
                gender: genderFilter,
                status: statusFilter,
            });
            const students = response.data.map((student: any, index: number) => ({
                ...student,
                key: student.id,
                slNo: (page - 1) * limit + index + 1,
            }));

            // Client-side filtering for class and section (since backend doesn't support yet)
            let filtered = students;
            if (classFilter) {
                filtered = filtered.filter((s: any) => s.class?.id === parseInt(classFilter));
            }
            if (sectionFilter) {
                filtered = filtered.filter((s: any) => s.section?.id === parseInt(sectionFilter));
            }

            setRows(filtered);
            setPagination(response.meta);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to fetch students');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (student: any) => {
        setShowActionsMenu(null);
        navigate(`/students/${student.id}/edit`, { state: { student, mode: 'update' } });
    };

    const handleView = (student: any) => {
        setSelectedStudentIdForDialog(student.id);
        setIsStudentDetailOpen(true);
        setShowActionsMenu(null);
    };

    const handlePrintProgress = (student: any) => {
        setShowActionsMenu(null);
        navigate(`/academics/annual-progress/${student.id}`);
    };

    const handleGenerateCertificate = (student: any) => {
        setShowActionsMenu(null);
        // Navigate to certificates page with tabs
        navigate(`/students/${student.id}/certificates`);
    };

    const handleExamTimetable = (student: any) => {
        setShowActionsMenu(null);
        setExamTimetableStudent(student);
        setShowExamTimetableModal(true);
    };

    const handleDelete = (student: any) => {
        setSelectedStudent(student);
        setDeleteConfirmOpen(true);
        setShowActionsMenu(null);
    };

    const handleConfirmDelete = async () => {
        try {
            setLoading(true);
            await studentService.delete(selectedStudent!.id);
            toast.success('Student deleted successfully!');
            fetchStudents(currentPage, pageSize);
            setDeleteConfirmOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete student.');
        } finally {
            setLoading(false);
        }
    };

    const { loginAccessColumn, renderLoginAccessModals } = useLoginAccess({
        onRefresh: () => fetchStudents(currentPage, pageSize),
        onEdit: (user) => handleEdit(user),
    });

    const columns: IColumn[] = [
        {
            key: 'slNo',
            label: 'Sl. No',
        },
        {
            key: 'full_name',
            label: 'Name',
            render: (value) => <span className="font-medium text-gray-900 dark:text-white truncate">{value}</span>,
        },
        {
            key: 'email',
            label: 'Email',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value}</span>,
        },
        {
            key: 'phone',
            label: 'Phone',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>,
        },
        {
            key: 'profile',
            label: 'Student ID',
            render: (value) => <Badge variant="secondary">{value.roll_no || '-'}</Badge>,
        },
        {
            key: 'class',
            label: 'Class',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value?.class_name || '-'}</span>,
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (value) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${value
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        loginAccessColumn,
    ];

    if (loading && rows.length === 0) {
        return <LoadingSpinner fullHeight message="Loading students..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Student Management"
                subtitle="Manage students and view their details"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Students', href: '#' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_STUDENTS) ? (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/students/new')}
                        >
                            + Create Student
                        </Button>
                    ) : undefined
                }
            />

            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Search Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Name, email, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Gender Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Gender
                        </label>
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Class Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Class
                        </label>
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Classes</option>
                            {/* Get unique classes from rows */}
                            {Array.from(new Set(rows
                                .filter((r: any) => r.class?.id)
                                .map((r: any) => r.class?.id)
                            )).map((classId: any) => {
                                const classData = rows.find((r: any) => r.class?.id === classId)?.class;
                                return (
                                    <option key={classId} value={classId}>
                                        {classData?.name || `Class ${classId}`}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Section Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Section
                        </label>
                        <select
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Sections</option>
                            {/* Get unique sections from rows */}
                            {Array.from(new Set(rows
                                .filter((r: any) => r.section?.id)
                                .map((r: any) => r.section?.id)
                            )).map((sectionId: any) => {
                                const sectionData = rows.find((r: any) => r.section?.id === sectionId)?.section;
                                return (
                                    <option key={sectionId} value={sectionId}>
                                        {sectionData?.name || `Section ${sectionId}`}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    <div className="flex items-end">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setSearchTerm('');
                                setGenderFilter('');
                                setClassFilter('');
                                setSectionFilter('');
                                setStatusFilter('');
                            }}
                            className="w-full"
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={rows}
                loading={loading}
                pagination={{
                    page: currentPage,
                    pageSize: pageSize,
                    total: pagination.total,
                    onPageChange: setCurrentPage,
                }}
                actions={(row) => (
                    <button
                        onClick={(e) => handleMenuClick(e, row.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="More actions"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    </button>
                )}
            />

            {/* Fixed Actions Menu */}
            {showActionsMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(null)} />
                    <div
                        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        style={{
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
                        }}
                    >
                        {hasPermission(Permission.MANAGE_STUDENTS) && (
                            <button
                                onClick={() => handleEdit(rows.find(r => r.id === showActionsMenu)!)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg text-gray-900 dark:text-gray-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                        )}
                        <button
                            onClick={() => handleView(rows.find(r => r.id === showActionsMenu)!)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                        </button>
                        <button
                            onClick={() => handlePrintProgress(rows.find(r => r.id === showActionsMenu)!)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-blue-600 dark:text-blue-400"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Progress
                        </button>

                        <button
                            onClick={() => handleGenerateCertificate(rows.find(r => r.id === showActionsMenu)!)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-purple-600 dark:text-purple-400"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Certificates
                        </button>

                        <button
                            onClick={() => handleExamTimetable(rows.find(r => r.id === showActionsMenu)!)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-indigo-600 dark:text-indigo-400"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Exam Timetable
                        </button>

                        {hasPermission(Permission.DELETE_STUDENTS) && (
                            <button
                                onClick={() => handleDelete(rows.find(r => r.id === showActionsMenu)!)}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 last:rounded-b-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        )}
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                title="Delete Student"
                message={`Are you sure you want to delete the student "${selectedStudent?.full_name}"?`}
                type="danger"
                confirmText="Yes, Delete"
                cancelText="Cancel"
                isLoading={loading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmOpen(false)}
            />

            {renderLoginAccessModals()}

            {selectedStudentIdForDialog && (
                <StudentDetailDialog
                    isOpen={isStudentDetailOpen}
                    studentId={selectedStudentIdForDialog}
                    onClose={() => {
                        setIsStudentDetailOpen(false);
                        setSelectedStudentIdForDialog(null);
                    }}
                    onEdit={(student) => handleEdit(student)}
                />
            )}

            {/* Exam Timetable Print Modal */}
            {showExamTimetableModal && (
                <Suspense fallback={null}>
                    <StudentExamTimetableModal
                        isOpen={showExamTimetableModal}
                        onClose={() => {
                            setShowExamTimetableModal(false);
                            setExamTimetableStudent(null);
                        }}
                        student={examTimetableStudent}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default StudentList;
