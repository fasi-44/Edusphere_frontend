import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { Badge, Button, ConfirmDialog, DataTable, LoadingSpinner, PageHeader } from '../../components';
import { userService } from '../../services/modules/userService';
import { roleService } from '../../services/modules/roleService';
import { IUser } from '../../types/index';
import StudentDetailDialog from './components/StudentDetailDialog';
import TeacherDetailDialog from './components/TeacherDetailDialog';
import ParentDetailDialog from './components/ParentDetailDialog';
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

const UserList: FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<IUser[]>([]);
    const [pagination, setPagination] = useState<IPaginationMeta>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [createMenuPosition, setCreateMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    // State for detail dialogs
    const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
    const [isTeacherDetailOpen, setIsTeacherDetailOpen] = useState(false);
    const [isParentDetailOpen, setIsParentDetailOpen] = useState(false);
    const [selectedUserIdForDialog, setSelectedUserIdForDialog] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roles, setRoles] = useState<{ role_code: string; role_name: string }[]>([]);

    // Debounce search term to avoid excessive API calls (500ms delay)
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await roleService.list({ limit: 100 });
                setRoles(response.data);
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        };
        fetchRoles();
    }, []);

    const handleCreateMenuClick = (event: React.MouseEvent) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setCreateMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setShowCreateMenu(!showCreateMenu);
    };

    const navigateToCreate = (role: 'student' | 'teacher' | 'parent' | 'staff') => {
        setShowCreateMenu(false);
        const routes = {
            student: '/students/new',
            teacher: '/teachers/new',
            parent: '/parents/new',
            staff: '/users/new',
        };
        navigate(routes[role]);
    };

    const getRoleNavigationPath = (user: IUser, action: 'edit' | 'view'): string => {
        // Extract role from nested role object (role.role_name) or role string
        // API can return role as either a string or an object with role_name
        const roleValue = typeof user.role === 'object'
            ? (user.role as unknown as { role_name?: string })?.role_name?.toUpperCase()
            : (user.role as string)?.toUpperCase();

        if (roleValue === 'STUDENT') {
            return action === 'edit' ? `/students/${user.id}/edit` : `/students/${user.id}`;
        } else if (roleValue === 'TEACHER') {
            return action === 'edit' ? `/teachers/${user.id}/edit` : `/teachers/${user.id}`;
        } else if (roleValue === 'PARENT') {
            return action === 'edit' ? `/parents/${user.id}/edit` : `/parents/${user.id}`;
        }
        // Default to user management pages for other roles
        return action === 'edit' ? `/users/${user.id}/edit` : `/users/${user.id}`;
    };

    const handleMenuClick = (event: React.MouseEvent, userId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setShowActionsMenu(showActionsMenu === userId ? null : userId);
    };

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
    }, [debouncedSearchTerm, genderFilter, roleFilter, statusFilter]);

    useEffect(() => {
        fetchUsers(currentPage, pageSize);
    }, [currentPage, pageSize, debouncedSearchTerm, genderFilter, roleFilter, statusFilter]);

    const fetchUsers = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await userService.list({
                page,
                limit,
                search: debouncedSearchTerm,
                gender: genderFilter,
                role: roleFilter,
                status: statusFilter,
            });
            const users = response.data.map((user: any, index: number) => ({
                ...user,
                key: user.id,
                slNo: (page - 1) * limit + index + 1,
            }));
            setRows(users);
            setPagination(response.meta);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: IUser) => {
        setShowActionsMenu(null);
        const editPath = getRoleNavigationPath(user, 'edit');
        navigate(editPath, { state: { user, mode: 'update' } });
    };

    const handleView = (user: IUser) => {
        // API can return role as either a string or an object with role_name
        const roleValue = typeof user.role === 'object'
            ? (user.role as unknown as { role_name?: string })?.role_name?.toUpperCase()
            : (user.role as string)?.toUpperCase();

        if (roleValue === 'STUDENT') {
            setSelectedUserIdForDialog(user.id);
            setIsStudentDetailOpen(true);
        } else if (roleValue === 'TEACHER') {
            setSelectedUserIdForDialog(user.id);
            setIsTeacherDetailOpen(true);
        } else if (roleValue === 'PARENT') {
            setSelectedUserIdForDialog(user.id);
            setIsParentDetailOpen(true);
        } else {
            // Fallback for other roles
            const viewPath = getRoleNavigationPath(user, 'view');
            navigate(viewPath, { state: { user, mode: 'view' } });
        }
        setShowActionsMenu(null);
    };

    const handleDelete = (user: IUser) => {
        setSelectedUser(user);
        setDeleteConfirmOpen(true);
        setShowActionsMenu(null);
    };

    const handleConfirmDelete = async () => {
        try {
            setLoading(true);
            await userService.delete(selectedUser!.id);
            toast.success('User deleted successfully!');
            fetchUsers(currentPage, pageSize);
            setDeleteConfirmOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete user.');
        } finally {
            setLoading(false);
        }
    };

    const { loginAccessColumn, renderLoginAccessModals } = useLoginAccess({
        onRefresh: () => fetchUsers(currentPage, pageSize),
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
            key: 'gender',
            label: 'Gender',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>,
        },
        {
            key: 'role',
            label: 'Role',
            render: (value) => (
                <Badge variant="secondary">{value?.role_name || 'No Role'}</Badge>
            ),
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
        return <LoadingSpinner fullHeight message="Loading users..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="User Management"
                subtitle="Manage users and view their details"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Users', href: '#' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_USERS) ? (
                        <div className="relative">
                            <Button
                                variant="primary"
                                onClick={handleCreateMenuClick}
                            >
                                + Create User
                            </Button>

                            {showCreateMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowCreateMenu(false)}
                                    />
                                    <div
                                        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                                        style={{
                                            top: `${createMenuPosition.top}px`,
                                            right: `${createMenuPosition.right}px`,
                                        }}
                                    >
                                        {hasPermission(Permission.MANAGE_STUDENTS) && (
                                            <button
                                                onClick={() => navigateToCreate('student')}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg text-gray-900 dark:text-gray-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                                                </svg>
                                                Student
                                            </button>
                                        )}
                                        {hasPermission(Permission.MANAGE_TEACHERS) && (
                                            <button
                                                onClick={() => navigateToCreate('teacher')}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 1 10.06 1 15.5S6.5 24.75 12 24.75s11-4.248 11-9.75S17.5 6.253 12 6.253z" />
                                                </svg>
                                                Teacher
                                            </button>
                                        )}
                                        {hasPermission(Permission.MANAGE_STUDENTS) && (
                                            <button
                                                onClick={() => navigateToCreate('parent')}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a3 3 0 003-3v-2a3 3 0 00-3-3H3a3 3 0 00-3 3v2a3 3 0 003 3z" />
                                                </svg>
                                                Parent
                                            </button>
                                        )}
                                        {hasPermission(Permission.MANAGE_USERS) && (
                                            <button
                                                onClick={() => navigateToCreate('staff')}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 last:rounded-b-lg text-gray-900 dark:text-gray-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Staff
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : undefined
                }
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input
                        type="text"
                        placeholder="Name, email, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

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

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        {roles.map((role) => (
                            <option key={role.role_code} value={role.role_code.toLowerCase()}>
                                {role.role_name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSearchTerm('');
                            setGenderFilter('');
                            setRoleFilter('');
                            setStatusFilter('');
                        }}
                        className="w-full"
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={rows}
                loading={loading}
                pagination={{
                    page: currentPage,
                    pageSize: pageSize,
                    total: pagination?.total,
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

            {showActionsMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowActionsMenu(null)}
                    />
                    <div
                        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        style={{
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
                        }}
                    >
                        {hasPermission(Permission.MANAGE_USERS) && (
                            <button
                                onClick={() => handleEdit(rows.find(r => r.id === showActionsMenu)!)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg text-gray-900 dark:text-gray-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit User
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
                            View User
                        </button>
                        {hasPermission(Permission.DELETE_USERS) && (
                            <button
                                onClick={() => handleDelete(rows.find(r => r.id === showActionsMenu)!)}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 last:rounded-b-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete User
                            </button>
                        )}
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                title="Delete User"
                message={`Are you sure you want to delete the user "${selectedUser?.full_name}"?`}
                type="danger"
                confirmText="Yes, Delete"
                cancelText="Cancel"
                isLoading={loading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmOpen(false)}
            />

            {renderLoginAccessModals()}

            {selectedUserIdForDialog && (
                <StudentDetailDialog
                    isOpen={isStudentDetailOpen}
                    studentId={selectedUserIdForDialog}
                    onClose={() => {
                        setIsStudentDetailOpen(false);
                        setSelectedUserIdForDialog(null);
                    }}
                    onEdit={(student) => handleEdit(student)}
                />
            )}

            {selectedUserIdForDialog && (
                <TeacherDetailDialog
                    isOpen={isTeacherDetailOpen}
                    teacherId={selectedUserIdForDialog}
                    onClose={() => {
                        setIsTeacherDetailOpen(false);
                        setSelectedUserIdForDialog(null);
                    }}
                    onEdit={(teacher) => handleEdit(teacher)}
                />
            )}

            {selectedUserIdForDialog && (
                <ParentDetailDialog
                    isOpen={isParentDetailOpen}
                    parentId={selectedUserIdForDialog}
                    onClose={() => {
                        setIsParentDetailOpen(false);
                        setSelectedUserIdForDialog(null);
                    }}
                    onEdit={(parent) => handleEdit(parent)}
                />
            )}
        </div>
    );
};

export default UserList;
