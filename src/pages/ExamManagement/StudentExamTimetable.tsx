/**
 * Student Exam Timetable
 * Shows a student's exam schedule with room, seat, and invigilator details
 * from the seating arrangement.
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Badge,
    LoadingSpinner,
    EmptyState,
    FormField,
    FormSelect,
    PrintActions,
    DataTable,
} from '@/components';
import { examService } from '@/services/modules/examService';
import { useAuthStore } from '@/stores/authStore';
import { generateExamTimetablePdf } from '@/prints';
import type { SchoolData, PdfAction } from '@/prints';

interface IStudentExamEntry {
    id: number;
    subject_name: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    duration_minutes?: number;
    notes?: string;
    room?: string | null;
    seat_label?: string | null;
    seat_row?: number | null;
    seat_column?: number | null;
    invigilator_name?: string | null;
    class_name?: string;
    section_name?: string | null;
}

const StudentExamTimetable: FC = () => {
    const user = useAuthStore((s) => s.user);
    const currentAcademicYear = useAuthStore((s) => s.user?.current_academic_year);
    const academicYearVersion = useAuthStore((s) => s.academicYearVersion);

    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [selectedExamType, setSelectedExamType] = useState('');
    const [entries, setEntries] = useState<IStudentExamEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        fetchExamTypes();
    }, []);

    useEffect(() => {
        if (selectedExamType) {
            fetchStudentTimetable();
        } else {
            setEntries([]);
        }
    }, [selectedExamType, academicYearVersion]);

    const fetchExamTypes = async () => {
        try {
            const res = await examService.list();
            const list = Array.isArray(res) ? res : res?.data || [];
            setExamTypes(list);
        } catch {
            toast.error('Failed to load exam types');
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchStudentTimetable = async () => {
        if (!user?.school_user_id || !selectedExamType) return;
        setLoading(true);
        try {
            const data = await examService.getStudentExamTimetable(
                user.school_user_id,
                Number(selectedExamType),
                currentAcademicYear?.id
            );
            setEntries(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load exam timetable');
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (t: string) => {
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    const getSchoolData = (): SchoolData => {
        return {
            schoolName: user?.school_name || 'School Name',
            schoolAddress: '',
            schoolPhone: '',
            schoolEmail: user?.email || '',
            logo: null,
            generatedBy: user?.full_name || user?.name || 'System',
        };
    };

    const handlePrint = async (action: PdfAction) => {
        if (entries.length === 0) {
            toast.error('No timetable entries to print');
            return;
        }
        try {
            const examName = examTypes.find(e => String(e.id) === selectedExamType)?.exam_name || '';
            await generateExamTimetablePdf(
                {
                    examName,
                    className: entries[0]?.class_name || '',
                    sectionName: entries[0]?.section_name || undefined,
                    entries: entries.map(e => ({
                        ...e,
                        room: e.room || undefined,
                        invigilator_name: e.invigilator_name || undefined,
                    })),
                },
                getSchoolData(),
                action
            );
            toast.success(
                action === 'download' ? 'PDF downloaded' :
                action === 'print' ? 'Sent to printer' : 'PDF opened'
            );
        } catch {
            toast.error('Failed to generate PDF');
        }
    };

    if (initialLoading) {
        return <LoadingSpinner fullHeight message="Loading..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Exam Timetable"
                subtitle="View your exam schedule with room and seat details"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'My Exam Timetable', href: '#' },
                ]}
            />

            {/* Exam Type Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="max-w-sm">
                    <FormField label="Select Exam" required>
                        <FormSelect
                            value={selectedExamType}
                            onChange={(e) => setSelectedExamType(e.target.value)}
                            placeholder="Choose an exam"
                            options={examTypes.map(e => ({
                                value: String(e.id),
                                label: e.exam_name,
                            }))}
                        />
                    </FormField>
                </div>
            </div>

            {/* Timetable */}
            {!selectedExamType ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
                    <p className="text-4xl mb-4">📝</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Select an Exam
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Choose an exam type above to view your exam schedule.
                    </p>
                </div>
            ) : loading ? (
                <LoadingSpinner message="Loading your exam timetable..." />
            ) : entries.length === 0 ? (
                <EmptyState
                    icon="📅"
                    title="No Exam Schedule Found"
                    description="The exam timetable for this exam has not been published yet."
                />
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {/* Header with print */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entries.length} subject{entries.length !== 1 ? 's' : ''} scheduled
                        </p>
                        <PrintActions onAction={handlePrint} />
                    </div>

                    {/* Mobile: Card View */}
                    <div className="grid gap-3 md:hidden">
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {entry.subject_name}
                                    </h3>
                                    <div className="shrink-0">
                                        {entry.room && entry.seat_label ? (
                                            <Badge variant="success">Seat Assigned</Badge>
                                        ) : (
                                            <Badge variant="warning">Pending</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Date</span>
                                        <span className="text-gray-900 dark:text-white">{formatDate(entry.exam_date)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Time</span>
                                        <span className="text-gray-900 dark:text-white">{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Room</span>
                                        {entry.room
                                            ? <span className="text-blue-600 dark:text-blue-400 font-medium">{entry.room}</span>
                                            : <span className="text-yellow-600 dark:text-yellow-400 text-xs">Not assigned</span>
                                        }
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Seat</span>
                                        {entry.seat_label
                                            ? <span className="text-purple-600 dark:text-purple-400 font-medium">{entry.seat_label}</span>
                                            : <span className="text-yellow-600 dark:text-yellow-400 text-xs">Not assigned</span>
                                        }
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Invigilator</span>
                                        <span className="text-gray-900 dark:text-white">{entry.invigilator_name || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Duration</span>
                                        <span className="text-gray-900 dark:text-white">{entry.duration_minutes ? `${entry.duration_minutes} min` : '-'}</span>
                                    </div>
                                </div>
                                {entry.notes && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                        {entry.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Table View */}
                    <div className="hidden md:block">
                        <DataTable
                            columns={[
                                {
                                    key: 'subject_name',
                                    label: 'Subject',
                                    render: (value: any) => <span className="font-medium">{value}</span>,
                                },
                                {
                                    key: 'exam_date',
                                    label: 'Date',
                                    render: (value: any) => formatDate(value),
                                },
                                {
                                    key: 'start_time',
                                    label: 'Time',
                                    render: (_: any, row: any) => `${formatTime(row.start_time)} - ${formatTime(row.end_time)}`,
                                },
                                {
                                    key: 'duration_minutes',
                                    label: 'Duration',
                                    render: (value: any) => value ? `${value} min` : '-',
                                },
                                {
                                    key: 'room',
                                    label: 'Room',
                                    render: (value: any) => value
                                        ? <span className="text-blue-600 dark:text-blue-400 font-medium">{value}</span>
                                        : <span className="text-yellow-600 dark:text-yellow-400 text-xs">Not assigned</span>,
                                },
                                {
                                    key: 'seat_label',
                                    label: 'Seat',
                                    render: (value: any) => value
                                        ? <span className="text-purple-600 dark:text-purple-400 font-medium">{value}</span>
                                        : <span className="text-yellow-600 dark:text-yellow-400 text-xs">Not assigned</span>,
                                },
                                {
                                    key: 'invigilator_name',
                                    label: 'Invigilator',
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (_: any, row: any) => row.room && row.seat_label
                                        ? <Badge variant="success">Seat Assigned</Badge>
                                        : <Badge variant="warning">Pending</Badge>,
                                },
                            ]}
                            data={entries}
                            emptyMessage="No exam timetable found."
                            striped
                            hover={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentExamTimetable;
