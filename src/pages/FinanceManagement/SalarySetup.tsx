/**
 * Salary Setup Page
 * CRUD for staff salary structures with allowances and deductions.
 */

import { FC, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, DataTable, Badge, Button, Modal, ConfirmDialog, FormInput, FormSelect } from '../../components';
import { financeService } from '../../services/modules/financeService';
import { useAuthStore } from '../../stores/authStore';
import { ISalarySetup } from '../../types/index';

const SalarySetup: FC = () => {
    const { user, academicYearVersion } = useAuthStore();
    const academicYearId = user?.current_academic_year?.id;

    const [salarySetups, setSalarySetups] = useState<ISalarySetup[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedSetup, setSelectedSetup] = useState<ISalarySetup | null>(null);
    const [saving, setSaving] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    const handleMenuClick = (event: React.MouseEvent, setupId: number) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        setShowActionsMenu(showActionsMenu === setupId ? null : setupId);
    };

    const [formData, setFormData] = useState({
        id: null as number | null,
        staff_id: '',
        basic_salary: '',
        allowances: { hra: '', da: '', transport: '' },
        deductions: { pf: '', tax: '' },
        effective_from: '',
    });

    useEffect(() => {
        if (academicYearId) fetchSalarySetups();
    }, [academicYearId, academicYearVersion]);

    useEffect(() => {
        if (showDialog) fetchStaffList();
    }, [showDialog]);

    const fetchSalarySetups = async () => {
        try {
            setLoading(true);
            const data = await financeService.listSalarySetups(academicYearId!);
            setSalarySetups(Array.isArray(data) ? data : (data as any).salary_setups || []);
        } catch (error: any) {
            console.error('Error fetching salary setups:', error);
            toast.error(error.message || 'Failed to fetch salary setups');
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffList = async () => {
        try {
            const data = await financeService.listStaff();
            setStaffList(Array.isArray(data) ? data : (data as any).staff || []);
        } catch (error: any) {
            console.error('Error fetching staff:', error);
        }
    };

    const resetForm = () => {
        setIsEditMode(false);
        setFormData({
            id: null,
            staff_id: '',
            basic_salary: '',
            allowances: { hra: '', da: '', transport: '' },
            deductions: { pf: '', tax: '' },
            effective_from: '',
        });
    };

    const handleAdd = () => {
        resetForm();
        setShowDialog(true);
    };

    const handleEdit = (record: ISalarySetup) => {
        setIsEditMode(true);
        setFormData({
            id: record.id,
            staff_id: String(record.staff_id),
            basic_salary: String(record.basic_salary),
            allowances: {
                hra: String(record.allowances?.hra || ''),
                da: String(record.allowances?.da || ''),
                transport: String(record.allowances?.transport || ''),
            },
            deductions: {
                pf: String(record.deductions?.pf || ''),
                tax: String(record.deductions?.tax || ''),
            },
            effective_from: record.effective_from,
        });
        setShowDialog(true);
    };

    const handleDeleteClick = (record: ISalarySetup) => {
        setSelectedSetup(record);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.staff_id || !formData.basic_salary || !formData.effective_from) {
            toast.error('Please fill all required fields');
            return;
        }
        try {
            setSaving(true);
            const cleanAllowances: Record<string, number> = {};
            Object.entries(formData.allowances).forEach(([key, value]) => {
                if (value && value !== '') cleanAllowances[key] = parseFloat(value);
            });
            const cleanDeductions: Record<string, number> = {};
            Object.entries(formData.deductions).forEach(([key, value]) => {
                if (value && value !== '') cleanDeductions[key] = parseFloat(value);
            });

            const payload: any = {
                staff_id: parseInt(formData.staff_id),
                basic_salary: parseFloat(formData.basic_salary),
                allowances: cleanAllowances,
                deductions: cleanDeductions,
                effective_from: formData.effective_from,
                academic_year_id: academicYearId,
            };

            if (isEditMode) {
                payload.id = formData.id;
                await financeService.updateSalarySetup(payload);
                toast.success('Salary setup updated successfully');
            } else {
                await financeService.createSalarySetup(payload);
                toast.success('Salary setup created successfully');
            }
            setShowDialog(false);
            resetForm();
            fetchSalarySetups();
        } catch (error: any) {
            console.error('Error saving salary setup:', error);
            toast.error(error.message || 'Failed to save salary setup');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedSetup) return;
        try {
            setSaving(true);
            await financeService.deleteSalarySetup(selectedSetup.id);
            toast.success('Salary setup deleted successfully');
            setShowDeleteDialog(false);
            setSelectedSetup(null);
            fetchSalarySetups();
        } catch (error: any) {
            console.error('Error deleting salary setup:', error);
            toast.error(error.message || 'Failed to delete salary setup');
        } finally {
            setSaving(false);
        }
    };

    const totals = useMemo(() => {
        const basic = parseFloat(formData.basic_salary) || 0;
        const allowancesTotal = Object.values(formData.allowances)
            .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        const deductionsTotal = Object.values(formData.deductions)
            .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        return { gross: basic + allowancesTotal, net: basic + allowancesTotal - deductionsTotal };
    }, [formData.basic_salary, formData.allowances, formData.deductions]);

    const columns = [
        {
            key: 'staff_name',
            label: 'Staff Name',
            render: (value: string) => <span className="font-medium">{value}</span>,
        },
        {
            key: 'employee_id',
            label: 'Employee ID',
            render: (value: string) => <span className="text-sm">{value || 'N/A'}</span>,
        },
        {
            key: 'basic_salary',
            label: 'Basic Salary',
            className: 'text-right',
            render: (value: number) => <span>{'\u20B9'}{parseFloat(String(value)).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'gross_salary',
            label: 'Gross Salary',
            className: 'text-right',
            render: (value: number) => <span>{'\u20B9'}{parseFloat(String(value)).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'net_salary',
            label: 'Net Salary',
            className: 'text-right',
            render: (value: number) => (
                <span className="font-bold text-blue-600 dark:text-blue-400">
                    {'\u20B9'}{parseFloat(String(value)).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'effective_from',
            label: 'Effective From',
            render: (value: string) => <span className="text-sm">{new Date(value).toLocaleDateString('en-IN')}</span>,
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (value: boolean) => (
                <Badge variant={value ? 'success' : 'danger'} size="sm">
                    {value ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
    ];

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Salary Setup', href: '#' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Staff Salary / Payroll Setup"
                subtitle="Configure salary structures for staff members"
                breadcrumbs={breadcrumbs}
                actions={
                    <Button variant="primary" size="sm" onClick={handleAdd}>
                        + Add Salary Setup
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={salarySetups}
                loading={loading}
                emptyMessage="No salary setups found"
                striped
                actions={(row: ISalarySetup) => (
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
            {showActionsMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(null)} />
                    <div
                        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                    >
                        <button
                            onClick={() => { const row = salarySetups.find(r => r.id === showActionsMenu); if (row) handleEdit(row); setShowActionsMenu(null); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg text-gray-900 dark:text-gray-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            onClick={() => { const row = salarySetups.find(r => r.id === showActionsMenu); if (row) handleDeleteClick(row); setShowActionsMenu(null); }}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 last:rounded-b-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </>
            )}

            {/* Add/Edit Salary Setup Modal */}
            <Modal
                isOpen={showDialog}
                onClose={() => { setShowDialog(false); resetForm(); }}
                title={isEditMode ? 'Edit Salary Setup' : 'Setup Staff Salary'}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit} isLoading={saving} loadingText="Saving...">
                            {isEditMode ? 'Update' : 'Save'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormSelect
                            label="Select Staff"
                            required
                            value={formData.staff_id}
                            onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                            options={staffList.map((s: any) => ({
                                label: `${s.full_name} (${s.profile?.employee_id || 'No ID'} - ${s.role_name})`,
                                value: String(s.id),
                            }))}
                            disabled={isEditMode}
                        />
                        <FormInput
                            label="Basic Salary"
                            type="number"
                            required
                            value={formData.basic_salary}
                            onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                            placeholder="0.00"
                        />
                        <FormInput
                            label="Effective From"
                            type="date"
                            required
                            value={formData.effective_from}
                            onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                        />
                    </div>

                    {/* Allowances */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Allowances</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormInput
                                label="HRA"
                                type="number"
                                value={formData.allowances.hra}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    allowances: { ...formData.allowances, hra: e.target.value }
                                })}
                                placeholder="0.00"
                            />
                            <FormInput
                                label="DA"
                                type="number"
                                value={formData.allowances.da}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    allowances: { ...formData.allowances, da: e.target.value }
                                })}
                                placeholder="0.00"
                            />
                            <FormInput
                                label="Transport Allowance"
                                type="number"
                                value={formData.allowances.transport}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    allowances: { ...formData.allowances, transport: e.target.value }
                                })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Deductions */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Deductions</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput
                                label="PF"
                                type="number"
                                value={formData.deductions.pf}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    deductions: { ...formData.deductions, pf: e.target.value }
                                })}
                                placeholder="0.00"
                            />
                            <FormInput
                                label="Tax"
                                type="number"
                                value={formData.deductions.tax}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    deductions: { ...formData.deductions, tax: e.target.value }
                                })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Salary Summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Gross Salary:</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {'\u20B9'}{totals.gross.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Net Salary:</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {'\u20B9'}{totals.net.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Salary Setup"
                message={`Are you sure you want to delete the salary setup for ${selectedSetup?.staff_name}?`}
                onConfirm={confirmDelete}
                onCancel={() => { setShowDeleteDialog(false); setSelectedSetup(null); }}
                confirmText="Delete"
                type="danger"
                isLoading={saving}
            />
        </div>
    );
};

export default SalarySetup;
