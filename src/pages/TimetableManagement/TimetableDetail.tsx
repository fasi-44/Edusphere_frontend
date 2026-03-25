/**
 * Timetable Detail Page
 * View timetable with configuration info and interactive grid (read-only)
 */

import { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    LoadingSpinner,
    EmptyState,
    TimetableGrid,
    PrintActions,
} from '../../components';
import { timetableService } from '../../services/modules/timetableService';
import { ITimetable } from '../../types/index';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';
import { generateTimetablePdf } from '../../prints';
import type { SchoolData, PdfAction, TimetableReportData } from '../../prints';

const TimetableDetail: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);
    const { hasPermission } = usePermissions();

    const [timetable, setTimetable] = useState<ITimetable | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch timetable data on mount
    useEffect(() => {
        if (!id) return;

        const fetchTimetable = async () => {
            try {
                setLoading(true);
                const data = await timetableService.getById(id);
                setTimetable(data);
            } catch (err: any) {
                toast.error('Failed to load timetable');
                navigate('/timetable');
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, [id, navigate, academicYearVersion]);

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
        if (!timetable) return;
        try {
            const reportData: TimetableReportData = {
                className: timetable.class_name,
                sectionName: timetable.section_name,
                academicYear: timetable.academic_year,
                semester: timetable.semester,
                configuration: timetable.configuration,
                timeSlots: timetable.time_slots || [],
                entries: timetable.entries || {},
                isDraft: timetable.is_draft,
            };
            await generateTimetablePdf(reportData, getSchoolData(), action);
            toast.success(`Timetable ${action === 'download' ? 'downloaded' : action === 'print' ? 'sent to printer' : 'opened'} successfully`);
        } catch (err: any) {
            console.error('Error generating timetable PDF:', err);
            toast.error('Failed to generate timetable PDF');
        }
    }, [timetable, getSchoolData]);

    // Handle edit draft
    const handleEditDraft = () => {
        navigate(`/timetable/${id}/edit`);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!timetable) return;

        const confirmDelete = window.confirm(
            'Are you sure you want to delete this timetable? This action cannot be undone.'
        );
        if (!confirmDelete) return;

        try {
            await timetableService.delete(id!);
            toast.success('Timetable deleted successfully');
            navigate('/timetable');
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete timetable');
        }
    };

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading timetable..." />;
    }

    if (!timetable) {
        return (
            <EmptyState
                title="Timetable Not Found"
                description="The timetable you're trying to view could not be found."
            />
        );
    }

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header */}
            <div className="print:hidden">
                <PageHeader
                    title="View Timetable"
                    subtitle="Review your timetable schedule"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Timetables', href: '/timetable' },
                        { label: 'View', href: '#' },
                    ]}
                />
            </div>

            {/* Configuration Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 print:border print:border-gray-400 print:rounded-none print:p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 print:text-base print:mb-2">
                    Timetable Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                    {/* Class Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase print:text-gray-600 print:text-xs">
                            Class
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 print:text-sm print:mt-1">
                            {timetable.class_name} - {timetable.section_name}
                        </p>
                    </div>

                    {/* Academic Year */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase print:text-gray-600 print:text-xs">
                            Academic Year
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 print:text-sm print:mt-1">
                            {timetable.academic_year}
                        </p>
                    </div>

                    {/* Semester */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase print:text-gray-600 print:text-xs">
                            Semester
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 print:text-sm print:mt-1">
                            Semester {timetable.semester}
                        </p>
                    </div>

                    {/* Period Duration */}
                    {timetable.configuration && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase print:text-gray-600 print:text-xs">
                                Period Duration
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 print:text-sm print:mt-1">
                                {timetable.configuration.period_duration} min
                            </p>
                        </div>
                    )}

                    {/* School Start Time */}
                    {timetable.configuration && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase print:text-gray-600 print:text-xs">
                                School Start
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 print:text-sm print:mt-1">
                                {timetable.configuration.school_start_time}
                            </p>
                        </div>
                    )}

                    {/* Total Periods */}
                    {timetable.configuration && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase print:text-gray-600 print:text-xs">
                                Total Periods
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 print:text-sm print:mt-1">
                                {timetable.configuration.total_periods}
                            </p>
                        </div>
                    )}

                    {/* Lunch Start Time */}
                    {timetable.configuration && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase print:text-gray-600 print:text-xs">
                                Lunch Start
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 print:text-sm print:mt-1">
                                {timetable.configuration.lunch_start_time}
                            </p>
                        </div>
                    )}

                    {/* Lunch Duration */}
                    {timetable.configuration && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase print:text-gray-600 print:text-xs">
                                Lunch Duration
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 print:text-sm print:mt-1">
                                {timetable.configuration.lunch_duration} min
                            </p>
                        </div>
                    )}

                    {/* Status */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 print:bg-white print:p-3 print:border-gray-400 print:rounded-none">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium uppercase print:text-gray-600 print:text-xs">
                            Status
                        </p>
                        <span
                            className={`inline-block px-2 py-1 mt-1 text-xs font-semibold rounded print:border print:px-1 print:py-0 ${
                                timetable.is_draft
                                    ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 print:border-yellow-400 print:text-yellow-700'
                                    : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 print:border-green-400 print:text-green-700'
                            }`}
                        >
                            {timetable.is_draft ? 'Draft' : 'Published'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 print:border print:border-gray-400 print:rounded-none print:p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 print:text-base print:mb-2">
                    Timetable Schedule
                </h3>

                <div className="print:text-sm print:leading-tight">
                    <TimetableGrid
                        timeSlots={timetable.time_slots || []}
                        entries={timetable.entries || {}}
                        onCellClick={() => {}}
                        readOnly={true}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex gap-3">
                    <PrintActions onAction={handlePrintReport} size="md" />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/timetable')}
                    >
                        Back
                    </Button>

                    {hasPermission(Permission.MANAGE_TIMETABLE) && timetable.is_draft && (
                        <Button
                            variant="info"
                            onClick={handleEditDraft}
                        >
                            Edit Draft
                        </Button>
                    )}

                    {hasPermission(Permission.MANAGE_TIMETABLE) && (
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimetableDetail;
