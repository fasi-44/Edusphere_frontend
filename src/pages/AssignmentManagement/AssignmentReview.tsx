import { useAuthStore } from '@/stores/authStore';
import { FC, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import {
    Button,
    LoadingSpinner,
    PageHeader,
} from '../../components';
import DataTable from '../../components/tables/DataTable';
import { assignmentService } from '../../services/modules/assignmentService';
import { IAssignment, IAssignmentSubmission } from '../../types/index';

interface IStudentRow extends IAssignmentSubmission {
    // extended if needed
}

const AssignmentReview: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const user = useAuthStore((state) => state.user);

    const [assignment, setAssignment] = useState<IAssignment | null>(null);
    const [students, setStudents] = useState<IStudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'DONE' | 'NOT_DONE'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    useEffect(() => {
        if (id) {
            fetchAssignment();
        }
    }, [id]);

    const fetchAssignment = async () => {
        setLoading(true);
        try {
            const data = await assignmentService.getWithStudents(parseInt(id!));
            setAssignment(data);
            setStudents(data.students || []);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load assignment');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Filtered students
    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const matchesSearch =
                searchQuery === '' ||
                student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.roll_no.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter =
                filterStatus === 'ALL' ||
                (filterStatus === 'DONE' && student.is_completed) ||
                (filterStatus === 'NOT_DONE' && !student.is_completed);

            return matchesSearch && matchesFilter;
        });
    }, [students, searchQuery, filterStatus]);

    // Paginated students
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredStudents.slice(start, start + pageSize);
    }, [filteredStudents, currentPage]);

    // Stats
    const stats = useMemo(
        () => ({
            total: students.length,
            completed: students.filter((s) => s.is_completed).length,
            pending: students.filter((s) => !s.is_completed).length,
        }),
        [students]
    );

    const handleStatusToggle = (studentId: number) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.student_id === studentId ? { ...s, is_completed: !s.is_completed } : s
            )
        );
    };

    const handleRemarksChange = (studentId: number, remarks: string) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.student_id === studentId ? { ...s, remarks } : s
            )
        );
    };

    const markAllDone = () => {
        setStudents((prev) => prev.map((s) => ({ ...s, is_completed: true })));
        toast.success('Marked all as done');
    };

    const markAllNotDone = () => {
        setStudents((prev) => prev.map((s) => ({ ...s, is_completed: false })));
        toast.success('Marked all as not done');
    };

    const handleSubmit = async () => {
        if (!user?.school_user_id || !id) return;

        setIsSubmitting(true);
        try {
            const submissions = students.map((s) => ({
                student_id: s.student_id,
                is_completed: s.is_completed,
                remarks: s.remarks || '',
            }));

            await assignmentService.updateSubmissions(
                parseInt(id),
                submissions,
                user.school_user_id
            );
            toast.success(`Updated submissions for ${students.length} student(s)`);
            navigate('/assignments');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update submissions');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Assignment Review"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Assignments', href: '/assignments' },
                        { label: 'Review', href: '#' },
                    ]}
                />
                <LoadingSpinner message="Loading assignment..." />
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Assignment Review"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Assignments', href: '/assignments' },
                        { label: 'Review', href: '#' },
                    ]}
                />
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Assignment not found.</p>
                    <Button variant="secondary" onClick={() => navigate('/assignments')} className="mt-4">
                        Back to Assignments
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Assignment Review"
                subtitle={`${assignment.class_name} - ${assignment.section_name} | ${assignment.subject_name}`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Assignments', href: '/assignments' },
                    { label: 'Review', href: '#' },
                ]}
                actions={
                    <Button variant="secondary" onClick={() => navigate('/assignments')}>
                        Back
                    </Button>
                }
            />

            {/* Assignment Details Card */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {assignment.subject_name}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {assignment.class_name} - {assignment.section_name}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        {assignment.assignment_date}
                    </span>
                </div>
                {assignment.assignment_text && (
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {assignment.assignment_text}
                    </p>
                )}
                {assignment.assignment_drawing && (
                    <div className={assignment.assignment_text ? 'mt-3' : ''}>
                        <img
                            src={assignment.assignment_drawing}
                            alt="Assignment drawing"
                            className="max-w-full rounded-lg border border-gray-200 dark:border-gray-600"
                            style={{ maxHeight: '300px' }}
                        />
                    </div>
                )}
            </div>

            {/* Student List Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Students</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">{stats.completed}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
                        <p className="text-lg font-bold text-red-700 dark:text-red-400">{stats.pending}</p>
                        <p className="text-xs text-red-600 dark:text-red-400">Pending</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions:</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={markAllDone}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                            Mark All Done
                        </button>
                        <button
                            type="button"
                            onClick={markAllNotDone}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            Mark All Not Done
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'DONE' | 'NOT_DONE')}
                        className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">All Students</option>
                        <option value="DONE">Completed</option>
                        <option value="NOT_DONE">Pending</option>
                    </select>
                </div>

                {/* Student Table */}
                <DataTable
                    columns={[
                        {
                            key: 'student_name' as keyof IStudentRow,
                            label: 'Student',
                            width: '200px',
                            render: (_value: any, row: IStudentRow) => (
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {row.student_name}
                                    </p>
                                    {row.roll_no && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Roll: {row.roll_no}
                                        </p>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'is_completed' as keyof IStudentRow,
                            label: 'Status',
                            width: '140px',
                            render: (_value: any, row: IStudentRow) => (
                                <button
                                    type="button"
                                    onClick={() => handleStatusToggle(row.student_id)}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                        row.is_completed
                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                    }`}
                                >
                                    {row.is_completed ? 'Done' : 'Not Done'}
                                </button>
                            ),
                        },
                        {
                            key: 'remarks' as keyof IStudentRow,
                            label: 'Remarks',
                            width: '250px',
                            render: (_value: any, row: IStudentRow) => (
                                <input
                                    type="text"
                                    placeholder="Add remark..."
                                    value={row.remarks}
                                    onChange={(e) => handleRemarksChange(row.student_id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ),
                        },
                    ]}
                    data={paginatedStudents}
                    loading={false}
                    pagination={{
                        page: currentPage,
                        pageSize: pageSize,
                        total: filteredStudents.length,
                        onPageChange: (page: number) => setCurrentPage(page),
                    }}
                    emptyMessage="No students found."
                />

                {/* Submit */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/assignments')}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        loadingText="Saving..."
                        disabled={students.length === 0 || isSubmitting}
                    >
                        Save Submissions ({students.length} students)
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentReview;
