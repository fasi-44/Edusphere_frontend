import React, { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button, LoadingSpinner, Badge } from '../../components';
import { syllabusService } from '../../services/modules/syllabusService';
import { ISyllabusAnalytics, ISyllabus, SyllabusStatus } from '../../types';

// Icons
const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const BookIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const WarningIcon = () => (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
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

interface StatCardProps {
    title: string;
    value: number;
    subValue?: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'amber' | 'gray';
}

const StatCard: FC<StatCardProps> = ({ title, value, subValue, icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {subValue && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const SyllabusAnalytics: FC = () => {
    const { id: syllabusId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState<ISyllabusAnalytics | null>(null);
    const [syllabus, setSyllabus] = useState<ISyllabus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!syllabusId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const [analyticsData, syllabusData] = await Promise.all([
                    syllabusService.fetchSyllabusAnalytics(syllabusId),
                    syllabusService.fetchSyllabusDetail(syllabusId, false),
                ]);

                setAnalytics(analyticsData);
                setSyllabus(syllabusData);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch analytics');
                toast.error('Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [syllabusId]);

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Syllabus Management', href: '/syllabus' },
        { label: syllabus?.title || 'Details', href: `/syllabus/${syllabusId}` },
        { label: 'Analytics' },
    ];

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading analytics..." />;
    }

    if (error || !analytics) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-red-500 dark:text-red-400 mb-4">{error || 'Analytics not available'}</p>
                    <Button variant="secondary" onClick={() => navigate(`/syllabus/${syllabusId}`)}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6">
            <PageHeader
                title="Syllabus Analytics"
                subtitle={syllabus?.title}
                breadcrumbs={breadcrumbs}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            leftIcon={<BackIcon />}
                            onClick={() => navigate(`/syllabus/${syllabusId}`)}
                        >
                            Back to Details
                        </Button>
                    </div>
                }
            />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <StatCard
                    title="Total Lessons"
                    value={analytics.total_lessons}
                    subValue={`${analytics.lessons_completed} completed`}
                    icon={<BookIcon />}
                    color="blue"
                />
                <StatCard
                    title="Total Topics"
                    value={analytics.total_topics}
                    subValue={`${analytics.topics_completed} completed`}
                    icon={<DocumentIcon />}
                    color="green"
                />
                <StatCard
                    title="Total Subtopics"
                    value={analytics.total_subtopics}
                    subValue={`${analytics.subtopics_completed} completed`}
                    icon={<CheckCircleIcon />}
                    color="amber"
                />
                <StatCard
                    title="Overall Progress"
                    value={Math.round(analytics.overall_completion_percentage)}
                    subValue="% complete"
                    icon={<ChartIcon />}
                    color="gray"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Status Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Status Distribution
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {analytics.status_breakdown?.completed || 0}
                                </span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${((analytics.status_breakdown?.completed || 0) /
                                                Math.max(
                                                    (analytics.status_breakdown?.completed || 0) +
                                                    (analytics.status_breakdown?.in_progress || 0) +
                                                    (analytics.status_breakdown?.planned || 0),
                                                    1
                                                )) *
                                            100
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {analytics.status_breakdown?.in_progress || 0}
                                </span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${((analytics.status_breakdown?.in_progress || 0) /
                                                Math.max(
                                                    (analytics.status_breakdown?.completed || 0) +
                                                    (analytics.status_breakdown?.in_progress || 0) +
                                                    (analytics.status_breakdown?.planned || 0),
                                                    1
                                                )) *
                                            100
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Planned</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {analytics.status_breakdown?.planned || 0}
                                </span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-400 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${((analytics.status_breakdown?.planned || 0) /
                                                Math.max(
                                                    (analytics.status_breakdown?.completed || 0) +
                                                    (analytics.status_breakdown?.in_progress || 0) +
                                                    (analytics.status_breakdown?.planned || 0),
                                                    1
                                                )) *
                                            100
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress by Level */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Progress by Level
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lessons</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {analytics.lessons_completed}/{analytics.total_lessons}
                                </span>
                            </div>
                            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${analytics.total_lessons > 0
                                                ? (analytics.lessons_completed / analytics.total_lessons) * 100
                                                : 0
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Topics</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {analytics.topics_completed}/{analytics.total_topics}
                                </span>
                            </div>
                            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-600 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${analytics.total_topics > 0
                                                ? (analytics.topics_completed / analytics.total_topics) * 100
                                                : 0
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtopics</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {analytics.subtopics_completed}/{analytics.total_subtopics}
                                </span>
                            </div>
                            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-600 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${analytics.total_subtopics > 0
                                                ? (analytics.subtopics_completed / analytics.total_subtopics) * 100
                                                : 0
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overdue Items */}
            {analytics.overdue_items && analytics.overdue_items.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <WarningIcon />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Overdue Items ({analytics.overdue_items.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {analytics.overdue_items.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                                                {getStatusLabel(item.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-amber-600 dark:text-amber-400">
                                    Due: {new Date(item.planned_end_date || item.planned_completion_date || '').toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SyllabusAnalytics;
