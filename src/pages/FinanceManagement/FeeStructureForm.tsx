/**
 * Fee Structure Form Page
 * Create or edit fee structures for a class with recurring payment support.
 * Uses inline editable table rows (not DataTable) for fee entries.
 */

import { FC, useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button, FormSelect, LoadingSpinner } from '../../components';
import { financeService } from '../../services/modules/financeService';
import { useAuthStore } from '../../stores/authStore';
import { IFeeRow } from '../../types/index';

const FEE_NAMES = [
    'TUITION', 'ADMISSION', 'EXAM', 'LIBRARY', 'SPORTS',
    'TRANSPORT', 'HOSTEL', 'LAB', 'ACTIVITY', 'LATE_FEE', 'OTHER'
];

const RECURRENCE_TYPES = [
    { label: 'One Time', value: 'ONE_TIME' },
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Quarterly', value: 'QUARTERLY' },
    { label: 'Yearly', value: 'YEARLY' },
];

interface FeeRowState extends IFeeRow {
    _rowId: number;
}

const FeeStructureForm: FC = () => {
    const navigate = useNavigate();
    const { classId } = useParams<{ classId: string }>();
    const isEditMode = !!classId;

    const { user, academicYearVersion } = useAuthStore();
    const academicYearId = user?.current_academic_year?.id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState(classId || '');
    const [feeRows, setFeeRows] = useState<FeeRowState[]>([createEmptyRow()]);

    function createEmptyRow(): FeeRowState {
        return {
            _rowId: Date.now() + Math.random(),
            fee_name: 'TUITION',
            amount: 0,
            is_mandatory: true,
            description: '',
            is_recurring: false,
            recurrence_type: 'ONE_TIME' as const,
            recurrence_amount: 0,
            recurrence_months: 0,
            allows_installments: false,
        };
    }

    useEffect(() => {
        fetchClasses();
        if (isEditMode && academicYearId) fetchExistingFees();
    }, [academicYearId, academicYearVersion]);

    const fetchClasses = async () => {
        try {
            const data = await financeService.listClasses();
            setClasses(Array.isArray(data) ? data : (data as any).data || []);
        } catch (error: any) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchExistingFees = async () => {
        try {
            setLoading(true);
            const response = await financeService.listFeeStructures(academicYearId!);
            const allFees = response.data || response || [];
            const classFees = (Array.isArray(allFees) ? allFees : []).filter((f: any) => String(f.class_id) === classId);
            if (classFees.length > 0) {
                setFeeRows(classFees.map((fee: any) => ({
                    _rowId: fee.id || Date.now() + Math.random(),
                    id: fee.id,
                    fee_id: fee.id,
                    fee_name: fee.fee_name,
                    amount: fee.amount,
                    is_mandatory: fee.is_mandatory,
                    description: fee.description || '',
                    is_recurring: fee.is_recurring || false,
                    recurrence_type: fee.recurrence_type || 'ONE_TIME',
                    recurrence_amount: fee.recurrence_amount || 0,
                    recurrence_months: fee.recurrence_months || 0,
                    allows_installments: fee.allows_installments !== false,
                })));
            }
        } catch (error: any) {
            console.error('Error fetching existing fees:', error);
            toast.error('Failed to load existing fee structure');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalAmount = (row: FeeRowState) => {
        if (!row.is_recurring || row.recurrence_type === 'ONE_TIME') {
            return parseFloat(String(row.amount)) || 0;
        }
        return (parseFloat(String(row.recurrence_amount)) || 0) * (parseInt(String(row.recurrence_months)) || 0);
    };

    const updateRow = (rowId: number, field: string, value: any) => {
        setFeeRows(prev => prev.map(row => {
            if (row._rowId !== rowId) return row;
            const updated = { ...row, [field]: value };

            if (field === 'is_recurring') {
                if (value) {
                    updated.recurrence_type = 'MONTHLY';
                    updated.recurrence_amount = 0;
                    updated.recurrence_months = 0;
                    updated.amount = 0;
                } else {
                    updated.recurrence_type = 'ONE_TIME';
                    updated.recurrence_amount = 0;
                    updated.recurrence_months = 0;
                }
            }

            if (updated.is_recurring && ['recurrence_amount', 'recurrence_months', 'recurrence_type'].includes(field)) {
                const recAmount = parseFloat(String(updated.recurrence_amount)) || 0;
                const recMonths = parseInt(String(updated.recurrence_months)) || 0;
                updated.amount = recAmount * recMonths;
            }

            return updated;
        }));
    };

    const addRow = () => setFeeRows(prev => [...prev, createEmptyRow()]);

    const removeRow = async (row: FeeRowState) => {
        if (feeRows.length === 1) {
            toast.error('At least one fee is required');
            return;
        }
        if (row.fee_id) {
            try {
                setLoading(true);
                await financeService.deleteFeeStructure(row.fee_id);
                toast.success('Fee deleted successfully');
            } catch (error: any) {
                toast.error('Failed to delete fee');
                return;
            } finally {
                setLoading(false);
            }
        }
        setFeeRows(prev => prev.filter(r => r._rowId !== row._rowId));
    };

    const handleSubmit = async () => {
        if (!selectedClassId) {
            toast.error('Please select a class');
            return;
        }

        const invalid = feeRows.some(row => {
            if (!row.fee_name) return true;
            if (row.is_recurring) return !row.recurrence_amount || !row.recurrence_months;
            return !row.amount;
        });
        if (invalid) {
            toast.error('Please fill all required fields for each fee');
            return;
        }

        try {
            setSaving(true);
            const promises = feeRows.map(fee => {
                const payload: any = {
                    fee_name: fee.fee_name,
                    amount: calculateTotalAmount(fee),
                    is_mandatory: fee.is_mandatory,
                    description: fee.description,
                    is_recurring: fee.is_recurring,
                    recurrence_type: fee.recurrence_type,
                    recurrence_amount: fee.is_recurring ? fee.recurrence_amount : null,
                    recurrence_months: fee.is_recurring ? fee.recurrence_months : null,
                    allows_installments: fee.allows_installments,
                };

                if (fee.fee_id) {
                    return financeService.updateFeeStructure(fee.fee_id, payload);
                } else {
                    return financeService.createFeeStructure({
                        ...payload,
                        class_id: parseInt(selectedClassId),
                        academic_year_id: academicYearId,
                    });
                }
            });

            await Promise.all(promises);
            toast.success(isEditMode ? 'Fee structure updated successfully' : `${feeRows.length} fee structure(s) created successfully`);
            navigate('/finance/fee-structure');
        } catch (error: any) {
            console.error('Error saving fee structures:', error);
            toast.error(error.message || 'Failed to save fee structures');
        } finally {
            setSaving(false);
        }
    };

    const totalAmount = useMemo(() => feeRows.reduce((sum, r) => sum + calculateTotalAmount(r), 0), [feeRows]);

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Fee Structure', href: '/finance/fee-structure' },
        { label: isEditMode ? 'Edit' : 'Create', href: '#' },
    ];

    if (loading) return <LoadingSpinner message="Loading fee structure..." fullHeight />;

    return (
        <div className="space-y-6">
            <PageHeader
                title={isEditMode ? 'Edit Fee Structure' : 'Create Fee Structure'}
                subtitle={isEditMode ? 'Update existing fees or add new fees for this class' : 'Add multiple fees for a class. Toggle recurring for fees like tuition.'}
                breadcrumbs={breadcrumbs}
                actions={
                    <Button variant="secondary" size="sm" onClick={() => navigate('/finance/fee-structure')}>
                        Back
                    </Button>
                }
            />

            {isEditMode && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        You are editing the fee structure. You can update existing fees, add new fees, or delete fees.
                    </p>
                </div>
            )}

            {/* Class Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="w-full sm:w-72">
                    <FormSelect
                        label="Select Class"
                        required
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        options={classes.map((cls: any) => ({
                            label: cls.class_name,
                            value: String(cls.id),
                        }))}
                        disabled={isEditMode}
                    />
                </div>
            </div>

            {/* Fee Rows Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Fee Items</h3>
                    <Button variant="secondary" size="sm" onClick={addRow}>+ Add Fee</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Fee Name</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Type</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase w-20">Recurring</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Amount/Period</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase w-24">Periods</th>
                                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Total</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase w-24">Installments</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase w-24">Mandatory</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {feeRows.map((row) => (
                                <tr key={row._rowId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    {/* Fee Name */}
                                    <td className="px-3 py-2">
                                        <select
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={row.fee_name}
                                            onChange={(e) => updateRow(row._rowId, 'fee_name', e.target.value)}
                                        >
                                            {FEE_NAMES.map(n => <option key={n} value={n}>{n.replace('_', ' ')}</option>)}
                                        </select>
                                    </td>
                                    {/* Recurrence Type */}
                                    <td className="px-3 py-2">
                                        <select
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={row.recurrence_type}
                                            onChange={(e) => updateRow(row._rowId, 'recurrence_type', e.target.value)}
                                        >
                                            {RECURRENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </td>
                                    {/* Recurring Checkbox */}
                                    <td className="px-3 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                            checked={row.is_recurring}
                                            onChange={(e) => updateRow(row._rowId, 'is_recurring', e.target.checked)}
                                            disabled={row.recurrence_type === 'ONE_TIME'}
                                        />
                                    </td>
                                    {/* Amount/Period */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={row.is_recurring ? (row.recurrence_amount || '') : (row.amount || '')}
                                            onChange={(e) => updateRow(row._rowId, row.is_recurring ? 'recurrence_amount' : 'amount', e.target.value)}
                                            placeholder={row.is_recurring ? 'Per period' : 'Total amount'}
                                            min="0"
                                            step="0.01"
                                        />
                                    </td>
                                    {/* Periods */}
                                    <td className="px-3 py-2">
                                        {row.is_recurring ? (
                                            <input
                                                type="number"
                                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={row.recurrence_months || ''}
                                                onChange={(e) => updateRow(row._rowId, 'recurrence_months', e.target.value)}
                                                placeholder="Count"
                                                min="1"
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-center block">-</span>
                                        )}
                                    </td>
                                    {/* Calculated Total */}
                                    <td className="px-3 py-2 text-right">
                                        <span className={`font-bold ${calculateTotalAmount(row) > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                            {'\u20B9'}{calculateTotalAmount(row).toLocaleString('en-IN')}
                                        </span>
                                    </td>
                                    {/* Installments Checkbox */}
                                    <td className="px-3 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                            checked={row.allows_installments}
                                            onChange={(e) => updateRow(row._rowId, 'allows_installments', e.target.checked)}
                                            disabled={!row.is_recurring}
                                        />
                                    </td>
                                    {/* Mandatory */}
                                    <td className="px-3 py-2 text-center">
                                        <select
                                            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={String(row.is_mandatory)}
                                            onChange={(e) => updateRow(row._rowId, 'is_mandatory', e.target.value === 'true')}
                                        >
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </td>
                                    {/* Delete */}
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                            onClick={() => removeRow(row)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Total Amount */}
                <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-6 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {'\u20B9'}{totalAmount.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => navigate('/finance/fee-structure')}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} isLoading={saving} loadingText="Saving...">
                    {isEditMode ? 'Update Fee Structure' : 'Save Fee Structure'}
                </Button>
            </div>
        </div>
    );
};

export default FeeStructureForm;
