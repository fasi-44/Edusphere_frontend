import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    Badge,
    DataTable,
    LoadingSpinner,
    EmptyState,
    ConfirmDialog,
} from '@/components';
import { examService } from '@/services/modules/examService';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/permissions';

interface IExamConfig {
    id: number;
    exam_category: string;
    exam_code: string;
    exam_name: string;
    sequence_order: number;
}

const ExamList: FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    // State
    const [exams, setExams] = useState<IExamConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState<IExamConfig[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch exams on mount
    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await examService.list();
            // Extract array from response - handle both array and object with data property
            const examData = Array.isArray(response) ? response : (response?.data || []);
            setExams(examData as IExamConfig[]);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch exams');
            setExams([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExam = (id: number) => {
        setDeleteTarget(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            await examService.delete(String(deleteTarget));
            toast.success('Exam deleted successfully');
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            await fetchExams();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete exam');
        }
    };

    const handleBulkDelete = () => {
        if (selectedRows.length === 0) {
            toast.error('Please select exams to delete');
            return;
        }
        setShowBulkDeleteConfirm(true);
    };

    const confirmBulkDelete = async () => {
        try {
            for (const exam of selectedRows) {
                await examService.delete(String(exam.id));
            }
            toast.success(`${selectedRows.length} exam(s) deleted successfully`);
            setShowBulkDeleteConfirm(false);
            setSelectedRows([]);
            await fetchExams();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete some exams');
        }
    };

    // Get category color variant
    const getCategoryVariant = (category: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' => {
        switch (category?.toLowerCase()) {
            case 'Formative':
                return 'info';
            case 'Summative':
                return 'success';
            default:
                return 'secondary';
        }
    };

    // Table columns
    const columns = [
        {
            key: 'exam_name',
            label: 'Exam Name',
            render: (value: string, row: IExamConfig) => (
                <div
                    className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => navigate(`/exams/${row.id}`)}
                >
                    {value}
                </div>
            )
        },
        {
            key: 'exam_code',
            label: 'Code',
            render: (value: string) => (
                <div className="font-mono text-sm text-gray-900 dark:text-white">
                    {value}
                </div>
            )
        },
        {
            key: 'exam_category',
            label: 'Category',
            render: (value: string) => (
                <Badge variant={getCategoryVariant(value)} children={value} />
            )
        },
        {
            key: 'sequence_order',
            label: 'Order',
            render: (value: number) => (
                <div className="text-center text-gray-900 dark:text-white font-medium">
                    #{value}
                </div>
            )
        }
    ];

    // Show loading spinner
    if (loading && exams.length === 0) {
        return <LoadingSpinner fullHeight message="Loading exams..." />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Exam Configuration"
                subtitle="Manage exam types and categories"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Exams Types & Configs', href: '/exams' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_EXAMS) ? (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/exams/new')}
                        >
                            + New Exam Type
                        </Button>
                    ) : undefined
                }
            />

            {/* Bulk Actions */}
            {selectedRows.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                        {selectedRows.length} exam{selectedRows.length !== 1 ? 's' : ''} selected
                    </span>
                    {hasPermission(Permission.MANAGE_EXAMS) && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleBulkDelete}
                        >
                            🗑️ Delete Selected
                        </Button>
                    )}
                </div>
            )}

            {/* Exams Table */}
            {exams.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={exams}
                        loading={loading}
                        onSelectionChange={(selected) => {
                            setSelectedRows(selected.map(item => item as unknown as IExamConfig) || []);
                        }}
                        actions={(row: IExamConfig) => (
                            <div className="flex gap-2">
                                {hasPermission(Permission.MANAGE_EXAMS) && (
                                    <Button
                                        size="sm"
                                        variant="info"
                                        onClick={() => navigate(`/exams/${row.id}/edit`)}
                                    >
                                        Edit
                                    </Button>
                                )}
                                {hasPermission(Permission.MANAGE_EXAMS) && (
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDeleteExam(row.id)}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </div>
                        )}
                    />
                </div>
            ) : (
                <EmptyState
                    icon="📝"
                    title="No Exam Types Found"
                    description="Create exam types to get started."
                    action={
                        hasPermission(Permission.MANAGE_EXAMS) ? (
                            <Button
                                variant="primary"
                                onClick={() => navigate('/exams/new')}
                            >
                                + Create First Exam Type
                            </Button>
                        ) : undefined
                    }
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                type="danger"
                title="Delete Exam"
                message="Are you sure you want to delete this exam type? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
            />

            {/* Bulk Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                type="danger"
                title="Delete Multiple Exams"
                message={`Are you sure you want to delete ${selectedRows.length} exam type(s)? This action cannot be undone.`}
                onConfirm={confirmBulkDelete}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />
        </div>
    );
};

export default ExamList;
