/**
 * Bus Scan Dashboard
 * Displays today's bus activity and live status for admins and bus staff.
 * Bus staff can also manually record check-ins / check-outs from this page.
 */

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, Button } from '../../components';
import { busScanService, BusScanRecord, ScanType, StudentSearchResult } from '../../services/modules/busScanService';
import { useAuthStore } from '../../stores/authStore';

// ─── QR Scanner (lazy-loaded so it doesn't bloat initial bundle) ───────────
let Html5QrcodeScanner: any = null;

const BusScanDashboard: FC = () => {
    const { user } = useAuthStore();
    const [records, setRecords] = useState<BusScanRecord[]>([]);
    const [statusRecords, setStatusRecords] = useState<BusScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerLoading, setScannerLoading] = useState(false);
    const [activeScanType, setActiveScanType] = useState<ScanType>('CHECK_IN');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const scannerRef = useRef<any>(null);
    const scannerDivRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Bus Management', href: '#' },
    ];

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [todayData, statusData] = await Promise.all([
                busScanService.getToday(user?.current_academic_year?.id),
                busScanService.getStatus(user?.current_academic_year?.id),
            ]);
            setRecords(todayData);
            setStatusRecords(statusData);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to load bus scan data');
        } finally {
            setLoading(false);
        }
    }, [user?.current_academic_year?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── QR scanner lifecycle ──
    const startScanner = async (scanType: ScanType) => {
        setActiveScanType(scanType);
        setScannerActive(true);
        setScannerLoading(true);

        if (!Html5QrcodeScanner) {
            const module = await import('html5-qrcode');
            Html5QrcodeScanner = module.Html5QrcodeScanner;
        }

        setScannerLoading(false);
    };

    useEffect(() => {
        if (!scannerActive || scannerLoading || !scannerDivRef.current || !Html5QrcodeScanner) return;

        const scanner = new Html5QrcodeScanner(
            'bus-qr-scanner',
            { fps: 10, qrbox: { width: 220, height: 220 } },
            false
        );

        scanner.render(
            async (decodedText: string) => {
                scanner.clear();
                setScannerActive(false);
                await handleQrScanned(decodedText, activeScanType);
            },
            (err: string) => { void err; }
        );

        scannerRef.current = scanner;
        return () => {
            scanner.clear().catch(() => { /* ignore */ });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scannerActive, scannerLoading]);

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => { /* ignore */ });
        }
        setScannerActive(false);
    };

    // ── Scan handling ──
    const handleQrScanned = async (qrData: string, scanType: ScanType) => {
        try {
            await busScanService.scanQr({
                qr_data: qrData,
                scan_type: scanType,
                academic_year_id: user?.current_academic_year?.id,
            });
            toast.success(`${scanType === 'CHECK_IN' ? 'Check-in' : 'Check-out'} recorded successfully`);
            await loadData();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to record scan');
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setSelectedStudent(null);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (value.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        searchTimeoutRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const results = await busScanService.searchStudents(value.trim());
                setSearchResults(results);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
    };

    const handleSelectStudent = (student: StudentSearchResult) => {
        setSelectedStudent(student);
        setSearchQuery(student.full_name);
        setSearchResults([]);
    };

    const handleManualScan = async (scanType: ScanType) => {
        if (!selectedStudent) {
            toast.error('Search and select a student first');
            return;
        }
        try {
            await busScanService.recordScan({
                student_user_id: selectedStudent.id,
                scan_type: scanType,
                academic_year_id: user?.current_academic_year?.id,
            });
            toast.success(`${scanType === 'CHECK_IN' ? 'Check-in' : 'Check-out'} recorded for ${selectedStudent.full_name}`);
            setSearchQuery('');
            setSelectedStudent(null);
            setSearchResults([]);
            await loadData();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to record scan');
        }
    };

    // ── Stats ──
    const onBusCount = statusRecords.filter(r => r.scan_type === 'CHECK_IN').length;
    const droppedOffCount = statusRecords.filter(r => r.scan_type === 'CHECK_OUT').length;
    const todayCheckins = records.filter(r => r.scan_type === 'CHECK_IN').length;
    const todayCheckouts = records.filter(r => r.scan_type === 'CHECK_OUT').length;

    if (loading) return <LoadingSpinner message="Loading bus data..." fullHeight />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bus Scan Dashboard"
                subtitle="Monitor student bus check-ins and check-outs in real time"
                breadcrumbs={breadcrumbs}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Currently On Bus', value: onBusCount, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { label: 'Dropped Off', value: droppedOffCount, color: 'bg-green-50 text-green-700 border-green-200' },
                    { label: "Today's Check-ins", value: todayCheckins, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    { label: "Today's Check-outs", value: todayCheckouts, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                ].map(stat => (
                    <div key={stat.label} className={`rounded-lg border p-4 ${stat.color}`}>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Scan Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Record Scan</h3>

                {/* QR Scanner */}
                {!scannerActive ? (
                    <div className="flex flex-wrap gap-3 mb-6">
                        <Button variant="primary" onClick={() => startScanner('CHECK_IN')}>
                            Scan QR — Check In
                        </Button>
                        <Button variant="outline" onClick={() => startScanner('CHECK_OUT')}>
                            Scan QR — Check Out
                        </Button>
                    </div>
                ) : (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                Scanning for <span className={activeScanType === 'CHECK_IN' ? 'text-blue-600' : 'text-orange-600'}>{activeScanType === 'CHECK_IN' ? 'Check-in' : 'Check-out'}</span>
                            </p>
                            <Button variant="outline" onClick={stopScanner}>Cancel</Button>
                        </div>
                        {scannerLoading ? (
                            <LoadingSpinner message="Loading camera..." />
                        ) : (
                            <div id="bus-qr-scanner" ref={scannerDivRef} className="max-w-sm" />
                        )}
                    </div>
                )}

                {/* Manual Entry */}
                <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Manual Entry</p>
                    <div className="flex flex-wrap gap-3 items-start">
                        <div className="relative flex-1 min-w-56">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => handleSearchChange(e.target.value)}
                                placeholder="Search by student name or admission no."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {searchLoading && (
                                <span className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</span>
                            )}
                            {searchResults.length > 0 && (
                                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {searchResults.map(s => (
                                        <li
                                            key={s.id}
                                            onMouseDown={() => handleSelectStudent(s)}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm text-gray-900 dark:text-white flex justify-between items-center"
                                        >
                                            <span>{s.full_name}</span>
                                            <span className="text-gray-500 dark:text-gray-400 text-xs ml-2 shrink-0">
                                                {s.roll_no && `Roll: ${s.roll_no}`}
                                                {s.roll_no && s.admission_number && ' · '}
                                                {s.admission_number && `Adm: ${s.admission_number}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <Button variant="primary" onClick={() => handleManualScan('CHECK_IN')} disabled={!selectedStudent}>Check In</Button>
                        <Button variant="outline" onClick={() => handleManualScan('CHECK_OUT')} disabled={!selectedStudent}>Check Out</Button>
                    </div>
                    {selectedStudent && (
                        <p className="mt-1.5 text-xs text-green-600 dark:text-green-400">
                            Selected: <strong>{selectedStudent.full_name}</strong>
                            {selectedStudent.roll_no && ` · Roll: ${selectedStudent.roll_no}`}
                            {selectedStudent.admission_number && ` · Adm: ${selectedStudent.admission_number}`}
                        </p>
                    )}
                </div>
            </div>

            {/* Today's Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Activity</h3>
                    <Button variant="outline" onClick={loadData}>Refresh</Button>
                </div>

                {records.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No bus activity recorded today.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Student</th>
                                    <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Type</th>
                                    <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Time</th>
                                    <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Location</th>
                                    <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">Scanned By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                                            {record.student_name || `ID: ${record.student_user_id}`}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${record.scan_type === 'CHECK_IN' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {record.scan_type === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                                            {new Date(record.scanned_at).toLocaleTimeString('en-GB')}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{record.location || '—'}</td>
                                        <td className="py-2 text-gray-600 dark:text-gray-400">{record.staff_name || '—'}</td>
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

export default BusScanDashboard;
