import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, EmptyState } from '../../components';
import { syllabusService } from '../../services/modules/syllabusService';
import { IStudentSyllabusEntry } from '../../types';
import { useAuthStore } from '../../stores/authStore';

const BookIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const StudentSyllabusView: FC = () => {
    const navigate = useNavigate();
    const { user, academicYearVersion } = useAuthStore();

    const [entries, setEntries] = useState<IStudentSyllabusEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        const authUser = useAuthStore.getState().user;
        if (!authUser?.current_academic_year?.id) {
            setError('Academic year not found. Please select an academic year.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const academicYearId = authUser.current_academic_year.id.toString();
            const data = await syllabusService.fetchStudentSyllabusView(academicYearId);
            setEntries(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch syllabus progress');
            toast.error('Failed to fetch syllabus progress');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [academicYearVersion]);

    const isTeacher = user?.role === 'TEACHER';

    const handleCardClick = (entry: IStudentSyllabusEntry) => {
        if (isTeacher) {
            // Teachers go to the main syllabus detail page (with progress toggles)
            navigate(`/syllabus/${entry.syllabus.id}`);
        } else {
            // Students go to the read-only detail page
            navigate(`/syllabus/my-progress/${entry.syllabus.id}?teacherId=${entry.teacher_id}`);
        }
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'My Syllabus Progress' },
    ];

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading syllabus progress..." />;
    }

    return (
        <div className="p-3">
            <PageHeader
                title="My Syllabus Progress"
                subtitle={isTeacher
                    ? "Track your syllabus completion progress across all assigned subjects"
                    : "View your teachers' syllabus completion progress across all subjects"
                }
                breadcrumbs={breadcrumbs}
            />

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                    {error}
                </div>
            )}

            {entries.length === 0 && !error ? (
                <EmptyState
                    icon={<BookIcon />}
                    title="No Syllabus Found"
                    description="No syllabus progress is available for your subjects yet."
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {entries.map((entry, index) => (
                        <div
                            key={`${entry.syllabus.id}-${entry.teacher_id}-${index}`}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleCardClick(entry)}
                        >
                            {/* Card Header */}
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                        {entry.subject_name}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                    {entry.syllabus.title}
                                </h3>
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                                {/* Teacher Info */}
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {entry.teacher_name}
                                    </span>
                                </div>

                            </div>

                            {/* Card Footer */}
                            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>Academic Year:</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {entry.syllabus.academic_year_name || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentSyllabusView;
