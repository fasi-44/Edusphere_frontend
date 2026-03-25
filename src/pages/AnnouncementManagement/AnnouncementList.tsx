/**
 * Announcement List Page
 * Display announcements in a feed/card view with filtering capabilities
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import AnnouncementDetail from './AnnouncementDetail';
import {
    PageHeader,
    Button,
    Badge,
    FormField,
    FormSelect,
    LoadingSpinner,
    EmptyState,
    ConfirmDialog,
} from '../../components';
import { announcementService } from '../../services/modules/announcementService';
import { IAnnouncement, AnnouncementPriority } from '../../types/index';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';

interface IFilterParams {
    category: string;
    priority: string;
    search: string;
}

interface IPaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const AnnouncementList: FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);
    const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<IPaginationMeta>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });
    const [filters, setFilters] = useState<IFilterParams>({ category: '', priority: '', search: '' });

    const [detailModal, setDetailModal] = useState<{
        open: boolean;
        announcement: IAnnouncement | null;
    }>({
        open: false,
        announcement: null,
    });

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{
        open: boolean;
        id: number | null;
        title: string;
    }>({
        open: false,
        id: null,
        title: '',
    });

    const setViewDetailsModal = (announcement: IAnnouncement) => {
        setDetailModal({ open: true, announcement });
    };

    // Fetch announcements
    const fetchAnnouncements = async (page = 1) => {
        setLoading(true);
        try {
            const authUser = useAuthStore.getState().user;
            if (!authUser) {
                toast.error('User not authenticated');
                return;
            }
            const params: any = {
                page,
                limit: pagination.limit,
                academic_year_id: authUser.current_academic_year.id.toString(),
                user_role: authUser?.role,
            };

            if (filters.category) params.announcement_type = filters.category;
            if (filters.priority) params.priority = filters.priority;
            if (filters.search) params.search = filters.search;

            const response = await announcementService.list(params);
            setAnnouncements(response.data);
            setPagination(response.meta);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch announcements');
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchAnnouncements(1);
    }, [academicYearVersion]);

    // Handle filter change
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle apply filters
    const handleApplyFilters = () => {
        fetchAnnouncements(1);
    };

    // Handle reset filters
    const handleResetFilters = () => {
        setFilters({
            category: '',
            priority: '',
            search: '',
        });
        setTimeout(() => {
            fetchAnnouncements(1);
        }, 0);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteConfirm.id) return;

        try {
            await announcementService.delete(deleteConfirm.id as any);
            toast.success('Announcement deleted successfully');
            setDeleteConfirm({ open: false, id: null, title: '' });
            fetchAnnouncements(pagination.page);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete announcement');
        }
    };

    // Get priority badge variant
    const getPriorityBadgeVariant = (priority: AnnouncementPriority) => {
        const variants: Record<AnnouncementPriority, 'success' | 'warning' | 'danger' | 'info'> = {
            [AnnouncementPriority.LOW]: 'success',
            [AnnouncementPriority.MEDIUM]: 'info',
            [AnnouncementPriority.HIGH]: 'warning',
            [AnnouncementPriority.URGENT]: 'danger',
        };
        return variants[priority] || 'info';
    };

    // Get priority display
    const getPriorityDisplay = (priority: AnnouncementPriority) => {
        const displays: Record<AnnouncementPriority, string> = {
            [AnnouncementPriority.LOW]: '🟢 Low',
            [AnnouncementPriority.MEDIUM]: '🟡 Medium',
            [AnnouncementPriority.HIGH]: '🟠 High',
            [AnnouncementPriority.URGENT]: '🔴 Urgent',
        };
        return displays[priority] || priority;
    };


    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Announcements"
                subtitle="View school announcements and updates"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Announcements', href: '#' },
                ]}
                actions={
                    hasPermission(Permission.MANAGE_ANNOUNCEMENTS) && (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/announcements/new')}
                        >
                            + New Announcement
                        </Button>
                    )
                }
            />

            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Filters
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Search */}
                    <FormField label="Search">
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search announcements..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </FormField>

                    {/* Category Filter */}
                    <FormField label="Category">
                        <FormSelect
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                            options={[
                                { value: 'General', label: 'General' },
                                { value: 'Academic', label: 'Academic' },
                                { value: 'Examination', label: 'Examination' },
                                { value: 'Event', label: 'Event' },
                                { value: 'Holiday', label: 'Holiday' },
                                { value: 'Urgent', label: 'Urgent' },
                                { value: 'Fee Related', label: 'Fee Related' },
                                { value: 'SPORTS', label: 'SPORTS' }
                            ]}
                            placeholder="All Categories"
                        />
                    </FormField>

                    {/* Priority Filter */}
                    <FormField label="Priority">
                        <FormSelect
                            name="priority"
                            value={filters.priority}
                            onChange={handleFilterChange}
                            options={Object.values(AnnouncementPriority).map((priority) => ({
                                label: getPriorityDisplay(priority),
                                value: priority,
                            }))}
                            placeholder="All Priorities"
                        />
                    </FormField>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleResetFilters}
                    >
                        Reset Filters
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleApplyFilters}
                    >
                        Apply Filters
                    </Button>
                </div>
            </div>

            {/* Results Section */}
            {loading ? (
                <LoadingSpinner fullHeight message="Loading announcements..." />
            ) : announcements.length > 0 ? (
                <div className="space-y-4">
                    {/* Announcements Feed */}
                    <div className="space-y-4">
                        {announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {announcement.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Posted on{' '}
                                            {new Date(announcement.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Badge
                                            variant={getPriorityBadgeVariant(announcement.priority)}
                                            text={getPriorityDisplay(announcement.priority)}
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="mb-4">
                                    <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                                        {announcement.description}
                                    </p>
                                </div>

                                {/* Category and Metadata */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                            {announcement.announcement_type || 'General'}
                                        </span>
                                    </div>
                                    {announcement.expiry_date && (
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            Expires:{' '}
                                            {new Date(announcement.expiry_date).toLocaleDateString('en-US')}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setViewDetailsModal(announcement)}
                                    >
                                        View
                                    </Button>
                                    {hasPermission(Permission.MANAGE_ANNOUNCEMENTS) && (
                                        <Button
                                            variant="info"
                                            size="sm"
                                            onClick={() =>
                                                navigate(`/announcements/${announcement.id}/edit`)
                                            }
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    {hasPermission(Permission.MANAGE_ANNOUNCEMENTS) && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteConfirm({
                                                    open: true,
                                                    id: announcement.id,
                                                    title: announcement.title,
                                                })
                                            }
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
                                onClick={() => fetchAnnouncements(Math.max(1, pagination.page - 1))}
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
                                    fetchAnnouncements(Math.min(pagination.totalPages, pagination.page + 1))
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
                    icon="📢"
                    title="No Announcements"
                    description="No announcements found. Create one to get started."
                    action={
                        hasPermission(Permission.MANAGE_ANNOUNCEMENTS) && (
                            <Button
                                variant="primary"
                                onClick={() => navigate('/announcements/new')}
                            >
                                Create Announcement
                            </Button>
                        )
                    }
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                title="Delete Announcement"
                message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm({ open: false, id: null, title: '' })}
            />
            
            {detailModal.open && (
                <AnnouncementDetail
                    isOpen={detailModal.open}
                    onClose={() => setDetailModal({ open: false, announcement: null })}
                    announcement={detailModal.announcement}
                />
            )}
        </div>
    );
};


export default AnnouncementList;
