import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components';
import { syllabusService } from '../../services/modules/syllabusService';
import { ISyllabus } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';
import SyllabusFormModal from './SyllabusFormModal';

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const BookIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const MoreIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
);

const SyllabusList: FC = () => {
    const navigate = useNavigate();
    const { academicYearVersion } = useAuthStore();
    const { hasPermission } = usePermissions();

    const [syllabi, setSyllabi] = useState<ISyllabus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [editSyllabus, setEditSyllabus] = useState<ISyllabus | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ISyllabus | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Dropdown menu state
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const fetchSyllabi = async () => {
        const authUser = useAuthStore.getState().user;

        if (!authUser?.current_academic_year?.id) {
            setError('Academic year not found. Please select an academic year.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            let data: ISyllabus[];
            const academicYearId = authUser.current_academic_year.id.toString();

            if (authUser.role === 'TEACHER' && authUser?.school_user_id) {
                data = await syllabusService.fetchSyllabiByTeacher(
                    authUser.school_user_id.toString(),
                    academicYearId
                );
            } else {
                data = await syllabusService.fetchAllSyllabi(academicYearId);
            }

            setSyllabi(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch syllabi');
            toast.error('Failed to fetch syllabi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSyllabi();
    }, [academicYearVersion]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleCreateClick = () => {
        setEditSyllabus(null);
        setShowFormModal(true);
    };

    const handleEditClick = (syllabus: ISyllabus) => {
        setEditSyllabus(syllabus);
        setShowFormModal(true);
        setActiveMenu(null);
    };

    const handleDeleteClick = (syllabus: ISyllabus) => {
        setDeleteTarget(syllabus);
        setShowDeleteDialog(true);
        setActiveMenu(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeleteLoading(true);
            await syllabusService.deleteSyllabus(deleteTarget.id);
            toast.success('Syllabus deleted successfully');
            setShowDeleteDialog(false);
            setDeleteTarget(null);
            fetchSyllabi();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete syllabus');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleFormSuccess = () => {
        setShowFormModal(false);
        setEditSyllabus(null);
        fetchSyllabi();
    };

    const handleViewDetails = (syllabusId: string) => {
        navigate(`/syllabus/${syllabusId}`);
    };

    const handleViewAnalytics = (syllabusId: string) => {
        navigate(`/syllabus/${syllabusId}/analytics`);
    };

    const toggleMenu = (e: React.MouseEvent, syllabusId: string) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === syllabusId ? null : syllabusId);
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Syllabus Management' },
    ];

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading syllabi..." />;
    }

    return (
        <div className="p-3">
            <PageHeader
                title="Syllabus Management"
                subtitle="Manage course syllabi, lessons, topics, and subtopics"
                breadcrumbs={breadcrumbs}
                actions={
                    hasPermission(Permission.MANAGE_SYLLABUS) ? (
                        <Button
                            variant="primary"
                            leftIcon={<PlusIcon />}
                            onClick={handleCreateClick}
                        >
                            Create Syllabus
                        </Button>
                    ) : undefined
                }
            />

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                    {error}
                </div>
            )}

            {syllabi.length === 0 && !error ? (
                <EmptyState
                    icon={<BookIcon />}
                    title="No Syllabi Found"
                    description="Get started by creating your first syllabus to organize your course content."
                    action={
                        hasPermission(Permission.MANAGE_SYLLABUS) ? (
                            <Button
                                variant="primary"
                                leftIcon={<PlusIcon />}
                                onClick={handleCreateClick}
                            >
                                Create Syllabus
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {syllabi.map((syllabus) => (
                        <div
                            key={syllabus.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleViewDetails(syllabus.id)}
                        >
                            {/* Card Header */}
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                                {syllabus.subject_name}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {syllabus.title}
                                        </h3>
                                    </div>
                                    <div className="relative ml-2">
                                        <button
                                            onClick={(e) => toggleMenu(e, syllabus.id)}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <MoreIcon />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeMenu === syllabus.id && (
                                            <div
                                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => { handleViewDetails(syllabus.id); setActiveMenu(null); }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <EyeIcon />
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => { handleViewAnalytics(syllabus.id); setActiveMenu(null); }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <ChartIcon />
                                                    View Analytics
                                                </button>
                                                {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                    <button
                                                        onClick={() => handleEditClick(syllabus)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <EditIcon />
                                                        Edit
                                                    </button>
                                                )}
                                                {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                    <button
                                                        onClick={() => handleDeleteClick(syllabus)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <TrashIcon />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                                {/* Meta Info */}
                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    {syllabus.estimated_duration_hours && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{syllabus.estimated_duration_hours} hours</span>
                                        </div>
                                    )}
                                    {syllabus.planned_end_date && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Due: {new Date(syllabus.planned_end_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <span>{syllabus.lessons?.length || 0} lessons</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>Academic Year:</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {syllabus.academic_year_name || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Syllabus Form Modal */}
            <SyllabusFormModal
                isOpen={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditSyllabus(null);
                }}
                syllabus={editSyllabus}
                onSuccess={handleFormSuccess}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Syllabus"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone and will remove all associated lessons, topics, and subtopics.`}
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setShowDeleteDialog(false);
                    setDeleteTarget(null);
                }}
                isLoading={deleteLoading}
            />
        </div>
    );
};

export default SyllabusList;
