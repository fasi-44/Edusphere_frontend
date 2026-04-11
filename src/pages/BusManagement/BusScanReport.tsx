/**
 * Bus Scan Report
 * Historical view of bus check-ins and check-outs filterable by date and student.
 */

import { FC, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, Button, FormField, FormInput } from '../../components';
import { busScanService, BusScanRecord } from '../../services/modules/busScanService';
import { useAuthStore } from '../../stores/authStore';

const BusScanReport: FC = () => {
    const { user } = useAuthStore();
    const [records, setRecords] = useState<BusScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterType, setFilterType] = useState<'ALL' | 'CHECK_IN' | 'CHECK_OUT'>('ALL');

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Bus Management', href: '/bus-scan' },
        { label: 'Report', href: '#' },
    ];

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await busScanService.getToday(user?.current_academic_year?.id, filterDate);
            setRecords(data);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    }, [user?.current_academic_year?.id, filterDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filtered = records.filter(r =>
        filterType === 'ALL' || r.scan_type === filterType
    );

    const checkinCount = records.filter(r => r.scan_type === 'CHECK_IN').length;
    const checkoutCount = records.filter(r => r.scan_type === 'CHECK_OUT').length;

    if (loading) return <LoadingSpinner message="Loading report..." fullHeight />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bus Scan Report"
                subtitle="Historical bus check-in and check-out records"
                breadcrumbs={breadcrumbs}
            />

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Scans</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{checkinCount}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Check-ins</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-4 text-center">
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{checkoutCount}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">Check-outs</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <FormField label="Date" className="min-w-48">
                        <FormInput
                            type="date"
                            name="filterDate"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                    </FormField>
                    <FormField label="Scan Type">
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value as typeof filterType)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="ALL">All</option>
                            <option value="CHECK_IN">Check-in</option>
                            <option value="CHECK_OUT">Check-out</option>
                        </select>
                    </FormField>
                    <Button variant="primary" onClick={loadData}>Refresh</Button>
                </div>
            </div>

            {/* Records Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Scan Records ({filtered.length})
                </h3>

                {filtered.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No records found for the selected filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 pr-4 font-medium text-gray-600 dark:text-gray-400">#</th>
                                    <th className="text-left py-3 pr-4 font-medium text-gray-600 dark:text-gray-400">Student</th>
                                    <th className="text-left py-3 pr-4 font-medium text-gray-600 dark:text-gray-400">Type</th>
                                    <th className="text-left py-3 pr-4 font-medium text-gray-600 dark:text-gray-400">Date & Time</th>
                                    <th className="text-left py-3 pr-4 font-medium text-gray-600 dark:text-gray-400">Location</th>
                                    <th className="text-left py-3 pr-4 font-medium text-gray-600 dark:text-gray-400">Scanned By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {filtered.map((record, idx) => (
                                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{record.student_name || `ID: ${record.student_user_id}`}</td>
                                        <td className="py-3 pr-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.scan_type === 'CHECK_IN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                                {record.scan_type === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                                            {new Date(record.scanned_at).toLocaleDateString('en-GB')} {new Date(record.scanned_at).toLocaleTimeString('en-GB')}
                                        </td>
                                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.location || '—'}</td>
                                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{record.staff_name || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusScanReport;
