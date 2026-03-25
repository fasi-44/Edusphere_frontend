/**
 * Class Detail Page (Refactored)
 * Parent component that manages class data and sections
 * Uses SectionStudents and SectionSubjects as child components
 */

import { Button, ConfirmDialog, EmptyState, LoadingSpinner, PageHeader } from '@/components';
import { Permission } from '../../config/permissions';
import { usePermissions } from '../../hooks/usePermissions';
import { classService } from '@/services/modules/classService';
import { teacherService } from '@/services/modules/teacherService';
import { IClass } from '@/types';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import SectionStudents from './SectionStudents';
import SectionSubjects from './SectionSubjects';

interface Section {
    id: number;
    class_id: number;
    section_name: string;
    student_count: number;
    teacher_id: number;
    teacher_name: string;
}

const ClassDetail: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPermission } = usePermissions();

    // State for class data
    const [classData, setClassData] = useState<IClass | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // State for active section and tabs
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');

    // State for section modal (create/edit)
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [sectionData, setSectionData] = useState<{ id: number | null; section_name: string; teacher_id: number | string }>({
        id: null,
        section_name: '',
        teacher_id: '',
    });
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isSavingSection, setIsSavingSection] = useState(false);

    // Fetch class and sections on mount
    useEffect(() => {
        if (id) {
            fetchClassData();
        }
    }, [id]);

    const fetchClassData = async () => {
        try {
            setLoading(true);
            const data = await classService.getById(id!);
            setClassData(data);

            const sectionsData = await classService.getSections(id!);
            setSections(sectionsData);

            if (sectionsData.length > 0) {
                if (!activeSection || !sectionsData.some(s => s.id === activeSection)) {
                    setActiveSection(sectionsData[0].id);
                }
            } else {
                setActiveSection(null);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch class');
            toast.error(err.message || 'Failed to fetch class');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClass = async () => {
        try {
            setLoading(true);
            await classService.delete(id!);
            toast.success('Class deleted successfully!');
            navigate('/classes');
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete class');
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleOpenSectionModal = async (section?: Section) => {
        setIsEditMode(!!section);
        if (section) {
            setSectionData({
                id: section.id,
                section_name: section.section_name,
                teacher_id: section.teacher_id,
            });
        } else {
            setSectionData({
                id: null,
                section_name: '',
                teacher_id: '',
            });
        }
        setShowSectionModal(true);
        try {
            const response = await teacherService.list();
            setTeachers(response.data);
        } catch (error) {
            toast.error('Failed to fetch teachers');
        }
    };

    const handleSaveSection = async () => {
        if (!sectionData.section_name || !sectionData.teacher_id) {
            toast.error('Please fill in all fields');
            return;
        }
        setIsSavingSection(true);
        try {
            if (isEditMode) {
                await classService.updateSection(id!, sectionData.id!.toString(), sectionData.section_name, sectionData.teacher_id.toString());
                toast.success('Section updated successfully');
            } else {
                await classService.createSection(id!, sectionData.section_name, sectionData.teacher_id.toString());
                toast.success('Section created successfully');
            }
            setShowSectionModal(false);
            fetchClassData();
        } catch (error: any) {
            toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} section`);
        } finally {
            setIsSavingSection(false);
        }
    };

    const activeSectionData = sections.find((s) => s.id === activeSection);

    if (loading && !classData) {
        return <LoadingSpinner fullHeight message="Loading class details..." />;
    }

    if (error && !classData) {
        return <EmptyState title={error} />;
    }

    if (!classData) {
        return <EmptyState title="Class not found" />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={classData.class_name || classData.name}
                subtitle="View and manage class information"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Classes', href: '/classes' },
                    { label: classData.class_name || classData.name, href: '#' },
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        {hasPermission(Permission.MANAGE_CLASSES) && (
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/classes/${classData.id}/edit`)}
                            >
                                Edit Class
                            </Button>
                        )}
                        {hasPermission(Permission.MANAGE_CLASSES) && (
                            <Button
                                variant="primary"
                                onClick={() => handleOpenSectionModal()}
                            >
                                Create Section
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Sections and Tabs */}
            {sections.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        {/* Section Tabs */}
                        <div className="flex items-center overflow-x-auto">
                            {sections.map((section) => (
                                <div key={section.id} className="flex items-center border-r border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setActiveSection(section.id)}
                                        className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeSection === section.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {section.section_name}
                                    </button>
                                    {hasPermission(Permission.MANAGE_CLASSES) && (
                                        <button
                                            onClick={() => handleOpenSectionModal(section)}
                                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                                            title="Edit Section"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-3 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {activeSectionData?.student_count}
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Class Teacher</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {activeSectionData?.teacher_name || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'students'
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                            >
                                Students
                            </button>
                            <button
                                onClick={() => setActiveTab('subjects')}
                                className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'subjects'
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                            >
                                Subjects
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'students' && (
                            <SectionStudents
                                activeSection={activeSection}
                                sections={sections}
                            />
                        )}

                        {activeTab === 'subjects' && (
                            <SectionSubjects
                                activeSection={activeSection}
                                sections={sections}
                                classData={classData}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No sections available for this class.</p>
                    {hasPermission(Permission.MANAGE_CLASSES) && (
                        <Button
                            variant="primary"
                            onClick={() => handleOpenSectionModal()}
                            className="mt-4"
                        >
                            Create Section
                        </Button>
                    )}
                </div>
            )}

            {/* Delete Class Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteClass}
                title="Delete Class?"
                message="Are you sure you want to delete this class? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />

            {/* Section Modal (Create/Edit) */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowSectionModal(false)}>
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {isEditMode ? 'Edit Section' : `Create New Section for ${classData.class_name}`}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Section Name
                                </label>
                                <input
                                    type="text"
                                    value={sectionData.section_name}
                                    onChange={(e) => setSectionData({ ...sectionData, section_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Section A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Class Teacher
                                </label>
                                <select
                                    value={sectionData.teacher_id}
                                    onChange={(e) => setSectionData({ ...sectionData, teacher_id: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a teacher</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.first_name} {teacher.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowSectionModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSaveSection}
                                disabled={isSavingSection}
                            >
                                {isSavingSection ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Section' : 'Create Section')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassDetail;
