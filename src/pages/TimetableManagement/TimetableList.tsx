/**
 * Timetable List Page
 * Display and manage timetables for classes
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    LoadingSpinner,
    EmptyState,
    ConfirmDialog,
} from '../../components';
import { timetableService } from '../../services/modules/timetableService';
import { ITimetable } from '../../types/index';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';

interface IPaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const TimetableList: FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const authUser = useAuthStore((state) => state.user);
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);

    // State
    const [timetables, setTimetables] = useState<ITimetable[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination] = useState<IPaginationMeta>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{
        open: boolean;
        id: string | null;
    }>({
        open: false,
        id: null,
    });

    // Fetch timetables
    const fetchTimetables = async (_page: number = 1) => {
        setLoading(true);
        try {
            if (!authUser?.current_academic_year?.id) {
                toast.error('Academic year not found');
                return;
            }

            const response = await timetableService.list(authUser.current_academic_year.id);
            setTimetables(response);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch timetables');
            setTimetables([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchTimetables(1);
    }, [authUser?.current_academic_year?.id, academicYearVersion]);

    // Handle delete
    const handleDelete = async () => {
        if (!deleteConfirm.id) return;

        try {
            await timetableService.delete(deleteConfirm.id);
            toast.success('Timetable deleted successfully');
            setDeleteConfirm({ open: false, id: null });
            fetchTimetables(pagination.page);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete timetable');
        }
    };

    // Get day name
    const getDayName = (dayOfWeek: number) => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayOfWeek] || 'Unknown';
    };


    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Timetables"
                subtitle="Manage class timetables and schedules"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Timetables', href: '#' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_TIMETABLE) ? (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/timetable/new')}
                        >
                            + New Timetable
                        </Button>
                    ) : undefined
                }
            />

            {/* Timetables Section */}
            {loading ? (
                <LoadingSpinner fullHeight message="Loading timetables..." />
            ) : timetables?.length > 0 ? (
                <div className="space-y-4">
                    {/* Timetables Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {timetables.map((timetable) => (
                            <div
                                key={timetable.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                            >
                                {/* Header */}
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Class: {timetable.class_name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Section: {timetable.section_name}
                                    </p>
                                </div>

                                {/* Time Slots Summary */}
                                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {timetable.timeSlots?.length || 0} Time Slots
                                    </p>
                                    <div className="space-y-2">
                                        {timetable.timeSlots?.slice(0, 3).map((slot) => (
                                            <div key={slot.id} className="text-xs text-gray-600 dark:text-gray-400">
                                                <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                                    {getDayName(slot.dayOfWeek)} {slot.startTime}-{slot.endTime}
                                                </span>
                                            </div>
                                        ))}
                                        {(timetable.timeSlots?.length || 0) > 3 && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                +{(timetable.timeSlots?.length || 0) - 3} more slots
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mb-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                        timetable.is_draft
                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    }`}>
                                        {timetable.is_draft ? 'Draft' : 'Published'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => navigate(`/timetable/${timetable.id}`)}
                                    >
                                        View
                                    </Button>
                                    {hasPermission(Permission.MANAGE_TIMETABLE) && timetable.is_draft && (
                                        <Button
                                            variant="info"
                                            size="sm"
                                            onClick={() => navigate(`/timetable/${timetable.id}/edit`)}
                                        >
                                            Edit Draft
                                        </Button>
                                    )}
                                    {hasPermission(Permission.MANAGE_TIMETABLE) && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setDeleteConfirm({ open: true, id: timetable.id })}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                                variant="secondary"
                                onClick={() => fetchTimetables(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page === 1}
                                size="sm"
                            >
                                ← Previous
                            </Button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    fetchTimetables(Math.min(pagination.totalPages, pagination.page + 1))
                                }
                                disabled={pagination.page === pagination.totalPages}
                                size="sm"
                            >
                                Next →
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState
                    icon="📅"
                    title="No Timetables"
                    description="No timetables found. Create one to get started."
                    action={
                        hasPermission(Permission.MANAGE_TIMETABLE) ? (
                            <Button
                                variant="primary"
                                onClick={() => navigate('/timetable/new')}
                            >
                                Create Timetable
                            </Button>
                        ) : undefined
                    }
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                title="Delete Timetable"
                message="Are you sure you want to delete this timetable? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm({ open: false, id: null })}
            />
        </div>
    );
};

export default TimetableList;
