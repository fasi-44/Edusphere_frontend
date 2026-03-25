/**
 * Fee Collection Page
 * Search student → view fee summary → record payments / setup installments.
 */

import { FC, lazy, Suspense, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, DataTable, Badge, Button, StatCard, Modal, FormInput, FormSelect, FormTextarea } from '../../components';

const StudentExamTimetableModal = lazy(() => import('../ExamManagement/components/StudentExamTimetableModal'));
import { financeService } from '../../services/modules/financeService';
import { useAuthStore } from '../../stores/authStore';
import { IStudentFeeSummary, IStudentFee, IInstallment, IPaymentData } from '../../types/index';
import InstallmentDialog from './InstallmentDialog';
import { generateFeeReceiptPdf, generateFeeSummaryReceiptPdf } from '../../prints';
import type { SchoolData, PdfAction } from '../../prints';

const PAYMENT_MODES = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Cheque', value: 'CHEQUE' },
    { label: 'Online', value: 'ONLINE' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Card', value: 'CARD' },
    { label: 'Demand Draft', value: 'DEMAND_DRAFT' },
];

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    PAID: 'success',
    PARTIAL: 'warning',
    PENDING: 'danger',
    OVERDUE: 'danger',
    CANCELLED: 'secondary',
};

const defaultPaymentData: IPaymentData = {
    amount_paid: 0,
    payment_mode: 'CASH',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    cheque_number: '',
    bank_name: '',
    remarks: '',
};

const FeeCollection: FC = () => {
    const { user } = useAuthStore();
    const academicYearId = user?.current_academic_year?.id;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [feeSummary, setFeeSummary] = useState<IStudentFeeSummary | null>(null);
    const [feeInstallments, setFeeInstallments] = useState<Record<number, IInstallment[]>>({});
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Payment dialog
    const [showPayDialog, setShowPayDialog] = useState(false);
    const [selectedFee, setSelectedFee] = useState<IStudentFee | null>(null);
    const [selectedInstallment, setSelectedInstallment] = useState<IInstallment | null>(null);
    const [paymentData, setPaymentData] = useState<IPaymentData>({ ...defaultPaymentData });
    const [paying, setPaying] = useState(false);

    // Installment setup dialog
    const [showInstallmentDialog, setShowInstallmentDialog] = useState(false);
    const [installmentFee, setInstallmentFee] = useState<IStudentFee | null>(null);

    // Expanded installment rows
    const [expandedFeeId, setExpandedFeeId] = useState<number | null>(null);

    // Exam Timetable Modal
    const [showExamTimetableModal, setShowExamTimetableModal] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) { toast.error('Enter a student name, phone, or roll number'); return; }
        try {
            setSearching(true);
            setSelectedStudent(null);
            setFeeSummary(null);
            setFeeInstallments({});
            const data = await financeService.searchStudent(searchQuery.trim(), academicYearId!);
            const results = Array.isArray(data) ? data : (data as any).students || [];
            if (results.length === 0) {
                toast.error('No student found');
                setSearchResults([]);
            } else if (results.length === 1) {
                selectStudent(results[0]);
                setSearchResults([]);
            } else {
                setSearchResults(results);
            }
        } catch (error: any) {
            console.error('Error searching student:', error);
            toast.error(error.message || 'Failed to search student');
        } finally {
            setSearching(false);
        }
    };

    const selectStudent = (student: any) => {
        setSelectedStudent(student);
        setSearchResults([]);
        fetchFeeSummary(student.user_id);
    };

    const fetchFeeSummary = async (userId: number) => {
        try {
            setLoading(true);
            const data = await financeService.getStudentFeeSummary(userId, academicYearId!);
            const summary = data.data || data;
            setFeeSummary(summary);

            // Fetch installments for fees that have them
            const fees: IStudentFee[] = summary.fees || [];
            const installmentMap: Record<number, IInstallment[]> = {};
            await Promise.all(
                fees
                    .filter(f => f.has_installments)
                    .map(async (fee) => {
                        try {
                            const instData = await financeService.getInstallments(fee.id);
                            installmentMap[fee.id] = Array.isArray(instData) ? instData : (instData as any).installments || [];
                        } catch {
                            installmentMap[fee.id] = [];
                        }
                    })
            );
            setFeeInstallments(installmentMap);
        } catch (error: any) {
            console.error('Error fetching fee summary:', error);
            toast.error(error.message || 'Failed to load fee summary');
        } finally {
            setLoading(false);
        }
    };

    const resetSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedStudent(null);
        setFeeSummary(null);
        setFeeInstallments({});
        setExpandedFeeId(null);
    };

    // --- Payment ---
    const openPayment = (fee: IStudentFee, installment?: IInstallment) => {
        setSelectedFee(fee);
        setSelectedInstallment(installment || null);
        setPaymentData({
            ...defaultPaymentData,
            amount_paid: Number(installment ? installment.balance_amount : fee.balance_amount),
            payment_date: new Date().toISOString().split('T')[0],
        });
        setShowPayDialog(true);
    };

    const submitPayment = async () => {
        if (!selectedFee) return;
        const amount = paymentData.amount_paid;
        if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
        if (!paymentData.payment_mode) { toast.error('Select a payment mode'); return; }

        try {
            setPaying(true);
            let result: any;
            if (selectedInstallment) {
                result = await financeService.recordInstallmentPayment(selectedInstallment.id, paymentData);
            } else {
                result = await financeService.recordPayment({
                    student_fee_id: selectedFee.id,
                    ...paymentData,
                });
            }
            const data = result.data || result;
            toast.success(`Payment recorded! ${data.receipt_number ? `Receipt: ${data.receipt_number}` : ''}`);
            setShowPayDialog(false);
            setSelectedFee(null);
            setSelectedInstallment(null);
            setPaymentData({ ...defaultPaymentData });
            if (selectedStudent) fetchFeeSummary(selectedStudent.user_id);
        } catch (error: any) {
            console.error('Error recording payment:', error);
            toast.error(error.message || 'Failed to record payment');
        } finally {
            setPaying(false);
        }
    };

    // --- Convert to Full Payment ---
    const handleConvertToFull = async (fee: IStudentFee) => {
        if (!confirm('This will cancel all remaining installments and allow full payment of the remaining balance. Continue?')) return;
        try {
            setLoading(true);
            const result = await financeService.convertToFullPayment(fee.id);
            const data = result.data || result;
            toast.success(data.message || 'Converted to full payment');
            if (data.remaining_balance !== undefined) {
                toast.success(`Remaining balance: \u20B9${parseFloat(data.remaining_balance).toLocaleString('en-IN')}`);
            }
            if (selectedStudent) fetchFeeSummary(selectedStudent.user_id);
        } catch (error: any) {
            console.error('Error converting to full payment:', error);
            toast.error(error.message || 'Failed to convert');
        } finally {
            setLoading(false);
        }
    };

    // --- Installment Setup ---
    const openInstallmentSetup = (fee: IStudentFee) => {
        setInstallmentFee(fee);
        setShowInstallmentDialog(true);
    };

    const onInstallmentSuccess = () => {
        setShowInstallmentDialog(false);
        setInstallmentFee(null);
        if (selectedStudent) fetchFeeSummary(selectedStudent.user_id);
    };

    // --- Format helpers ---
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Build school data for PDF header
    const getSchoolData = useCallback((): SchoolData => {
        const authUser = useAuthStore.getState().user;
        return {
            schoolName: authUser?.school_name || 'School Name',
            schoolAddress: '',
            schoolPhone: '',
            schoolEmail: authUser?.email || '',
            logo: null,
            generatedBy: authUser?.full_name || authUser?.name || 'System',
        };
    }, []);

    // Handle individual installment/fee receipt print
    const handlePrintReceipt = useCallback(async (fee: IStudentFee, installment?: IInstallment, action: PdfAction = 'print') => {
        if (!selectedStudent) return;

        try {
            const receiptData: any = {
                receiptNumber: installment?.receipt_number || fee.receipt_number || `RCP-${installment?.id || fee.id}`,
                receiptDate: installment?.payment_date || fee.payment_date || new Date().toISOString(),
                studentName: selectedStudent.name,
                rollNumber: selectedStudent.roll_no || '',
                className: selectedStudent.class || '',
                sectionName: selectedStudent.section || '',
                feeName: fee.fee_structure?.fee_name || fee.fee_name || '',
                installmentName: installment?.installment_name,
                amountPaid: installment ? installment.paid_amount : fee.paid_amount,
                paymentMode: installment?.payment_mode || fee.payment_mode || 'N/A',
                transaction_id: installment?.transaction_id || fee.transaction_id,
                cheque_number: installment?.cheque_number || fee.cheque_number,
                bank_name: installment?.bank_name || fee.bank_name,
                remarks: installment?.remarks || fee.remarks,
                totalAmount: fee.total_amount,
                paidAmount: fee.paid_amount,
                balanceAmount: fee.balance_amount,
            };
            await generateFeeReceiptPdf(receiptData, getSchoolData(), action);
            toast.success(`Receipt ${action === 'download' ? 'downloaded' : action === 'print' ? 'sent to printer' : 'opened'} successfully`);
        } catch (err: any) {
            console.error('Error generating receipt:', err);
            toast.error('Failed to generate receipt');
        }
    }, [selectedStudent, getSchoolData]);

    // Handle full summary receipt for all installments
    const handlePrintFullSummary = useCallback(async (fee: IStudentFee, action: PdfAction = 'print') => {
        if (!selectedStudent) return;

        try {
            const installments = feeInstallments[fee.id] || [];
            const summaryData: any = {
                receiptNumber: fee.receipt_number || `SUM-${fee.id}`,
                receiptDate: new Date().toISOString(),
                studentName: selectedStudent.name,
                rollNumber: selectedStudent.roll_no || '',
                className: selectedStudent.class || '',
                sectionName: selectedStudent.section || '',
                feeName: fee.fee_structure?.fee_name || fee.fee_name || '',
                totalAmount: fee.total_amount,
                paidAmount: fee.paid_amount,
                balanceAmount: fee.balance_amount,
                installmentPayments: installments
                    .filter(inst => inst.status === 'PAID')
                    .map(inst => ({
                        installmentName: inst.installment_name,
                        amount: inst.amount,
                        paidAmount: inst.paid_amount,
                        paymentDate: inst.payment_date || inst.updated_at || inst.due_date,
                        paymentMode: inst.payment_mode || 'N/A',
                        transactionId: inst.transaction_id,
                    })),
            };
            await generateFeeSummaryReceiptPdf(summaryData, getSchoolData(), action);
            toast.success(`Summary receipt ${action === 'download' ? 'downloaded' : action === 'print' ? 'sent to printer' : 'opened'} successfully`);
        } catch (err: any) {
            console.error('Error generating summary receipt:', err);
            toast.error('Failed to generate summary receipt');
        }
    }, [selectedStudent, feeInstallments, getSchoolData]);

    const showTransactionFields = ['ONLINE', 'UPI', 'CARD'].includes(paymentData.payment_mode);
    const showChequeFields = paymentData.payment_mode === 'CHEQUE';

    // --- Search result columns ---
    const searchColumns = [
        { key: 'name', label: 'Name', render: (v: string) => <span className="font-medium">{v}</span> },
        { key: 'class', label: 'Class' },
        { key: 'section', label: 'Section' },
        { key: 'roll_no', label: 'Roll No' },
        { key: 'phone', label: 'Phone' },
    ];

    // --- Fee breakdown columns ---
    const feeColumns = [
        {
            key: 'fee_structure',
            label: 'Fee Details',
            render: (_: any, row: IStudentFee) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                        {row.fee_structure?.fee_name || row.fee_name || 'Fee'}
                    </p>
                    {row.fee_structure?.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{row.fee_structure.description}</p>
                    )}
                    <div className="flex gap-1 mt-1">
                        {row.fee_structure?.is_recurring && (
                            <Badge variant="primary" size="sm">{row.fee_structure.recurrence_type}</Badge>
                        )}
                        {row.has_installments && (
                            <Badge variant="secondary" size="sm">Installments</Badge>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'total_amount',
            label: 'Total',
            className: 'text-right',
            render: (v: number) => <span>{'\u20B9'}{parseFloat(String(v)).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'paid_amount',
            label: 'Paid',
            className: 'text-right',
            render: (v: number) => (
                <span className="font-semibold text-green-600 dark:text-green-400">
                    {'\u20B9'}{parseFloat(String(v || 0)).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'balance_amount',
            label: 'Balance',
            className: 'text-right',
            render: (v: number) => (
                <span className="font-semibold text-red-600 dark:text-red-400">
                    {'\u20B9'}{parseFloat(String(v || 0)).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            // className: 'text-center',
            render: (v: string) => (
                <Badge variant={STATUS_VARIANT[v] || 'secondary'} size="sm">{v}</Badge>
            ),
        },
    ];

    // --- Installment columns ---
    const installmentColumns = [
        {
            key: 'installment_name',
            label: 'Installment',
            render: (v: string) => <span className="font-medium">{v}</span>,
        },
        {
            key: 'amount',
            label: 'Amount',
            className: 'text-right',
            render: (v: number) => <span>{'\u20B9'}{parseFloat(String(v)).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'paid_amount',
            label: 'Paid',
            className: 'text-right',
            render: (v: number) => (
                <span className="font-semibold text-green-600 dark:text-green-400">
                    {'\u20B9'}{parseFloat(String(v || 0)).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'balance_amount',
            label: 'Balance',
            className: 'text-right',
            render: (v: number) => (
                <span className="font-semibold text-red-600 dark:text-red-400">
                    {'\u20B9'}{parseFloat(String(v || 0)).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'due_date',
            label: 'Due Date',
            render: (v: string) => <span className="text-sm">{formatDate(v)}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            className: 'text-center',
            render: (v: string) => (
                <Badge variant={STATUS_VARIANT[v] || 'secondary'} size="sm">{v}</Badge>
            ),
        },
    ];

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Fee Collection', href: '#' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Fee Collection"
                subtitle="Search students and collect fee payments"
                breadcrumbs={breadcrumbs}
            />

            {/* Search Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <FormInput
                            label="Search Student"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter student name, phone, or roll number"
                            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); }}
                        />
                    </div>
                    <Button variant="primary" onClick={handleSearch} isLoading={searching} loadingText="Searching...">
                        Search
                    </Button>
                    {selectedStudent && (
                        <Button variant="secondary" onClick={resetSearch}>Clear</Button>
                    )}
                </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        {searchResults.length} student(s) found — select one:
                    </p>
                    <DataTable
                        columns={searchColumns}
                        data={searchResults}
                        emptyMessage="No students found"
                        actions={(row: any) => (
                            <Button variant="primary" size="sm" onClick={() => selectStudent(row)}>Select</Button>
                        )}
                    />
                </div>
            )}

            {/* Selected Student Info */}
            {selectedStudent && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                {selectedStudent.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedStudent.class && `Class: ${selectedStudent.class}`}
                                {selectedStudent.section && ` | Section: ${selectedStudent.section}`}
                                {selectedStudent.roll_no && ` | Roll: ${selectedStudent.roll_no}`}
                                {selectedStudent.phone && ` | Phone: ${selectedStudent.phone}`}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowExamTimetableModal(true)}
                        >
                            Exam Timetable
                        </Button>
                    </div>
                </div>
            )}

            {/* Fee Summary Cards */}
            {feeSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard title="Total Amount" value={`\u20B9${parseFloat(String(feeSummary.total_amount || 0)).toLocaleString('en-IN')}`} icon="📋" />
                    <StatCard title="Total Paid" value={`\u20B9${parseFloat(String(feeSummary.total_paid || 0)).toLocaleString('en-IN')}`} icon="✅" />
                    <StatCard title="Total Discount" value={`\u20B9${parseFloat(String(feeSummary.total_discount || 0)).toLocaleString('en-IN')}`} icon="🏷️" />
                    <StatCard title="Balance Due" value={`\u20B9${parseFloat(String(feeSummary.balance || 0)).toLocaleString('en-IN')}`} icon="⏳" />
                </div>
            )}

            {/* Fee Breakdown Table */}
            {feeSummary && (
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Breakdown</h3>
                    <DataTable
                        columns={feeColumns}
                        data={feeSummary.fees || []}
                        loading={loading}
                        emptyMessage="No fees assigned to this student"
                        striped
                        actions={(row: IStudentFee) => (
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Pay Now - when no installments and has balance */}
                                {!row.has_installments && row.balance_amount > 0 && (
                                    <Button variant="success" size="sm" onClick={() => openPayment(row)}>
                                        Pay Now
                                    </Button>
                                )}
                                {/* Print Receipt - when no installments and paid (full or partial) */}
                                {!row.has_installments && (row.status === 'PAID' || row.status === 'PARTIAL') && (
                                    <Button variant="info" size="sm" onClick={() => handlePrintReceipt(row)}>
                                        Print Receipt
                                    </Button>
                                )}
                                {/* Convert to Full Payment - when has installments and balance */}
                                {row.has_installments && row.balance_amount > 0 && (
                                    <Button variant="warning" size="sm" onClick={() => handleConvertToFull(row)}>
                                        Pay Full Balance
                                    </Button>
                                )}
                                {/* Setup Installments - only for recurring fees that allow installments */}
                                {!row.has_installments && row.balance_amount > 0 && row.status !== 'PAID' && row.fee_structure?.is_recurring && row.fee_structure?.allows_installments && (
                                    <Button variant="primary" size="sm" onClick={() => openInstallmentSetup(row)}>
                                        Setup Installments
                                    </Button>
                                )}
                                {/* View / Pay Installments - expand */}
                                {row.has_installments && feeInstallments[row.id]?.length > 0 && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setExpandedFeeId(expandedFeeId === row.id ? null : row.id)}
                                    >
                                        {expandedFeeId === row.id ? 'Hide' : 'View'} Installments
                                    </Button>
                                )}
                                {/* Print Full Summary - when all installments are paid */}
                                {row.has_installments && row.status === 'PAID' && (
                                    <Button variant="info" size="sm" onClick={() => handlePrintFullSummary(row)}>
                                        Print Full Summary
                                    </Button>
                                )}
                            </div>
                        )}
                    />

                    {/* Expanded Installment Section */}
                    {expandedFeeId && feeInstallments[expandedFeeId]?.length > 0 && (
                        <div className="ml-4 border-l-4 border-blue-500 pl-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Installment Schedule
                            </p>
                            <DataTable
                                columns={installmentColumns}
                                data={feeInstallments[expandedFeeId]}
                                emptyMessage="No installments found"
                                actions={(inst: IInstallment) => {
                                    const fee = (feeSummary?.fees || []).find(f => f.id === expandedFeeId);
                                    if (!fee) return null;
                                    if (inst.status === 'CANCELLED') return <Badge variant="secondary" size="sm">Cancelled</Badge>;
                                    if (inst.balance_amount > 0) {
                                        return (
                                            <Button variant="success" size="sm" onClick={() => openPayment(fee, inst)}>
                                                Pay
                                            </Button>
                                        );
                                    }
                                    // Paid - show print receipt button
                                    if (inst.status === 'PAID') {
                                        return (
                                            <Button variant="info" size="sm" onClick={() => handlePrintReceipt(fee, inst)}>
                                                Print Receipt
                                            </Button>
                                        );
                                    }
                                    return <Badge variant="success" size="sm">Paid</Badge>;
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Payment Dialog */}
            <Modal
                isOpen={showPayDialog}
                onClose={() => setShowPayDialog(false)}
                title={selectedInstallment ? `Record Payment - ${selectedInstallment.installment_name}` : 'Record Payment'}
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setShowPayDialog(false)}>Cancel</Button>
                        <Button
                            variant="success"
                            onClick={submitPayment}
                            isLoading={paying}
                            loadingText="Processing..."
                        >
                            Submit Payment
                        </Button>
                    </div>
                }
            >
                {selectedFee && (
                    <div className="space-y-4">
                        {/* Fee context */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedFee.fee_structure?.fee_name || selectedFee.fee_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Balance: {'\u20B9'}{parseFloat(String(selectedInstallment ? selectedInstallment.balance_amount : selectedFee.balance_amount)).toLocaleString('en-IN')}
                            </p>
                        </div>

                        {/* Payment Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput
                                label="Amount"
                                type="number"
                                required
                                value={paymentData.amount_paid}
                                onChange={(e) => setPaymentData({ ...paymentData, amount_paid: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                            />
                            <FormSelect
                                label="Payment Mode"
                                required
                                value={paymentData.payment_mode}
                                onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value })}
                                options={PAYMENT_MODES}
                            />
                        </div>

                        <FormInput
                            label="Payment Date"
                            type="date"
                            required
                            value={paymentData.payment_date}
                            onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                        />

                        {/* Conditional: Transaction ID for Online/UPI/Card */}
                        {showTransactionFields && (
                            <FormInput
                                label="Transaction ID"
                                value={paymentData.transaction_id}
                                onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                                placeholder="Enter transaction ID"
                            />
                        )}

                        {/* Conditional: Cheque fields */}
                        {showChequeFields && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput
                                    label="Cheque Number"
                                    value={paymentData.cheque_number}
                                    onChange={(e) => setPaymentData({ ...paymentData, cheque_number: e.target.value })}
                                    placeholder="Enter cheque number"
                                />
                                <FormInput
                                    label="Bank Name"
                                    value={paymentData.bank_name}
                                    onChange={(e) => setPaymentData({ ...paymentData, bank_name: e.target.value })}
                                    placeholder="Enter bank name"
                                />
                            </div>
                        )}

                        <FormTextarea
                            label="Remarks"
                            value={paymentData.remarks}
                            onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                            rows={2}
                            placeholder="Optional remarks"
                        />
                    </div>
                )}
            </Modal>

            {/* Installment Setup Dialog */}
            <InstallmentDialog
                isOpen={showInstallmentDialog}
                onClose={() => { setShowInstallmentDialog(false); setInstallmentFee(null); }}
                studentFee={installmentFee}
                onSuccess={onInstallmentSuccess}
            />

            {/* Exam Timetable Modal */}
            {showExamTimetableModal && selectedStudent && (
                <Suspense fallback={null}>
                    <StudentExamTimetableModal
                        isOpen={showExamTimetableModal}
                        onClose={() => setShowExamTimetableModal(false)}
                        student={{
                            id: selectedStudent.user_id,
                            name: selectedStudent.name,
                            class: selectedStudent.class,
                            section: selectedStudent.section,
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default FeeCollection;
