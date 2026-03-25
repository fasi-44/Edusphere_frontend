import { useAuthStore } from '@/stores/authStore';
import { FC, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    LoadingSpinner,
    PageHeader,
} from '../../components';
import { assignmentService } from '../../services/modules/assignmentService';
import { IAssignment } from '../../types/index';

const StudentAssignments: FC = () => {
    const user = useAuthStore((state) => state.user);
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);

    const [assignments, setAssignments] = useState<IAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    useEffect(() => {
        if (user?.school_user_id && user?.current_academic_year?.id) {
            fetchAssignments();
        }
    }, [user?.school_user_id, user?.current_academic_year?.id, academicYearVersion, filterDate]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const data = await assignmentService.getStudentAssignments(
                user!.school_user_id,
                user!.current_academic_year.id,
                filterDate || undefined
            );
            setAssignments(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load assignments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Unique subjects for filter
    const subjectOptions = useMemo(() => {
        const subjects = new Set(assignments.map((a) => a.subject_name).filter(Boolean));
        return Array.from(subjects).sort();
    }, [assignments]);

    // Filtered list
    const filteredAssignments = useMemo(() => {
        if (!filterSubject) return assignments;
        return assignments.filter((a) => a.subject_name === filterSubject);
    }, [assignments, filterSubject]);

    // Group by date
    const groupedByDate = useMemo(() => {
        const groups: Record<string, IAssignment[]> = {};
        for (const a of filteredAssignments) {
            const date = a.assignment_date;
            if (!groups[date]) groups[date] = [];
            groups[date].push(a);
        }
        return groups;
    }, [filteredAssignments]);

    const sortedDates = useMemo(
        () => Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)),
        [groupedByDate]
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.getTime() === today.getTime()) return 'Today';
        if (date.getTime() === yesterday.getTime()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Assignments"
                subtitle="View homework and assignments from your teachers"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'My Assignments', href: '#' },
                ]}
            />

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Filter by Date
                        </label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Filter by Subject
                        </label>
                        <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Subjects</option>
                            {subjectOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        {(filterDate || filterSubject) && (
                            <button
                                onClick={() => { setFilterDate(''); setFilterSubject(''); }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-6">
                {loading ? (
                    <LoadingSpinner message="Loading assignments..." />
                ) : sortedDates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-gray-500 dark:text-gray-400">
                            {filterDate || filterSubject
                                ? 'No assignments found for the selected filters.'
                                : 'No assignments yet.'}
                        </p>
                    </div>
                ) : (
                    sortedDates.map((date) => (
                        <div key={date}>
                            {/* Date header */}
                            <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatDate(date)}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {date}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {groupedByDate[date].length} assignment{groupedByDate[date].length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                            </div>

                            {/* Assignment cards for this date */}
                            <div className="space-y-3">
                                {groupedByDate[date].map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Subject color indicator */}
                                            <div className="flex-shrink-0 w-1 self-stretch rounded-full bg-blue-500" />

                                            <div className="flex-1 min-w-0">
                                                {/* Badges */}
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                        {assignment.subject_name}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        assignment.is_completed
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                    }`}>
                                                        {assignment.is_completed ? 'Completed' : 'Pending'}
                                                    </span>
                                                    {assignment.teacher_name && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            by {assignment.teacher_name}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Assignment text */}
                                                {assignment.assignment_text && (
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                                        {assignment.assignment_text}
                                                    </p>
                                                )}

                                                {/* Assignment drawing */}
                                                {assignment.assignment_drawing && (
                                                    <div className={assignment.assignment_text ? 'mt-2' : ''}>
                                                        <img
                                                            src={assignment.assignment_drawing}
                                                            alt="Assignment drawing"
                                                            className="max-w-full rounded-lg border border-gray-200 dark:border-gray-600"
                                                            style={{ maxHeight: '300px' }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Teacher remarks */}
                                                {assignment.remarks && (
                                                    <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Teacher Remarks:</p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">{assignment.remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentAssignments;
