import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import Chart from 'react-apexcharts';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import dashboardService, { ExpenseBreakdown } from '../../../services/dashboardService';

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

const CATEGORY_COLORS = [
    { light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', hex: '#3B82F6' },
    { light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', hex: '#10B981' },
    { light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', hex: '#F59E0B' },
    { light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', hex: '#EF4444' },
    { light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', hex: '#A855F7' },
    { light: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500', hex: '#06B6D4' },
    { light: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500', hex: '#EC4899' },
    { light: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500', hex: '#6366F1' },
];

const ExpenseTrendCard: FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [breakdown, setBreakdown] = useState<ExpenseBreakdown | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const skid = user?.skid || '';
    const academicYearId = user?.current_academic_year?.id;

    useEffect(() => {
        if (skid && academicYearId) {
            fetchExpenseBreakdown();
        }
    }, [skid, academicYearId, selectedMonth]);

    const fetchExpenseBreakdown = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getExpenseBreakdown(skid, academicYearId!, selectedMonth);
            setBreakdown(data);
        } catch (err: any) {
            toast.error('Failed to load expense data');
            console.error('Error fetching expense breakdown:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse">
                <div className="flex justify-between mb-6">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                </div>
                <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded mb-4"></div>
                <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
                    ))}
                </div>
            </div>
        );
    }

    const hasData = breakdown && breakdown.dates && breakdown.dates.length > 0;

    // Build ApexCharts series: one series per category
    const chartSeries: ApexAxisChartSeries = (breakdown?.categories || []).map((cat) => ({
        name: cat,
        data: (breakdown?.dates || []).map((dateObj) => {
            const entry = breakdown?.category_data[cat]?.find((d) => d.day === dateObj.day);
            return entry?.amount || 0;
        }),
    }));

    const chartColors = (breakdown?.categories || []).map(
        (_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length].hex
    );

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            stacked: true,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'inherit',
        },
        plotOptions: {
            bar: {
                borderRadius: 3,
                borderRadiusApplication: 'end',
                columnWidth: '60%',
            },
        },
        colors: chartColors,
        xaxis: {
            categories: (breakdown?.dates || []).map((d) => String(d.day)),
            labels: {
                style: {
                    colors: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: '11px',
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: {
                    colors: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: '11px',
                },
                formatter: (val: number) => {
                    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
                    return String(val);
                },
            },
        },
        grid: {
            borderColor: isDark ? '#374151' : '#F3F4F6',
            strokeDashArray: 3,
        },
        legend: { show: false },
        dataLabels: { enabled: false },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val: number) => val.toLocaleString('en-IN'),
            },
        },
        states: {
            hover: { filter: { type: 'darken', value: 0.9 } as { type?: string; value?: number } },
        },
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Expense Trend
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {breakdown?.month_name} {breakdown?.year} - Academic Year: {user?.current_academic_year?.year_name}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/finance/expenses')}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                        View Expenses
                    </button>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {MONTHS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary */}
            {hasData && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Expenses</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                            {breakdown!.total_expenses.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Categories</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {breakdown!.categories.length}
                        </p>
                    </div>
                </div>
            )}

            {/* Chart */}
            {hasData ? (
                <>
                    <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        height={220}
                    />

                    {/* Category Legend */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {breakdown!.categories.map((cat, i) => {
                            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                            const total = breakdown!.category_totals[cat] || 0;
                            return (
                                <span
                                    key={cat}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${color.light} ${color.text}`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${color.dot}`}></span>
                                    {cat}: {total.toLocaleString('en-IN')}
                                </span>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                    <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <p className="text-sm">No expense data for {breakdown?.month_name || MONTHS[selectedMonth - 1]?.label} {breakdown?.year || ''}</p>
                </div>
            )}
        </div>
    );
};

export default ExpenseTrendCard;
