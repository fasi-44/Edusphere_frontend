/**
 * Parent List Page
 * Display and manage list of parents with pagination and actions
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, DataTable, Button, ConfirmDialog } from '../../components';
import { parentService } from '../../services/modules/parentService';
import ParentDetailDialog from './components/ParentDetailDialog';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';
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

const ParentList: FC = () => {
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
    const [selectedParent, setSelectedParent] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [isParentDetailOpen, setIsParentDetailOpen] = useState(false);
    const [selectedParentIdForDialog, setSelectedParentIdForDialog] = useState<string | null>(null);

    const handleMenuClick = (event: React.MouseEvent, parentId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setShowActionsMenu(showActionsMenu === parentId ? null : parentId);
    };

    useEffect(() => {
        fetchParents(currentPage, pageSize);
    }, [currentPage, pageSize]);

    const fetchParents = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await parentService.list({ page, limit });
            const parents = response.data.map((parent: any, index: number) => ({
                ...parent,
                key: parent.id,
                slNo: (page - 1) * limit + index + 1,
            }));
            setRows(parents);
            setPagination(response.meta);
        } catch (error) {
            console.error('Error fetching parents:', error);
            toast.error('Failed to fetch parents');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (parent: any) => {
        setShowActionsMenu(null);
        navigate(`/parents/${parent.id}/edit`, { state: { parent, mode: 'update' } });
    };

    const handleView = (parent: any) => {
        setSelectedParentIdForDialog(parent.id);
        setIsParentDetailOpen(true);
        setShowActionsMenu(null);
    };

    const handleDelete = (parent: any) => {
        setSelectedParent(parent);
        setDeleteConfirmOpen(true);
        setShowActionsMenu(null);
    };

    const handleConfirmDelete = async () => {
        try {
            setLoading(true);
            await parentService.delete(selectedParent!.id);
            toast.success('Parent deleted successfully!');
            fetchParents(currentPage, pageSize);
            setDeleteConfirmOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete parent.');
        } finally {
            setLoading(false);
        }
    };

    const { loginAccessColumn, renderLoginAccessModals } = useLoginAccess({
        onRefresh: () => fetchParents(currentPage, pageSize),
        onEdit: (user) => handleEdit(user),
    });

    const columns: IColumn[] = [
        {
            key: 'slNo',
            label: 'Sl. No',
        },
        {
            key: 'profile',
            label: 'Father Name',
            render: (value) => <span className="font-medium text-gray-900 dark:text-white truncate">{value.father_full_name}</span>,
        },
        {
            key: 'profile',
            label: 'Mother Name',
            render: (value) => <span className="font-medium text-gray-900 dark:text-white truncate">{value.mother_full_name}</span>,
        },
        {
            key: 'profile',
            label: 'Phone',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value.father_phone + " / " + value.mother_phone || '-'}</span>,
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
        return <LoadingSpinner fullHeight message="Loading parents..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Parent Management"
                subtitle="Manage parents and view their details"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Parents', href: '#' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_STUDENTS) ? (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/parents/new')}
                        >
                            + Create Parent
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
                title="Delete Parent"
                message={`Are you sure you want to delete the parent "${selectedParent?.full_name}"?`}
                type="danger"
                confirmText="Yes, Delete"
                cancelText="Cancel"
                isLoading={loading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmOpen(false)}
            />

            {renderLoginAccessModals()}

            {selectedParentIdForDialog && (
                <ParentDetailDialog
                    isOpen={isParentDetailOpen}
                    parentId={selectedParentIdForDialog}
                    onClose={() => {
                        setIsParentDetailOpen(false);
                        setSelectedParentIdForDialog(null);
                    }}
                    onEdit={(parent) => handleEdit(parent)}
                />
            )}
        </div>
    );
};

export default ParentList;