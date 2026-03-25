/**
 * Role & Permissions List Page
 * Display and manage roles and their permissions
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, DataTable, Button, ConfirmDialog, Badge } from '../../components';
import { roleService } from '../../services/modules/roleService';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';

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

const RolePermissionsList: FC = () => {
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
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    const handleMenuClick = (event: React.MouseEvent, roleId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setShowActionsMenu(showActionsMenu === roleId ? null : roleId);
    };

    useEffect(() => {
        fetchRoles(currentPage, pageSize);
    }, [currentPage, pageSize]);

    const fetchRoles = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await roleService.list({ page, limit });
            const roles = response.data.map((role: any, index: number) => ({
                ...role,
                key: role.id,
                slNo: (page - 1) * limit + index + 1,
            }));
            setRows(roles);
            setPagination(response.meta);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to fetch roles');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (role: any) => {
        setShowActionsMenu(null);
        navigate(`/roles/${role.id}/edit`, { state: { role, mode: 'update' } });
    };

    const handleManagePermissions = (role: any) => {
        setShowActionsMenu(null);
        navigate(`/roles/${role.id}/edit`, { state: { role, mode: 'update' } });
    };

    const handleDelete = (role: any) => {
        setSelectedRole(role);
        setDeleteConfirmOpen(true);
        setShowActionsMenu(null);
    };

    const handleConfirmDelete = async () => {
        try {
            setLoading(true);
            await roleService.delete(selectedRole!.id);
            toast.success('Role deleted successfully!');
            fetchRoles(currentPage, pageSize);
            setDeleteConfirmOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete role.');
        } finally {
            setLoading(false);
        }
    };

    const columns: IColumn[] = [
        {
            key: 'slNo',
            label: 'Sl. No',
        },
        {
            key: 'role_name',
            label: 'Role Name',
            render: (value) => <span className="font-medium text-gray-900 dark:text-white truncate">{value}</span>,
        },
        {
            key: 'description',
            label: 'Description',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>,
        },
        {
            key: 'permissions',
            label: 'Permissions',
            render: (value) => <Badge variant="info">{Array.isArray(value) ? value.length : 0}</Badge>,
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
    ];

    if (loading && rows.length === 0) {
        return <LoadingSpinner fullHeight message="Loading roles..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Role & Permissions Management"
                subtitle="Manage roles and assign permissions"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Roles', href: '#' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_ROLES) ? (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/roles/new')}
                        >
                            + Create Role
                        </Button>
                    ) : undefined
                }
            />

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

            {/* Fixed Actions Menu */}
            {showActionsMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(null)} />
                    <div
                        className="fixed w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        style={{
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
                        }}
                    >
                        {hasPermission(Permission.MANAGE_ROLES) && (
                            <button
                                onClick={() => handleEdit(rows.find(r => r.id === showActionsMenu)!)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg text-gray-900 dark:text-gray-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Role
                            </button>
                        )}
                        {hasPermission(Permission.MANAGE_ROLES) && (
                            <button
                                onClick={() => handleManagePermissions(rows.find(r => r.id === showActionsMenu)!)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Manage Permissions
                            </button>
                        )}
                        {hasPermission(Permission.MANAGE_ROLES) && (
                            <button
                                onClick={() => handleDelete(rows.find(r => r.id === showActionsMenu)!)}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 last:rounded-b-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Role
                            </button>
                        )}
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                title="Delete Role"
                message={`Are you sure you want to delete the role "${selectedRole?.role_name}"?`}
                type="danger"
                confirmText="Yes, Delete"
                cancelText="Cancel"
                isLoading={loading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmOpen(false)}
            />
        </div>
    );
};

export default RolePermissionsList;
