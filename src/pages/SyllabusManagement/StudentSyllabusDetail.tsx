import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button, LoadingSpinner, Badge } from '../../components';
import { syllabusService } from '../../services/modules/syllabusService';
import { ISyllabus, SyllabusStatus } from '../../types';

// Icons
const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
);

const CircleIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
);

// Date formatting helpers
const CalendarIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
};

const isOverdue = (endDate?: string | null, status?: string): boolean => {
    if (!endDate || status === 'completed') return false;
    try {
        const end = new Date(endDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return end < today;
    } catch {
        return false;
    }
};

const DateRangeChip: FC<{
    plannedStart?: string | null;
    plannedEnd?: string | null;
    actualStart?: string | null;
    actualEnd?: string | null;
    status?: string;
}> = ({ plannedStart, plannedEnd, actualStart, actualEnd, status }) => {
    if (!plannedStart && !plannedEnd && !actualStart && !actualEnd) return null;

    const overdue = isOverdue(plannedEnd, status);

    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            overdue
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
            <CalendarIcon />
            {plannedStart || actualStart ? formatDate(plannedStart || actualStart) : '?'}
            {' - '}
            {plannedEnd || actualEnd ? formatDate(plannedEnd || actualEnd) : '?'}
            {overdue && <span className="font-medium ml-0.5">Overdue</span>}
        </span>
    );
};

const ProgressBar: FC<{ percentage: number; className?: string }> = ({ percentage, className = '' }) => (
    <div className={`w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
        <div
            className={`h-full rounded-full transition-all duration-300 ${percentage >= 100 ? 'bg-green-500' : percentage > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
        />
    </div>
);

const getStatusBadgeVariant = (status: SyllabusStatus): 'success' | 'primary' | 'secondary' => {
    switch (status) {
        case SyllabusStatus.COMPLETED:
            return 'success';
        case SyllabusStatus.IN_PROGRESS:
            return 'primary';
        case SyllabusStatus.PLANNED:
        default:
            return 'secondary';
    }
};

const getStatusLabel = (status: SyllabusStatus): string => {
    switch (status) {
        case SyllabusStatus.COMPLETED:
            return 'Completed';
        case SyllabusStatus.IN_PROGRESS:
            return 'In Progress';
        case SyllabusStatus.PLANNED:
        default:
            return 'Planned';
    }
};

const StudentSyllabusDetail: FC = () => {
    const { id: syllabusId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const teacherId = searchParams.get('teacherId');
    const navigate = useNavigate();

    const [syllabus, setSyllabus] = useState<ISyllabus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Accordion states
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

    const fetchDetail = async () => {
        if (!syllabusId || !teacherId) {
            setError('Missing syllabus ID or teacher ID');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await syllabusService.fetchStudentSyllabusDetail(syllabusId, teacherId);
            setSyllabus(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch syllabus details');
            toast.error('Failed to fetch syllabus details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [syllabusId, teacherId]);

    const toggleLesson = (lessonId: string) => {
        setExpandedLessons((prev) => {
            const next = new Set(prev);
            if (next.has(lessonId)) next.delete(lessonId);
            else next.add(lessonId);
            return next;
        });
    };

    const toggleTopic = (topicId: string) => {
        setExpandedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topicId)) next.delete(topicId);
            else next.add(topicId);
            return next;
        });
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'My Syllabus Progress', href: '/syllabus/my-progress' },
        { label: syllabus?.title || 'Details' },
    ];

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading syllabus details..." />;
    }

    if (error || !syllabus) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-red-500 dark:text-red-400 mb-4">{error || 'Syllabus not found'}</p>
                    <Button variant="secondary" onClick={() => navigate('/syllabus/my-progress')}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3">
            <PageHeader
                title={syllabus.title}
                subtitle={syllabus.description}
                breadcrumbs={breadcrumbs}
                actions={
                    <Button
                        variant="secondary"
                        leftIcon={<BackIcon />}
                        onClick={() => navigate('/syllabus/my-progress')}
                    >
                        Back
                    </Button>
                }
            />

            {/* Syllabus Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Subject</span>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                            {syllabus.subject_name}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Academic Year</span>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                            {syllabus.academic_year_name || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                        <div className="mt-1">
                            <Badge variant={getStatusBadgeVariant(syllabus.status)}>
                                {getStatusLabel(syllabus.status)}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Overall Progress</span>
                        <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {syllabus.completion_percentage || 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        (syllabus.completion_percentage || 0) >= 100
                                            ? 'bg-green-500'
                                            : 'bg-blue-600 dark:bg-blue-500'
                                    }`}
                                    style={{ width: `${syllabus.completion_percentage || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Read-only Lessons Accordion */}
            <div className="space-y-4">
                {syllabus.lessons?.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No lessons in this syllabus yet.</p>
                    </div>
                ) : (
                    syllabus.lessons?.map((lesson) => (
                        <div
                            key={lesson.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            {/* Lesson Header */}
                            <div
                                className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => toggleLesson(lesson.id)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {lesson.status === SyllabusStatus.COMPLETED ? (
                                        <CheckCircleIcon />
                                    ) : (
                                        <CircleIcon />
                                    )}
                                    <div
                                        className={`transform transition-transform ${expandedLessons.has(lesson.id) ? 'rotate-180' : ''}`}
                                    >
                                        <ChevronDownIcon />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                                {lesson.title}
                                            </h3>
                                            <Badge variant={getStatusBadgeVariant(lesson.status)} size="sm">
                                                {getStatusLabel(lesson.status)}
                                            </Badge>
                                            {(lesson as any).completed_by && (
                                                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                                                    Completed by {(lesson as any).completed_by}
                                                </span>
                                            )}
                                            <DateRangeChip
                                                plannedStart={lesson.planned_start_date}
                                                plannedEnd={lesson.planned_end_date}
                                                actualStart={lesson.actual_start_date}
                                                actualEnd={lesson.actual_end_date}
                                                status={lesson.status}
                                            />
                                        </div>
                                        {lesson.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {lesson.description}
                                            </p>
                                        )}
                                        <ProgressBar percentage={lesson.completion_percentage || 0} className="mt-1.5 max-w-xs" />
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                    {lesson.completion_percentage || 0}%
                                </span>
                            </div>

                            {/* Lesson Content (Topics) - read-only */}
                            {expandedLessons.has(lesson.id) && (
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                    {lesson.topics?.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                            No topics yet.
                                        </div>
                                    ) : (
                                        lesson.topics?.map((topic) => (
                                            <div key={topic.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                                {/* Topic Header */}
                                                <div
                                                    className="flex items-center justify-between p-3 sm:p-4 pl-6 sm:pl-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-l-4 border-blue-500"
                                                    onClick={() => toggleTopic(topic.id)}
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        {topic.status === SyllabusStatus.COMPLETED ? (
                                                            <CheckCircleIcon />
                                                        ) : (
                                                            <CircleIcon />
                                                        )}
                                                        <div
                                                            className={`transform transition-transform ${expandedTopics.has(topic.id) ? 'rotate-180' : ''}`}
                                                        >
                                                            <ChevronDownIcon />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                                    {topic.title}
                                                                </h4>
                                                                <Badge variant={getStatusBadgeVariant(topic.status)} size="sm">
                                                                    {getStatusLabel(topic.status)}
                                                                </Badge>
                                                                {(topic as any).completed_by && (
                                                                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                                                                        Completed by {(topic as any).completed_by}
                                                                    </span>
                                                                )}
                                                                <DateRangeChip
                                                                    plannedStart={topic.planned_start_date}
                                                                    plannedEnd={topic.planned_end_date}
                                                                    actualStart={(topic as any).actual_start_date}
                                                                    actualEnd={(topic as any).actual_end_date}
                                                                    status={topic.status}
                                                                />
                                                            </div>
                                                            {topic.description && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {topic.description}
                                                                </p>
                                                            )}
                                                            <ProgressBar percentage={topic.completion_percentage || 0} className="mt-1 max-w-xs" />
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                        {topic.completion_percentage || 0}%
                                                    </span>
                                                </div>

                                                {/* Subtopics - read-only */}
                                                {expandedTopics.has(topic.id) && (
                                                    <div className="bg-gray-50 dark:bg-gray-900/30 border-l-4 border-blue-300 ml-2 sm:ml-12">
                                                        {topic.subtopics?.length === 0 ? (
                                                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                                No subtopics yet.
                                                            </div>
                                                        ) : (
                                                            topic.subtopics?.map((subtopic) => (
                                                                <div
                                                                    key={subtopic.id}
                                                                    className="flex items-center justify-between p-3 pl-4 sm:pl-8 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1">
                                                                        {subtopic.is_completed ? (
                                                                            <CheckCircleIcon />
                                                                        ) : (
                                                                            <CircleIcon />
                                                                        )}
                                                                        <div>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="font-medium text-gray-900 dark:text-white">
                                                                                    {subtopic.title}
                                                                                </span>
                                                                                {(subtopic as any).completed_by && (
                                                                                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                                                                                        Completed by {(subtopic as any).completed_by}
                                                                                    </span>
                                                                                )}
                                                                                <DateRangeChip
                                                                                    plannedStart={(subtopic as any).planned_start_date}
                                                                                    plannedEnd={(subtopic as any).planned_end_date || subtopic.planned_completion_date}
                                                                                    actualStart={(subtopic as any).actual_start_date}
                                                                                    actualEnd={(subtopic as any).actual_end_date || (subtopic as any).actual_completion_date}
                                                                                    status={subtopic.status}
                                                                                />
                                                                            </div>
                                                                            {subtopic.learning_objectives && (
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                                    {subtopic.learning_objectives}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant={getStatusBadgeVariant(subtopic.status)} size="sm">
                                                                        {getStatusLabel(subtopic.status)}
                                                                    </Badge>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentSyllabusDetail;
