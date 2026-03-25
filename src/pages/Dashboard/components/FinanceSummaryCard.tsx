import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import dashboardService, { FinanceSummary } from '../../../services/dashboardService';

const formatCurrency = (amount: number): string => {
    if (amount >= 100000) {
        return `${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('en-IN');
};

const FinanceSummaryCard: FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FinanceSummary | null>(null);

    const skid = user?.skid || '';
    const academicYearId = user?.current_academic_year?.id;

    useEffect(() => {
        if (skid && academicYearId) {
            fetchData();
        }
    }, [skid, academicYearId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await dashboardService.getFinanceSummary(skid, academicYearId!);
            setData(result);
        } catch (err: any) {
            toast.error('Failed to load finance summary');
            console.error('Error fetching finance summary:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Finance Overview
                </h3>
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                    <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                    <p className="text-sm">No finance data available</p>
                </div>
            </div>
        );
    }

    // Collection progress percentage
    const progressWidth = Math.min(data.collection_rate, 100);

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Finance Overview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Fee collection & expenses
                    </p>
                </div>
                <button
                    onClick={() => navigate('/finance/fee-collection')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                    View Details
                </button>
            </div>

            {/* Collection Progress */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{data.collection_rate}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${progressWidth}%` }}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Collected</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(data.total_collected)}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Pending</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                        {formatCurrency(data.total_pending)}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">Expenses</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">
                        {formatCurrency(data.total_expenses)}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Fees</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(data.total_fees)}
                    </p>
                </div>
            </div>

            {/* Fee Status Breakdown */}
            <div className="mb-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Fee Status</p>
                <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        Paid: {data.status_breakdown.paid}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        Partial: {data.status_breakdown.partial}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                        Pending: {data.status_breakdown.pending}
                    </span>
                    {data.status_breakdown.overdue > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            Overdue: {data.status_breakdown.overdue}
                        </span>
                    )}
                </div>
            </div>

            {/* Recent Payments */}
            {data.recent_payments.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Recent Payments</p>
                    <div className="space-y-2">
                        {data.recent_payments.slice(0, 3).map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between py-1.5">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                        {payment.student_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {payment.payment_mode} {payment.payment_date ? `- ${new Date(payment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 ml-2">
                                    +{payment.amount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceSummaryCard;
