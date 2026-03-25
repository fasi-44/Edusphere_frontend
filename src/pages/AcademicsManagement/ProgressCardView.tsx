/**
 * Progress Card View Page
 * Displays individual student's progress report card with subject-wise marks,
 * overall statistics, attendance, and class teacher remarks.
 * Uses reusable DataTable, Badge, StatCard, and other shared components.
 */

import { FC, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button, LoadingSpinner, EmptyState, Badge, DataTable, StatCard, PrintActions } from '../../components';
import { academicsService } from '../../services/modules/academicsService';
import { IProgressCard, IProgressCardSubject } from '../../types/index';
import { useAuthStore } from '../../stores/authStore';
import { generateProgressCardPdf } from '../../prints';
import type { SchoolData, PdfAction } from '../../prints';

type GradeBadgeVariant = 'success' | 'primary' | 'warning' | 'danger' | 'secondary';

const getGradeBadgeVariant = (grade: string): GradeBadgeVariant => {
    switch (grade) {
        case 'A+':
        case 'A':
            return 'success';
        case 'B+':
        case 'B':
            return 'primary';
        case 'C':
        case 'D':
            return 'warning';
        case 'F':
            return 'danger';
        default:
            return 'secondary';
    }
};

const getProgressBarColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
};

const ProgressCardView: FC = () => {
    const { studentId, examId } = useParams<{ studentId: string; examId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [progressCard, setProgressCard] = useState<IProgressCard | null>(null);

    useEffect(() => {
        if (studentId && examId) {
            fetchProgressCard();
        }
    }, [studentId, examId]);

    const fetchProgressCard = async () => {
        try {
            setLoading(true);
            const data = await academicsService.fetchProgressCard(studentId!, examId!);
            setProgressCard(data);
        } catch (error: any) {
            console.error('Error fetching progress card:', error);
            toast.error(error.message || 'Failed to fetch progress card');
        } finally {
            setLoading(false);
        }
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

    // Handle PDF generation
    const handlePrintReport = useCallback(async (action: PdfAction) => {
        if (!progressCard) return;
        try {
            await generateProgressCardPdf(progressCard, getSchoolData(), action);
            toast.success(`Progress card ${action === 'download' ? 'downloaded' : action === 'print' ? 'sent to printer' : 'opened'} successfully`);
        } catch (err: any) {
            console.error('Error generating progress card PDF:', err);
            toast.error('Failed to generate progress card PDF');
        }
    }, [progressCard, getSchoolData]);

    const hasInternalExternal = progressCard?.subject_details?.some(s => s.has_internal_external);

    const subjectColumns = useMemo(() => {
        const cols: any[] = [
            {
                key: '_index',
                label: '#',
                className: 'text-center',
                width: '3rem',
                render: (_: any, __: any, index: number) => (
                    <span className="text-gray-500 dark:text-gray-400">{index + 1}</span>
                ),
            },
            {
                key: 'subject_name',
                label: 'Subject',
                render: (_: any, row: IProgressCardSubject) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{row.subject_name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{row.subject_code}</span>
                    </div>
                ),
            },
        ];

        if (hasInternalExternal) {
            cols.push(
                {
                    key: 'internal_marks',
                    label: 'Internal',
                    className: 'text-center',
                    render: (_: any, row: IProgressCardSubject) =>
                        row.has_internal_external ? (row.is_absent ? '-' : row.internal_marks) : '-',
                },
                {
                    key: 'external_marks',
                    label: 'External',
                    className: 'text-center',
                    render: (_: any, row: IProgressCardSubject) =>
                        row.has_internal_external ? (row.is_absent ? '-' : row.external_marks) : '-',
                },
            );
        }

        cols.push(
            {
                key: 'total_marks',
                label: 'Total Marks',
                className: 'text-center',
                render: (_: any, row: IProgressCardSubject) =>
                    row.is_absent ? (
                        <Badge variant="danger" size="sm">AB</Badge>
                    ) : (
                        <span className="font-semibold">{row.total_marks}</span>
                    ),
            },
            {
                key: 'max_marks',
                label: 'Max Marks',
                className: 'text-center',
            },
            {
                key: 'percentage',
                label: 'Percentage',
                className: 'text-center',
                render: (value: number) => (
                    <div className="flex flex-col items-center gap-1">
                        <Badge
                            variant={value >= 75 ? 'success' : value >= 50 ? 'warning' : 'danger'}
                            size="sm"
                        >
                            {Number(value).toFixed(2)}%
                        </Badge>
                        <div className="w-full max-w-[80px] bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 rounded-full ${getProgressBarColor(value)}`}
                                style={{ width: `${Math.min(value, 100)}%` }}
                            />
                        </div>
                    </div>
                ),
            },
            {
                key: 'grade',
                label: 'Grade',
                className: 'text-center',
                render: (_: any, row: IProgressCardSubject) =>
                    !row.is_absent ? (
                        <Badge variant={getGradeBadgeVariant(row.grade)} size="sm">{row.grade}</Badge>
                    ) : null,
            },
            {
                key: 'remarks',
                label: 'Remarks',
                render: (value: string) => (
                    <span className="text-gray-500 dark:text-gray-400">{value || '-'}</span>
                ),
            },
        );

        return cols;
    }, [hasInternalExternal]);

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Class Progress', href: '/academics/progress/class' },
        { label: 'Progress Card', href: '#' },
    ];

    if (loading) {
        return <LoadingSpinner message="Loading progress card..." fullHeight />;
    }

    if (!progressCard) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Progress Report Card"
                    breadcrumbs={breadcrumbs}
                    actions={
                        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                            Back
                        </Button>
                    }
                />
                <EmptyState title="No progress card data found" description="The requested progress card could not be loaded." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Progress Report Card"
                subtitle={`${progressCard.student_name} - ${progressCard.exam_name}`}
                breadcrumbs={breadcrumbs}
                actions={
                    <div className="flex items-center gap-2">
                        <PrintActions onAction={handlePrintReport} />
                        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                            Back
                        </Button>
                    </div>
                }
            />

            {/* Student Info + Overall Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {progressCard.student_name}
                        </h3>
                        <Badge variant="secondary" size="sm">Roll No: {progressCard.roll_number}</Badge>
                    </div>
                    <hr className="border-gray-200 dark:border-gray-700 mb-4" />
                    <div className="space-y-2">
                        <div className="flex items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400 w-32">Class & Section:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {progressCard.class_name} - {progressCard.section_name}
                            </span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400 w-32">Examination:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {progressCard.exam_name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        title="Percentage"
                        value={`${progressCard.overall_percentage.toFixed(2)}%`}
                        icon="📊"
                    />
                    <StatCard
                        title="Grade"
                        value={progressCard.overall_grade}
                        icon="🎓"
                    />
                    <StatCard
                        title="Rank"
                        value={`${progressCard.rank}/${progressCard.total_students}`}
                        icon="🏆"
                    />
                </div>
            </div>

            {/* Subject-wise Performance Table */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Subject-wise Performance
                </h3>
                <DataTable
                    columns={subjectColumns}
                    data={progressCard.subject_details}
                    emptyMessage="No subject data available"
                    striped={false}
                />

                {/* Grand Total Summary */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white uppercase">Grand Total</span>
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Marks: <strong>{progressCard.overall_total_marks} / {progressCard.overall_max_marks}</strong>
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Percentage: <strong>{progressCard.overall_percentage.toFixed(2)}%</strong>
                            </span>
                            <Badge variant={getGradeBadgeVariant(progressCard.overall_grade)} size="md">
                                {progressCard.overall_grade}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {progressCard.attendance && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Attendance</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Days Present: <strong>{progressCard.attendance.present_days}</strong> / {progressCard.attendance.total_days}
                            {' '}
                            <Badge
                                variant={progressCard.attendance.percentage >= 75 ? 'success' : progressCard.attendance.percentage >= 50 ? 'warning' : 'danger'}
                                size="sm"
                            >
                                {progressCard.attendance.percentage?.toFixed(1)}%
                            </Badge>
                        </p>
                    </div>
                )}
                <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 ${!progressCard.attendance ? 'md:col-span-2' : ''}`}>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Class Teacher's Remarks</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {progressCard.class_teacher_remarks || 'No remarks provided.'}
                    </p>
                    {progressCard.class_teacher_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            - {progressCard.class_teacher_name}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProgressCardView;
