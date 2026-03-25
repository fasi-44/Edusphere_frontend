/**
 * Installment Dialog Component
 * Setup installments for a student fee - auto-recurring or manual mode.
 * No external date libraries - uses native Date.
 */

import { FC, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Modal, Badge, Button, FormInput } from '../../components';
import { financeService } from '../../services/modules/financeService';
import { useAuthStore } from '../../stores/authStore';

interface InstallmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    studentFee: any;
    onSuccess: () => void;
}

interface InstallmentRow {
    id: number;
    installment_name: string;
    amount: string;
    due_date: string;
}

function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr || new Date().toISOString().split('T')[0]);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const InstallmentDialog: FC<InstallmentDialogProps> = ({ isOpen, onClose, studentFee, onSuccess }) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'auto-recurring' | 'manual'>('manual');
    const [installments, setInstallments] = useState<InstallmentRow[]>([]);
    const [recurringPreview, setRecurringPreview] = useState<{ name: string; amount: number; dueDate: string }[]>([]);

    useEffect(() => {
        if (isOpen && studentFee) {
            const isRecurring = studentFee.fee_structure?.is_recurring;
            setMode(isRecurring ? 'auto-recurring' : 'manual');
            if (isRecurring) {
                generateRecurringPreview();
            } else {
                initializeManualInstallments(3);
            }
        }
    }, [isOpen, studentFee]);

    const generateRecurringPreview = () => {
        if (!studentFee?.fee_structure) return;
        const { recurrence_type, recurrence_amount, recurrence_months } = studentFee.fee_structure;
        const baseDate = studentFee.due_date || new Date().toISOString().split('T')[0];
        const amount = parseFloat(recurrence_amount || 0);
        const periods = parseInt(recurrence_months || 0);
        const preview: { name: string; amount: number; dueDate: string }[] = [];

        const daysMap: Record<string, number> = { MONTHLY: 30, QUARTERLY: 90, YEARLY: 365 };
        const labelMap: Record<string, string> = { MONTHLY: 'Month', QUARTERLY: 'Quarter', YEARLY: 'Year' };
        const intervalDays = daysMap[recurrence_type] || 30;
        const label = labelMap[recurrence_type] || 'Period';

        for (let i = 0; i < periods; i++) {
            preview.push({
                name: `${label} ${i + 1}`,
                amount,
                dueDate: addDays(baseDate, i * intervalDays),
            });
        }
        setRecurringPreview(preview);
    };

    const initializeManualInstallments = (count: number) => {
        const balance = parseFloat(studentFee?.balance_amount || 0);
        const amountPer = (balance / count).toFixed(2);
        const baseDate = studentFee?.due_date || new Date().toISOString().split('T')[0];

        setInstallments(Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            installment_name: `Installment ${i + 1}`,
            amount: amountPer,
            due_date: addDays(baseDate, i * 30),
        })));
    };

    const handleQuickCount = (count: number) => {
        initializeManualInstallments(count);
    };

    const addInstallment = () => {
        const lastDate = installments.length > 0
            ? installments[installments.length - 1].due_date
            : (studentFee?.due_date || new Date().toISOString().split('T')[0]);

        setInstallments(prev => [...prev, {
            id: Date.now(),
            installment_name: `Installment ${prev.length + 1}`,
            amount: '',
            due_date: addDays(lastDate, 30),
        }]);
    };

    const removeInstallment = (id: number) => {
        if (installments.length <= 1) { toast.error('At least one installment is required'); return; }
        setInstallments(prev => prev.filter(i => i.id !== id));
    };

    const updateInstallment = (id: number, field: keyof InstallmentRow, value: string) => {
        setInstallments(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const totalAmount = useMemo(() => {
        if (mode === 'auto-recurring') return recurringPreview.reduce((s, i) => s + i.amount, 0);
        return installments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    }, [mode, installments, recurringPreview]);

    const expectedAmount = parseFloat(studentFee?.balance_amount || 0);
    const isValidTotal = Math.abs(totalAmount - expectedAmount) < 0.01;

    const handleSubmit = async () => {
        if (!isValidTotal) {
            toast.error(`Total (${'\u20B9'}${totalAmount.toFixed(2)}) must equal balance (${'\u20B9'}${expectedAmount.toFixed(2)})`);
            return;
        }
        try {
            setLoading(true);
            if (mode === 'auto-recurring') {
                await financeService.autoGenerateInstallments({
                    student_fee_id: studentFee.id,
                    skid: user?.skid,
                });
                toast.success('Installments generated successfully');
            } else {
                const installmentData = installments.map(i => ({
                    installment_name: i.installment_name,
                    amount: parseFloat(i.amount),
                    due_date: i.due_date,
                }));
                await financeService.createManualInstallments({
                    student_fee_id: studentFee.id,
                    installments: installmentData,
                });
                toast.success(`${installmentData.length} installments created successfully`);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating installments:', error);
            toast.error(error.message || 'Failed to create installments');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setInstallments([]);
        setRecurringPreview([]);
        setMode('manual');
        onClose();
    };

    if (!studentFee) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Setup Installments"
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={loading}
                        loadingText="Creating..."
                        disabled={!isValidTotal}
                    >
                        {mode === 'auto-recurring' ? 'Generate Installments' : 'Create Installments'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Fee Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Total Fee: {'\u20B9'}{studentFee.total_amount?.toLocaleString('en-IN')}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Balance to pay: {'\u20B9'}{studentFee.balance_amount?.toLocaleString('en-IN')}
                            </p>
                        </div>
                        {studentFee.fee_structure?.is_recurring && (
                            <div className="text-right">
                                <Badge variant="primary" size="sm">{studentFee.fee_structure.recurrence_type}</Badge>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {'\u20B9'}{studentFee.fee_structure.recurrence_amount} x {studentFee.fee_structure.recurrence_months} periods
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mode Selection (only for recurring) */}
                {studentFee.fee_structure?.is_recurring && (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Choose Installment Method</p>
                        <div className="space-y-2">
                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === 'auto-recurring' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                <input
                                    type="radio"
                                    name="installmentMode"
                                    checked={mode === 'auto-recurring'}
                                    onChange={() => { setMode('auto-recurring'); generateRecurringPreview(); }}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">Auto-generate {studentFee.fee_structure.recurrence_type} Installments</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Creates {studentFee.fee_structure.recurrence_months} installments based on {studentFee.fee_structure.recurrence_type.toLowerCase()} schedule</p>
                                </div>
                            </label>
                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === 'manual' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                <input
                                    type="radio"
                                    name="installmentMode"
                                    checked={mode === 'manual'}
                                    onChange={() => { setMode('manual'); initializeManualInstallments(3); }}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">Create Custom Installments</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Manually define installment amounts and due dates</p>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Auto-Recurring Preview */}
                {mode === 'auto-recurring' && (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Installment Schedule Preview</p>
                        <div className="max-h-72 overflow-y-auto space-y-2">
                            {recurringPreview.map((inst, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="primary" size="sm">#{index + 1}</Badge>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{inst.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-gray-900 dark:text-white">{'\u20B9'}{inst.amount.toLocaleString('en-IN')}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Due: {formatDate(inst.dueDate)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manual Installments */}
                {mode === 'manual' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Number of Installments</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[2, 3, 4, 6, 12].map(num => (
                                <Button
                                    key={num}
                                    variant={installments.length === num ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => handleQuickCount(num)}
                                >
                                    {num}
                                </Button>
                            ))}
                            <Button variant="secondary" size="sm" onClick={addInstallment}>+ Custom</Button>
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-3">
                            {installments.map((inst) => (
                                <div key={inst.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                        <div className="sm:col-span-4">
                                            <FormInput
                                                label="Name"
                                                value={inst.installment_name}
                                                onChange={(e) => updateInstallment(inst.id, 'installment_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <FormInput
                                                label="Amount"
                                                type="number"
                                                value={inst.amount}
                                                onChange={(e) => updateInstallment(inst.id, 'amount', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-4">
                                            <FormInput
                                                label="Due Date"
                                                type="date"
                                                value={inst.due_date}
                                                onChange={(e) => updateInstallment(inst.id, 'due_date', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex items-end">
                                            <button
                                                className="text-red-500 hover:text-red-700 p-2 disabled:opacity-30"
                                                onClick={() => removeInstallment(inst.id)}
                                                disabled={installments.length === 1}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Total Summary */}
                <div className={`p-4 rounded-lg border ${isValidTotal ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Installment Amount</p>
                            <p className={`text-lg font-bold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
                                {'\u20B9'}{totalAmount.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Expected Amount</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {'\u20B9'}{expectedAmount.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    {!isValidTotal && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            Total installment amount must equal the fee balance amount.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default InstallmentDialog;
