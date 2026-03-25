/**
 * Teacher List Page
 * Display and manage list of teachers with pagination and actions
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, DataTable, Button, ConfirmDialog, Badge } from '../../components';
import { teacherService } from '../../services/modules/teacherService';
import TeacherDetailDialog from './components/TeacherDetailDialog';
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

const TeacherList: FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
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
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [isTeacherDetailOpen, setIsTeacherDetailOpen] = useState(false);
    const [selectedTeacherIdForDialog, setSelectedTeacherIdForDialog] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Debounce search term to avoid excessive API calls (500ms delay)
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const handleMenuClick = (event: React.MouseEvent, teacherId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setShowActionsMenu(showActionsMenu === teacherId ? null : teacherId);
    };

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
    }, [debouncedSearchTerm, genderFilter, statusFilter]);

    useEffect(() => {
        fetchTeachers(currentPage, pageSize);
    }, [currentPage, pageSize, debouncedSearchTerm, genderFilter, statusFilter]);

    const fetchTeachers = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await teacherService.list({
                page,
                limit,
                search: debouncedSearchTerm,
                gender: genderFilter,
                status: statusFilter,
            });
            const teachers = response.data.map((teacher: any, index: number) => ({
                ...teacher,
                key: teacher.id,
                slNo: (page - 1) * limit + index + 1,
            }));
            setRows(teachers);
            setPagination(response.meta);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            toast.error('Failed to fetch teachers');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (teacher: any) => {
        setShowActionsMenu(null);
        navigate(`/teachers/${teacher.id}/edit`, { state: { teacher, mode: 'update' } });
    };

    const handleView = (teacher: any) => {
        setSelectedTeacherIdForDialog(teacher.id);
        setIsTeacherDetailOpen(true);
        setShowActionsMenu(null);
    };

    const handleDelete = (teacher: any) => {
        setSelectedTeacher(teacher);
        setDeleteConfirmOpen(true);
        setShowActionsMenu(null);
    };

    const handleConfirmDelete = async () => {
        try {
            setLoading(true);
            await teacherService.delete(selectedTeacher!.id);
            toast.success('Teacher deleted successfully!');
            fetchTeachers(currentPage, pageSize);
            setDeleteConfirmOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete teacher.');
        } finally {
            setLoading(false);
        }
    };

    const { loginAccessColumn, renderLoginAccessModals } = useLoginAccess({
        onRefresh: () => fetchTeachers(currentPage, pageSize),
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
            key: 'employee_id',
            label: 'Employee ID',
            render: (value) => <Badge variant="secondary">{value || '-'}</Badge>,
        },
        {
            key: 'designation',
            label: 'Designation',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>,
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
        return <LoadingSpinner fullHeight message="Loading teachers..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Teacher Management"
                subtitle="Manage teachers and view their details"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Teachers', href: '#' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_TEACHERS) ? (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/teachers/new')}
                        >
                            + Create Teacher
                        </Button>
                    ) : undefined
                }
            />

            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        {hasPermission(Permission.MANAGE_TEACHERS) && (
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
                        {hasPermission(Permission.DELETE_TEACHERS) && (
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
                title="Delete Teacher"
                message={`Are you sure you want to delete the teacher "${selectedTeacher?.full_name}"?`}
                type="danger"
                confirmText="Yes, Delete"
                cancelText="Cancel"
                isLoading={loading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmOpen(false)}
            />

            {renderLoginAccessModals()}

            {selectedTeacherIdForDialog && (
                <TeacherDetailDialog
                    isOpen={isTeacherDetailOpen}
                    teacherId={selectedTeacherIdForDialog}
                    onClose={() => {
                        setIsTeacherDetailOpen(false);
                        setSelectedTeacherIdForDialog(null);
                    }}
                    onEdit={(teacher) => handleEdit(teacher)}
                />
            )}
        </div>
    );
};

export default TeacherList;
