import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { Button, ConfirmDialog, DataTable, EmptyState, LoadingSpinner, PageHeader } from '@/components';
import { classService } from '@/services/modules/classService';
import { IClass } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/permissions';



const ClassList: FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [classes, setClasses] = useState<IClass[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    // Fetch classes on component mount
    useEffect(() => {
        fetchClasses();
    }, []);

    // Fetch classes dynamically
    const fetchClasses = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await classService.list();
            setClasses(response);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch classes');
            toast.error(err.message || 'Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete single class
    const handleDeleteClass = (id: string) => {
        setDeleteTarget(id);
        setShowDeleteConfirm(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (deleteTarget) {
            try {
                await classService.delete(deleteTarget);
                toast.success('Class deleted successfully');
                setShowDeleteConfirm(false);
                setDeleteTarget(null);
                await fetchClasses();
            } catch (err: any) {
                toast.error(err.message || 'Failed to delete class');
            }
        }
    };

    // Handle selection change
    const handleSelectionChange = (selected: string[]) => {
        setSelectedClasses(selected);
    };

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (selectedClasses.length === 0) {
            toast.error('Please select classes to delete');
            return;
        }
        setShowBulkDeleteConfirm(true);
    };

    // Confirm bulk delete
    const confirmBulkDelete = async () => {
        try {
            for (const id of selectedClasses) {
                await classService.delete(id);
            }
            setSelectedClasses([]);
            setShowBulkDeleteConfirm(false);
            toast.success(`${selectedClasses.length} classes deleted successfully`);
            await fetchClasses();
        } catch (err) {
            toast.error('Failed to delete some classes');
        }
    };

    // Table columns configuration
    const columns = [
        {
            key: 'class_name',
            label: 'Class Name',
            render: (value: string, row: IClass) => (
                <div
                    className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/classes/${row.id}`)}
                >
                    {value}
                </div>
            ),
        },
        {
            key: 'student_count',
            label: 'Students',
            render: (value: number) => (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold">
                    {value}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_: any, row: IClass) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/classes/${row.id}`)}
                    >
                        View
                    </Button>
                    {hasPermission(Permission.MANAGE_CLASSES) && (
                        <Button
                            variant="info"
                            size="sm"
                            onClick={() => navigate(`/classes/${row.id}/edit`)}
                        >
                            Edit
                        </Button>
                    )}
                    {hasPermission(Permission.MANAGE_CLASSES) && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteClass(String(row.id))}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    // Show loading spinner
    if (loading && classes.length === 0) {
        return <LoadingSpinner fullHeight message="Loading classes..." />;
    }

    // Show error message
    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button variant="danger" onClick={() => setError(null)}>
                    Dismiss
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Class Management"
                subtitle="View and manage all school classes"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Classes', href: '/classes' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_CLASSES) && (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/classes/new')}
                        >
                            + Add New Class
                        </Button>
                    )
                }
            />

            {/* Bulk Actions */}
            {hasPermission(Permission.MANAGE_CLASSES) && selectedClasses.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                        {selectedClasses.length} class(es) selected
                    </span>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleBulkDelete}
                    >
                        Delete Selected
                    </Button>
                </div>
            )}

            {/* Classes Table */}
            {classes.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={classes}
                        loading={loading}
                        selectedRows={selectedClasses}
                        onSelectionChange={handleSelectionChange}
                    />
                </div>
            ) : (
                <EmptyState
                    icon="📚"
                    title="No Classes Found"
                    description="No classes match your current filters. Try adjusting your search or create a new class."
                    action={
                        hasPermission(Permission.MANAGE_CLASSES) && (
                            <Button
                                variant="primary"
                                onClick={() => navigate('/classes/new')}
                            >
                                Create First Class
                            </Button>
                        )
                    }
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                type="danger"
                title="Delete Class"
                message="Are you sure you want to delete this class? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
            />

            {/* Bulk Delete Confirmation Modal */}
            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                type="danger"
                title="Delete Multiple Classes"
                message={`Are you sure you want to delete ${selectedClasses.length} class(es)? This action cannot be undone.`}
                onConfirm={confirmBulkDelete}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />
        </div>
    );
};

export default ClassList;
