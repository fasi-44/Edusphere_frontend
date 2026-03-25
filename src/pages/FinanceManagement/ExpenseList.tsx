/**
 * Expense List Page
 * Displays expenses with filters, summary cards, CRUD operations.
 * Salary expenses (reference_type = 'salary_payment') cannot be edited/deleted.
 */

import { FC, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, DataTable, Badge, Button, StatCard, Modal, ConfirmDialog, FormInput, FormSelect, FormTextarea } from '../../components';
import { financeService } from '../../services/modules/financeService';
import { useAuthStore } from '../../stores/authStore';
import { IExpenseRecord, IExpenseFormData } from '../../types/index';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';

const EXPENSE_CATEGORIES = [
    'Staff Salaries', 'Electricity Bill', 'Water Bill', 'Functions/Events',
    'Transport/Vehicle Service', 'Maintenance', 'Supplies/Stationery', 'Infrastructure', 'Other'
];

const PAYMENT_METHODS = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Online', value: 'online' },
];

const initialFormData: IExpenseFormData = {
    expense_category: '',
    expense_date: '',
    amount: '',
    vendor_name: '',
    description: '',
    payment_method: '',
    receipt_attachment_url: '',
};

const ExpenseList: FC = () => {
    const { user, academicYearVersion } = useAuthStore();
    const { hasPermission } = usePermissions();
    const academicYearId = user?.current_academic_year?.id;

    const [expenses, setExpenses] = useState<IExpenseRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<IExpenseRecord | null>(null);
    const [formData, setFormData] = useState<IExpenseFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    const handleMenuClick = (event: React.MouseEvent, expenseId: number) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        setShowActionsMenu(showActionsMenu === expenseId ? null : expenseId);
    };

    useEffect(() => {
        if (academicYearId) fetchExpenses();
    }, [academicYearId, filterCategory, startDate, endDate, academicYearVersion]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const params: any = { academic_year_id: academicYearId };
            if (filterCategory) params.category = filterCategory;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            const data = await financeService.listExpenses(params);
            setExpenses(Array.isArray(data) ? data : (data as any).expenses || []);
        } catch (error: any) {
            console.error('Error fetching expenses:', error);
            toast.error(error.message || 'Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    };

    const totalExpense = useMemo(() =>
        expenses.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0), [expenses]);

    const salaryExpense = useMemo(() =>
        expenses.filter(e => e.expense_category === 'Staff Salaries')
            .reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0), [expenses]);

    const otherExpense = useMemo(() => totalExpense - salaryExpense, [totalExpense, salaryExpense]);

    const handleAddNew = () => {
        setIsEditMode(false);
        setFormData(initialFormData);
        setShowFormModal(true);
    };

    const handleEdit = (record: IExpenseRecord) => {
        if (record.reference_type === 'salary_payment') {
            toast.error('Salary payment expenses cannot be edited. Use Salary Payments section.');
            return;
        }
        setIsEditMode(true);
        setFormData({
            expense_category: record.expense_category,
            expense_date: new Date(record.expense_date).toISOString().split('T')[0],
            amount: record.amount,
            vendor_name: record.vendor_name || '',
            description: record.description || '',
            payment_method: record.payment_method,
            receipt_attachment_url: record.receipt_attachment_url || '',
        });
        setSelectedExpense(record);
        setShowFormModal(true);
    };

    const handleView = (record: IExpenseRecord) => {
        setSelectedExpense(record);
        setShowViewModal(true);
    };

    const handleDeleteClick = (record: IExpenseRecord) => {
        if (record.reference_type === 'salary_payment') {
            toast.error('Salary payment expenses cannot be deleted. Cancel the payment through Salary Payments.');
            return;
        }
        setSelectedExpense(record);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.expense_category || !formData.expense_date || !formData.amount || !formData.payment_method) {
            toast.error('Please fill all required fields');
            return;
        }
        try {
            setSaving(true);
            const payload = {
                ...formData,
                amount: parseFloat(String(formData.amount)),
                academic_year_id: academicYearId,
                created_by: user?.school_user_id,
                approval_status: 'approved',
            };
            if (isEditMode && selectedExpense) {
                await financeService.updateExpense(selectedExpense.id, payload);
                toast.success('Expense updated successfully');
            } else {
                await financeService.createExpense(payload);
                toast.success('Expense created successfully');
            }
            setShowFormModal(false);
            setFormData(initialFormData);
            fetchExpenses();
        } catch (error: any) {
            console.error('Error saving expense:', error);
            toast.error(error.message || 'Failed to save expense');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedExpense) return;
        try {
            setSaving(true);
            await financeService.deleteExpense(selectedExpense.id);
            toast.success('Expense deleted successfully');
            setShowDeleteDialog(false);
            setSelectedExpense(null);
            fetchExpenses();
        } catch (error: any) {
            console.error('Error deleting expense:', error);
            toast.error(error.message || 'Failed to delete expense');
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            key: 'expense_date',
            label: 'Date',
            width: '7rem',
            render: (value: string) => (
                <span className="text-sm">{new Date(value).toLocaleDateString('en-IN')}</span>
            ),
        },
        {
            key: 'expense_category',
            label: 'Category',
            render: (value: string) => (
                <Badge variant={value === 'Staff Salaries' ? 'primary' : 'secondary'} size="sm">{value}</Badge>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: (value: string) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px] block">
                    {value || '-'}
                </span>
            ),
        },
        {
            key: 'vendor_name',
            label: 'Vendor',
            render: (value: string) => <span className="text-sm">{value || '-'}</span>,
        },
        {
            key: 'amount',
            label: 'Amount',
            className: 'text-right',
            render: (value: number) => (
                <span className="font-semibold text-red-600 dark:text-red-400">
                    {'\u20B9'}{parseFloat(String(value)).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'payment_method',
            label: 'Payment',
            render: (value: string) => value ? (
                <Badge variant="primary" size="sm">{value.replace('_', ' ').toUpperCase()}</Badge>
            ) : <span>-</span>,
        },
        {
            key: 'approval_status',
            label: 'Status',
            render: (value: string) => {
                const variant = value === 'approved' ? 'success' : value === 'pending' ? 'warning' : 'danger';
                return <Badge variant={variant} size="sm">{(value || 'N/A').toUpperCase()}</Badge>;
            },
        },
    ];

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Expenses', href: '#' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Expense Management"
                subtitle="Track and manage all school expenses"
                breadcrumbs={breadcrumbs}
                actions={
                    hasPermission(Permission.MANAGE_EXPENSES) ? (
                        <Button variant="primary" size="sm" onClick={handleAddNew}>
                            + Add Expense
                        </Button>
                    ) : undefined
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Expenses" value={`\u20B9${totalExpense.toLocaleString('en-IN')}`} icon="💰" />
                <StatCard title="Salary Expenses" value={`\u20B9${salaryExpense.toLocaleString('en-IN')}`} icon="👤" />
                <StatCard title="Other Expenses" value={`\u20B9${otherExpense.toLocaleString('en-IN')}`} icon="📦" />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="w-full sm:w-48">
                        <FormSelect
                            label="Category"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            options={EXPENSE_CATEGORIES.map(c => ({ label: c, value: c }))}
                            placeholder="All Categories"
                        />
                    </div>
                    <div className="w-full sm:w-44">
                        <FormInput
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-44">
                        <FormInput
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    {(filterCategory || startDate || endDate) && (
                        <Button variant="secondary" size="sm" onClick={() => { setFilterCategory(''); setStartDate(''); setEndDate(''); }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Expense Table */}
            <DataTable
                columns={columns}
                data={expenses}
                loading={loading}
                emptyMessage="No expenses found"
                striped
                actions={(row: IExpenseRecord) => (
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

            {/* Actions Dropdown Menu */}
            {showActionsMenu && (() => {
                const row = expenses.find(e => e.id === showActionsMenu);
                const isSalary = row?.reference_type === 'salary_payment';
                return (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(null)} />
                        <div
                            className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                            style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                        >
                            <button
                                onClick={() => { if (row) handleView(row); setShowActionsMenu(null); }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg text-gray-900 dark:text-gray-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Details
                            </button>
                            {hasPermission(Permission.MANAGE_EXPENSES) && (
                                <button
                                    onClick={() => { if (row) handleEdit(row); setShowActionsMenu(null); }}
                                    disabled={isSalary}
                                    className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2 ${isSalary ? 'opacity-40 cursor-not-allowed text-gray-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                            )}
                            {hasPermission(Permission.MANAGE_EXPENSES) && (
                                <button
                                    onClick={() => { if (row) handleDeleteClick(row); setShowActionsMenu(null); }}
                                    disabled={isSalary}
                                    className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2 last:rounded-b-lg ${isSalary ? 'opacity-40 cursor-not-allowed text-gray-400' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            )}
                        </div>
                    </>
                );
            })()}

            {/* Add/Edit Expense Modal */}
            <Modal
                isOpen={showFormModal}
                onClose={() => { setShowFormModal(false); setFormData(initialFormData); }}
                title={isEditMode ? 'Edit Expense' : 'Add New Expense'}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => { setShowFormModal(false); setFormData(initialFormData); }}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} isLoading={saving} loadingText="Saving...">
                            {isEditMode ? 'Update' : 'Save'}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormSelect
                        label="Expense Category"
                        required
                        value={formData.expense_category}
                        onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
                        options={EXPENSE_CATEGORIES.map(c => ({ label: c, value: c }))}
                    />
                    <FormInput
                        label="Expense Date"
                        type="date"
                        required
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    />
                    <FormInput
                        label="Amount"
                        type="number"
                        required
                        value={String(formData.amount)}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                    />
                    <FormSelect
                        label="Payment Method"
                        required
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        options={PAYMENT_METHODS}
                    />
                    <div className="sm:col-span-2">
                        <FormInput
                            label="Vendor/Payee"
                            value={formData.vendor_name}
                            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                            placeholder="Vendor or payee name"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <FormTextarea
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Expense description"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <FormInput
                            label="Receipt URL (optional)"
                            value={formData.receipt_attachment_url}
                            onChange={(e) => setFormData({ ...formData, receipt_attachment_url: e.target.value })}
                            placeholder="Paste receipt URL"
                            help="Upload receipt to cloud storage and paste URL"
                        />
                    </div>
                </div>
            </Modal>

            {/* View Expense Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Expense Details"
                size="md"
                footer={
                    <div className="flex justify-end">
                        <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
                    </div>
                }
            >
                {selectedExpense && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedExpense.expense_category}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(selectedExpense.expense_date).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                            <p className="text-lg font-bold text-red-600">{'\u20B9'}{parseFloat(String(selectedExpense.amount)).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {selectedExpense.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Vendor/Payee</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedExpense.vendor_name || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedExpense.description || 'N/A'}</p>
                        </div>
                        {selectedExpense.receipt_attachment_url && (
                            <div className="col-span-2">
                                <a
                                    href={selectedExpense.receipt_attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    View Receipt
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Expense"
                message={selectedExpense ? `Are you sure you want to delete this ${selectedExpense.expense_category} expense of \u20B9${parseFloat(String(selectedExpense.amount)).toLocaleString('en-IN')}? This action cannot be undone.` : ''}
                onConfirm={confirmDelete}
                onCancel={() => { setShowDeleteDialog(false); setSelectedExpense(null); }}
                confirmText="Delete"
                type="danger"
                isLoading={saving}
            />
        </div>
    );
};

export default ExpenseList;
