import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import dashboardService, { AnnouncementItem } from '../../../services/dashboardService';

const AnnouncementsCard: FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

    const skid = user?.skid || '';
    const academicYearId = user?.current_academic_year?.id;

    useEffect(() => {
        if (skid && academicYearId) {
            fetchAnnouncements();
        }
    }, [skid, academicYearId]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getAnnouncements(
                skid,
                academicYearId!,
                user!.role,
                user!.school_user_id
            );
            setAnnouncements(data);
        } catch (err: any) {
            toast.error('Failed to load announcements');
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return {
                    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
                    dot: 'bg-red-500',
                    avatar: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
                };
            case 'MEDIUM':
                return {
                    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                    dot: 'bg-amber-500',
                    avatar: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
                };
            default:
                return {
                    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                    dot: 'bg-blue-500',
                    avatar: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
                };
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Announcements
                    </h3>
                </div>
                <button
                    onClick={() => navigate('/announcements')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                    View All
                </button>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 flex-1 text-gray-400 dark:text-gray-500">
                    <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <p className="text-sm">No announcements available</p>
                </div>
            ) : (
                <div className="space-y-3 overflow-auto max-h-[380px] flex-1 pr-1 -mr-1">
                    {announcements.map((announcement) => {
                        const styles = getPriorityStyles(announcement.priority);
                        return (
                            <div
                                key={announcement.id}
                                className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex gap-3">
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-full ${styles.avatar} flex items-center justify-center flex-shrink-0`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                        </svg>
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {announcement.title}
                                            </h4>
                                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${styles.badge}`}>
                                                {announcement.priority}
                                            </span>
                                        </div>
                                        {announcement.description && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1.5">
                                                {announcement.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {announcement.announcement_type && (
                                                <span className="px-2 py-0.5 text-[10px] font-medium rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                                    {announcement.announcement_type}
                                                </span>
                                            )}
                                            {announcement.creator_name && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    By: {announcement.creator_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AnnouncementsCard;
