/**
 * Section Subjects Component
 * Handles subjects list, add subjects, remove subjects from section
 * Used within ClassDetail as a tab
 */

import { ConfirmDialog } from '@/components';
import { academicsService } from '@/services/modules/academicsService';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/button/Button';

interface Subject {
    id: string;
    subject_name: string;
    subject_code?: string;
    credits?: number;
    teachers?: any[];
    [key: string]: any;
}

interface IColumn {
    key: string;
    label: string;
    width?: number;
    render?: (value: any, row: any) => React.ReactNode;
}

interface Section {
    id: number;
    class_id: number;
    section_name: string;
    student_count: number;
    teacher_id: number;
    teacher_name: string;
}

interface SectionSubjectsProps {
    activeSection: number | null;
    sections: Section[];
    classData: any;
}

const SectionSubjects: FC<SectionSubjectsProps> = ({
    activeSection,
    sections,
    classData,
}) => {
    // State for subjects
    const [sectionSubjects, setSectionSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Add subjects modal state
    const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [selectedSubjectsToAdd, setSelectedSubjectsToAdd] = useState<Subject[]>([]);
    const [loadingAvailableSubjects, setLoadingAvailableSubjects] = useState(false);

    // Remove subject state
    const [selectedSubjectToRemove, setSelectedSubjectToRemove] = useState<Subject | null>(null);
    const [showRemoveSubjectConfirm, setShowRemoveSubjectConfirm] = useState(false);

    // Actions menu state
    const [subjectActionsMenu, setSubjectActionsMenu] = useState<string | null>(null);
    const [subjectMenuPosition, setSubjectMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    // Fetch subjects when section changes
    useEffect(() => {
        if (activeSection) {
            fetchSectionSubjects();
        }
    }, [activeSection]);

    // Fetch subjects for the active section
    const fetchSectionSubjects = async () => {
        try {
            setLoadingSubjects(true);
            const subjects = await academicsService.getSectionSpecificSubjects(activeSection!.toString());
            setSectionSubjects(subjects);
        } catch (err: any) {
            console.error('Failed to fetch subjects:', err);
            toast.error(err.message || 'Failed to fetch subjects');
            setSectionSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    // Fetch available subjects for the section (not yet added to this section)
    const fetchAvailableSubjects = async () => {
        try {
            setLoadingAvailableSubjects(true);
            if (!activeSection) {
                toast.error('No section selected');
                return;
            }
            const subjects = await academicsService.getAvailableSubjects(activeSection.toString());
            setAvailableSubjects(subjects);
        } catch (err: any) {
            console.error('Failed to fetch available subjects:', err);
            toast.error(err.message || 'Failed to load available subjects');
            setAvailableSubjects([]);
        } finally {
            setLoadingAvailableSubjects(false);
        }
    };

    // Open add subjects modal
    const handleOpenAddSubjectModal = () => {
        setSelectedSubjectsToAdd([]);
        fetchAvailableSubjects();
        setShowAddSubjectModal(true);
    };

    // Handle removing subject from selected list (in modal)
    const handleRemoveFromSelectedList = (subjectId: string) => {
        setSelectedSubjectsToAdd(prev => prev.filter(s => s.id !== subjectId));
    };

    // Add selected subjects to section
    const handleAddSubjects = async () => {
        if (selectedSubjectsToAdd.length === 0) {
            toast.error('Please select at least one subject');
            return;
        }

        try {
            setLoadingSubjects(true);
            const subjectIds = selectedSubjectsToAdd.map(s => s.id);

            if (!activeSection) {
                toast.error('No section selected');
                return;
            }

            await academicsService.addSubjectsToSection(activeSection.toString(), subjectIds);

            toast.success('Subjects added successfully!');
            await fetchSectionSubjects();
            setShowAddSubjectModal(false);
            setSelectedSubjectsToAdd([]);
        } catch (err: any) {
            console.error('Error adding subjects:', err);
            toast.error(err.message || 'Failed to add subjects to section');
        } finally {
            setLoadingSubjects(false);
        }
    };

    // Handle remove subject from section
    const handleRemoveSubject = (subject: Subject) => {
        setSelectedSubjectToRemove(subject);
        setSubjectActionsMenu(null);
        setShowRemoveSubjectConfirm(true);
    };

    // Confirm remove subject from section
    const confirmRemoveSubject = async () => {
        if (!selectedSubjectToRemove) return;

        try {
            setLoadingSubjects(true);

            if (!activeSection) {
                toast.error('No section selected');
                return;
            }

            await academicsService.removeSubjectFromSection(
                activeSection.toString(),
                selectedSubjectToRemove.id
            );

            toast.success('Subject removed successfully!');
            await fetchSectionSubjects();
            setShowRemoveSubjectConfirm(false);
            setSelectedSubjectToRemove(null);
        } catch (err: any) {
            console.error('Error removing subject:', err);
            toast.error(err.message || 'Failed to remove subject from section');
        } finally {
            setLoadingSubjects(false);
        }
    };

    // Handle subject actions menu click
    const handleSubjectMenuClick = (event: React.MouseEvent, subjectId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setSubjectMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setSubjectActionsMenu(subjectActionsMenu === subjectId ? null : subjectId);
    };

    // Get active section data
    const getActiveSectionData = (): Section | undefined => {
        return sections.find(s => s.id === activeSection);
    };

    const activeSectionData = getActiveSectionData();

    // Subject column definitions
    const subjectColumns: IColumn[] = [
        {
            key: 'subject_name',
            label: 'Subject Name',
            render: (value) => <span className="font-medium text-gray-900 dark:text-white">{value}</span>,
        },
        {
            key: 'subject_code',
            label: 'Code',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>,
        },
        {
            key: 'teachers',
            label: 'Teacher',
            render: (value) => (
                <span className="text-gray-600 dark:text-gray-400">
                    {value?.length > 0
                        ? value.map((t: any) => `${t.first_name} ${t.last_name}`).join(', ')
                        : 'Not Assigned'
                    }
                </span>
            ),
        },
        {
            key: 'credits',
            label: 'Credits',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Add Subject Button */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    onClick={handleOpenAddSubjectModal}
                >
                    <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Subject
                </Button>
            </div>

            {/* Subjects Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loadingSubjects ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin">
                            <div className="h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
                        </div>
                    </div>
                ) : sectionSubjects.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                        {subjectColumns.map((col) => (
                                            <th
                                                key={col.key}
                                                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                                style={{ width: col.width ? `${col.width}px` : 'auto' }}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sectionSubjects.map((subject) => (
                                        <tr
                                            key={subject.id}
                                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                        >
                                            {subjectColumns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className="px-4 py-3 text-sm text-gray-900 dark:text-white"
                                                >
                                                    {col.render ? col.render(subject[col.key], subject) : subject[col.key]}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={(e) => handleSubjectMenuClick(e, subject.id)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="More actions"
                                                >
                                                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="5" r="2" />
                                                        <circle cx="12" cy="12" r="2" />
                                                        <circle cx="12" cy="19" r="2" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Subject Actions Menu */}
                        {subjectActionsMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setSubjectActionsMenu(null)} />
                                <div
                                    className="fixed w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                                    style={{
                                        top: `${subjectMenuPosition.top}px`,
                                        right: `${subjectMenuPosition.right}px`,
                                    }}
                                >
                                    <button
                                        onClick={() => handleRemoveSubject(sectionSubjects.find(s => s.id === subjectActionsMenu)!)}
                                        className="w-full text-left px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2 rounded-lg text-orange-600 dark:text-orange-400"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Remove from Section
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">No subjects in this section</p>
                    </div>
                )}
            </div>

            {/* Add Subjects Modal */}
            {showAddSubjectModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAddSubjectModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
                            </svg>
                            Add Subjects to {activeSectionData?.section_name}
                        </h3>

                        <div className="space-y-4">
                            {/* Autocomplete for subject selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Subjects from {classData?.name}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search and select subjects..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onFocus={fetchAvailableSubjects}
                                        disabled={loadingAvailableSubjects || loadingSubjects}
                                        list="subjects-list"
                                    />
                                    <datalist id="subjects-list">
                                        {availableSubjects.map((subject) => (
                                            <option key={subject.id} value={`${subject.subject_name} (${subject.subject_code})`} />
                                        ))}
                                    </datalist>
                                    <div className="absolute right-2 top-2">
                                        {loadingAvailableSubjects && (
                                            <div className="animate-spin text-blue-500">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" opacity="0.3" />
                                                    <circle cx="12" cy="2" r="2" fill="currentColor" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {availableSubjects.length > 0 && (
                                    <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                        {availableSubjects.map((subject) => (
                                            <button
                                                key={subject.id}
                                                onClick={() => {
                                                    if (!selectedSubjectsToAdd.find(s => s.id === subject.id)) {
                                                        setSelectedSubjectsToAdd([...selectedSubjectsToAdd, subject]);
                                                    }
                                                }}
                                                disabled={selectedSubjectsToAdd.some(s => s.id === subject.id)}
                                                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">{subject.subject_name}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{subject.subject_code} • {subject.credits || 1} Credits</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {availableSubjects.length === 0 && !loadingAvailableSubjects && (
                                    <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            ⚠️ All subjects from {classData?.name} are already added to this section.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Selected Subjects List */}
                            {selectedSubjectsToAdd.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Selected Subjects ({selectedSubjectsToAdd.length})
                                    </p>
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600 max-h-48 overflow-y-auto">
                                        {selectedSubjectsToAdd.map((subject) => (
                                            <div key={subject.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">{subject.subject_name}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{subject.subject_code} • {subject.credits || 1} Credits</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFromSelectedList(subject.id)}
                                                    className="ml-3 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddSubjectModal(false);
                                    setSelectedSubjectsToAdd([]);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddSubjects}
                                disabled={selectedSubjectsToAdd.length === 0 || loadingSubjects}
                            >
                                {loadingSubjects ? 'Adding...' : `Add ${selectedSubjectsToAdd.length} Subject(s)`}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Remove Subject Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showRemoveSubjectConfirm}
                title="Remove Subject from Section?"
                message={`Are you sure you want to remove "${selectedSubjectToRemove?.subject_name}" from this section? The subject will still exist in the system.`}
                type="warning"
                confirmText="Yes, Remove"
                cancelText="Cancel"
                isLoading={loadingSubjects}
                onConfirm={confirmRemoveSubject}
                onCancel={() => {
                    setShowRemoveSubjectConfirm(false);
                    setSelectedSubjectToRemove(null);
                }}
            />
        </div>
    );
};

export default SectionSubjects;
