import { FC } from 'react';
import { IAnnouncement, AnnouncementPriority } from '../../types/index';
import Modal from '../../components/modals/Modal';

interface IAnnouncementDetailProps {
    isOpen: boolean;
    onClose: () => void;
    announcement: IAnnouncement | null;
}

const AnnouncementDetail: FC<IAnnouncementDetailProps> = ({ isOpen, onClose, announcement }) => {
    if (!announcement) return null;

    // Get priority display with enhanced styling
    const getPriorityConfig = (priority: AnnouncementPriority) => {
        const configs = {
            [AnnouncementPriority.LOW]: {
                icon: '●',
                text: 'Low Priority',
                color: 'text-green-600 dark:text-green-400',
                bg: 'bg-green-50 dark:bg-green-900/20'
            },
            [AnnouncementPriority.MEDIUM]: {
                icon: '●',
                text: 'Medium Priority',
                color: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-50 dark:bg-blue-900/20'
            },
            [AnnouncementPriority.HIGH]: {
                icon: '●',
                text: 'High Priority',
                color: 'text-orange-600 dark:text-orange-400',
                bg: 'bg-orange-50 dark:bg-orange-900/20'
            },
            [AnnouncementPriority.URGENT]: {
                icon: '●',
                text: 'Urgent',
                color: 'text-red-600 dark:text-red-400',
                bg: 'bg-red-50 dark:bg-red-900/20'
            },
        };
        return configs[priority] || configs[AnnouncementPriority.MEDIUM];
    };

    // Format date helper
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Calculate days until expiry
    const getDaysUntilExpiry = () => {
        if (!announcement.expiry_date) return null;
        const today = new Date();
        const expiry = new Date(announcement.expiry_date);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const priorityConfig = getPriorityConfig(announcement.priority);
    const daysUntilExpiry = getDaysUntilExpiry();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            size="lg"
        >
            <div className="space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                    {/* Priority and Type Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                            <span className="text-base leading-none">{priorityConfig.icon}</span>
                            {priorityConfig.text}
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            📢 {announcement.announcement_type || 'General'}
                        </span>
                        {announcement.is_published && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                ✓ Published
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                        {announcement.title}
                    </h2>

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{announcement.creator_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{announcement.publish_date ? formatDate(announcement.publish_date) : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Expiry Alert */}
                {announcement.expiry_date && (
                    <div className={`flex items-start gap-3 p-4 rounded-lg border ${daysUntilExpiry && daysUntilExpiry <= 3
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                        }`}>
                        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${daysUntilExpiry && daysUntilExpiry <= 3
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${daysUntilExpiry && daysUntilExpiry <= 3
                                    ? 'text-red-800 dark:text-red-300'
                                    : 'text-amber-800 dark:text-amber-300'
                                }`}>
                                {daysUntilExpiry !== null && daysUntilExpiry > 0
                                    ? `Expires in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`
                                    : daysUntilExpiry === 0
                                        ? 'Expires today'
                                        : 'Expired'
                                }
                            </p>
                            <p className={`text-xs mt-0.5 ${daysUntilExpiry && daysUntilExpiry <= 3
                                    ? 'text-red-700 dark:text-red-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }`}>
                                {formatDate(announcement.expiry_date)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Description Card */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                        Announcement Details
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {announcement.description}
                        </p>
                    </div>
                </div>

                {/* Target Audience Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                            Target Audience
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {announcement.target_audience ? (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm">
                                👥 {announcement.target_audience}
                            </span>
                        ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400">No specific audience targeted</p>
                        )}
                    </div>
                </div>

                {/* Attachments */}
                {announcement.attachments && announcement.attachments.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                                Attachments ({announcement.attachments.length})
                            </h3>
                        </div>
                        <div className="grid gap-2">
                            {announcement.attachments.map((attachment, index) => (
                                <a
                                    key={index}
                                    href={attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {attachment.split('/').pop()}
                                        </span>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Info Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Status
                        </p>
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${announcement.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            <span className={`text-sm font-semibold ${announcement.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                {announcement.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Created By
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {announcement.creator_name}
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AnnouncementDetail;
