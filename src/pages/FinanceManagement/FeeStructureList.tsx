/**
 * Fee Structure List Page
 * Displays fee structures grouped by class with View, Edit, Assign, Delete actions.
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, DataTable, Badge, Button, Modal, ConfirmDialog } from '../../components';
import { financeService } from '../../services/modules/financeService';
import { useAuthStore } from '../../stores/authStore';
import { IGroupedFeeStructure, IFeeRow } from '../../types/index';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';

const FeeStructureList: FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { user, academicYearVersion } = useAuthStore();
    const academicYearId = user?.current_academic_year?.id;

    const [groupedFees, setGroupedFees] = useState<IGroupedFeeStructure[]>([]);
    const [loading, setLoading] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState<IGroupedFeeStructure | null>(null);
    const [selectedFees, setSelectedFees] = useState<IFeeRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    const handleMenuClick = (event: React.MouseEvent, classId: number) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        setShowActionsMenu(showActionsMenu === classId ? null : classId);
    };

    useEffect(() => {
        if (academicYearId) fetchGroupedFeeStructures();
    }, [academicYearId, academicYearVersion]);

    const fetchGroupedFeeStructures = async () => {
        try {
            setLoading(true);
            const response = await financeService.listFeeStructures(academicYearId!);
            const feeStructures = response.data || response || [];

            // Group by class_id
            const grouped: Record<number, IGroupedFeeStructure> = {};
            (Array.isArray(feeStructures) ? feeStructures : []).forEach((fee: any) => {
                const classId = fee.class_id;
                if (!grouped[classId]) {
                    grouped[classId] = {
                        class_id: classId,
                        class_name: fee.class?.class_name || 'N/A',
                        fees: [],
                        total_amount: 0,
                        fee_count: 0,
                    };
                }
                grouped[classId].fees.push(fee);
                grouped[classId].total_amount += parseFloat(fee.amount || 0);
                grouped[classId].fee_count += 1;
            });

            setGroupedFees(Object.values(grouped));
        } catch (error: any) {
            console.error('Error fetching fee structures:', error);
            toast.error(error.message || 'Failed to fetch fee structures');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (record: IGroupedFeeStructure) => {
        setSelectedFees(record.fees);
        setShowViewModal(true);
    };

    const handleEdit = (record: IGroupedFeeStructure) => {
        navigate(`/finance/fee-structure/edit/${record.class_id}`);
    };

    const handleAssignClick = (record: IGroupedFeeStructure) => {
        setSelectedClass(record);
        setShowAssignDialog(true);
    };

    const confirmAssign = async () => {
        if (!selectedClass) return;
        try {
            setSaving(true);
            const result = await financeService.assignFeesToClass({
                class_id: selectedClass.class_id,
                academic_year_id: academicYearId,
            });
            const data = result.data || result;
            toast.success(
                `Fees assigned to ${data.total_students || 0} students! Assigned: ${data.total_fees_assigned || 0} | Skipped: ${data.total_fees_skipped || 0}`
            );
            setShowAssignDialog(false);
            setSelectedClass(null);
        } catch (error: any) {
            console.error('Error assigning fees:', error);
            toast.error(error.message || 'Failed to assign fees');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (record: IGroupedFeeStructure) => {
        setSelectedClass(record);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!selectedClass) return;
        try {
            setSaving(true);
            await financeService.deleteClassFeeStructures(selectedClass.class_id, academicYearId!);
            toast.success('Fee structures deleted successfully');
            setShowDeleteDialog(false);
            setSelectedClass(null);
            fetchGroupedFeeStructures();
        } catch (error: any) {
            console.error('Error deleting fee structures:', error);
            toast.error(error.message || 'Failed to delete fee structures');
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            key: 'class_name',
            label: 'Class',
            render: (value: string) => <span className="font-semibold text-gray-900 dark:text-white">{value}</span>,
        },
        {
            key: 'fee_count',
            label: 'Number of Fees',
            render: (value: number) => <Badge variant="primary" size="sm">{value} Fees</Badge>,
        },
        {
            key: 'total_amount',
            label: 'Total Amount',
            className: 'text-right',
            render: (value: number) => (
                <span className="font-semibold">{'\u20B9'}{value?.toLocaleString('en-IN')}</span>
            ),
        },
    ];

    const detailColumns = [
        {
            key: 'fee_name',
            label: 'Fee Name',
            render: (value: string) => <span className="font-medium">{value}</span>,
        },
        {
            key: 'amount',
            label: 'Amount',
            className: 'text-right',
            render: (value: number) => <span>{'\u20B9'}{parseFloat(String(value)).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'is_mandatory',
            label: 'Mandatory',
            className: 'text-center',
            render: (value: boolean) => (
                <Badge variant={value ? 'success' : 'secondary'} size="sm">{value ? 'Yes' : 'No'}</Badge>
            ),
        },
        {
            key: 'is_recurring',
            label: 'Recurring',
            className: 'text-center',
            render: (value: boolean) => (
                <Badge variant={value ? 'primary' : 'secondary'} size="sm">{value ? 'Yes' : 'No'}</Badge>
            ),
        },
        {
            key: 'recurrence_type',
            label: 'Type',
            render: (value: string) => <span className="text-sm">{value?.replace('_', ' ') || '-'}</span>,
        },
    ];

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Fee Structure', href: '#' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Fee Structures"
                subtitle="Manage fee structures and assignments for each class"
                breadcrumbs={breadcrumbs}
                actions={
                    hasPermission(Permission.MANAGE_FEES) ? (
                        <Button variant="primary" size="sm" onClick={() => navigate('/finance/fee-structure/create')}>
                            + Create Fee Structure
                        </Button>
                    ) : undefined
                }
            />

            <DataTable
                columns={columns}
                data={groupedFees}
                loading={loading}
                emptyMessage="No fee structures found. Create one to get started."
                striped
                actions={(row: IGroupedFeeStructure) => (
                    <button
                        onClick={(e) => handleMenuClick(e, row.class_id)}
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

            {/* Actions Dropdown Menu */}
            {showActionsMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(null)} />
                    <div
                        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                    >
                        <button
                            onClick={() => { const row = groupedFees.find(r => r.class_id === showActionsMenu); if (row) handleView(row); setShowActionsMenu(null); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg text-gray-900 dark:text-gray-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                        </button>
                        {hasPermission(Permission.MANAGE_FEES) && (
                            <button
                                onClick={() => { const row = groupedFees.find(r => r.class_id === showActionsMenu); if (row) handleEdit(row); setShowActionsMenu(null); }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                        )}
                        {hasPermission(Permission.MANAGE_FEES) && (
                            <button
                                onClick={() => { const row = groupedFees.find(r => r.class_id === showActionsMenu); if (row) handleAssignClick(row); setShowActionsMenu(null); }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Assign to Class
                            </button>
                        )}
                        {hasPermission(Permission.MANAGE_FEES) && (
                            <button
                                onClick={() => { const row = groupedFees.find(r => r.class_id === showActionsMenu); if (row) handleDeleteClick(row); setShowActionsMenu(null); }}
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

            {/* View Fee Details Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Fee Structure Details"
                size="lg"
                footer={
                    <div className="flex justify-end">
                        <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
                    </div>
                }
            >
                <DataTable
                    columns={detailColumns}
                    data={selectedFees}
                    emptyMessage="No fees in this structure"
                    striped={false}
                />
            </Modal>

            {/* Assign to Class Confirmation */}
            <Modal
                isOpen={showAssignDialog}
                onClose={() => setShowAssignDialog(false)}
                title="Assign Fees to Entire Class"
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
                        <Button variant="primary" onClick={confirmAssign} isLoading={saving} loadingText="Assigning...">
                            Assign to All Students
                        </Button>
                    </div>
                }
            >
                {selectedClass && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                This will automatically assign all fees to all students in the selected class.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm"><strong>Class:</strong> {selectedClass.class_name}</p>
                            <p className="text-sm"><strong>Number of Fees:</strong> {selectedClass.fee_count}</p>
                            <p className="text-sm"><strong>Total Amount:</strong> {'\u20B9'}{selectedClass.total_amount?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Fees that are already assigned to students will be skipped automatically.
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Fee Structures"
                message={selectedClass ? `Delete all ${selectedClass.fee_count} fee structure(s) for ${selectedClass.class_name} with total amount \u20B9${selectedClass.total_amount?.toLocaleString('en-IN')}? This action cannot be undone and will fail if fees are already assigned to students.` : ''}
                onConfirm={confirmDelete}
                onCancel={() => { setShowDeleteDialog(false); setSelectedClass(null); }}
                confirmText="Delete All"
                type="danger"
                isLoading={saving}
            />
        </div>
    );
};

export default FeeStructureList;
