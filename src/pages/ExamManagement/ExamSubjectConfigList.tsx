/**
 * Exam Subject Configuration List
 * Manage exam-subject configurations with modal-based editing
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    Badge,
    DataTable,
    LoadingSpinner,
    EmptyState,
    ConfirmDialog,
    FormField,
    FormSelect,
    Modal,
} from '@/components';
import { examService } from '@/services/modules/examService';
import { classService } from '@/services/modules/classService';
import { subjectService } from '@/services/modules/subjectService';
import ExamSubjectConfigForm from './ExamSubjectConfigForm';

interface IExamSubjectConfig {
    id?: number;
    exam_type_id: number;
    class_id: number;
    section_id?: number;
    subject_id: number;
    subject_name?: string;
    has_internal_external: boolean;
    internal_max_marks: number;
    external_max_marks: number;
    total_max_marks: number;
    min_passing_marks: number;
    weightage_percentage: number;
}

interface ISubject {
    id: number;
    subject_name: string;
    subject_code?: string;
}

const ExamSubjectConfigList: FC = () => {
    // Filters
    const [selectedExamType, setSelectedExamType] = useState<number | null>(null);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedSection, setSelectedSection] = useState<number | null>(null);

    // Data
    const [subjects, setSubjects] = useState<ISubject[]>([]);
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [configurations, setConfigurations] = useState<IExamSubjectConfig[]>([]);

    // Loading states
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<ISubject | null>(null);
    const [editingConfig, setEditingConfig] = useState<IExamSubjectConfig | null>(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch exam types and classes on mount
    useEffect(() => {
        fetchExamTypes();
        fetchClasses();
    }, []);

    // Fetch sections when class changes
    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
        } else {
            setSections([]);
        }
    }, [selectedClass]);

    const fetchExamTypes = async () => {
        try {
            const response = await examService.list();
            setExamTypes(response.data || response || []);
        } catch (err) {
            console.error('Failed to fetch exam types:', err);
            toast.error('Failed to load exam types');
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await classService.list();
            setClasses(response.data || response || []);
        } catch (err) {
            console.error('Failed to fetch classes:', err);
            toast.error('Failed to load classes');
        }
    };

    const fetchSections = async (classId: number) => {
        try {
            const sectionsData = await classService.getSections(String(classId));
            setSections(Array.isArray(sectionsData) ? sectionsData : []);
        } catch (err) {
            console.error('Failed to fetch sections:', err);
            setSections([]);
        }
    };

    const handleLoadSubjects = async () => {
        if (!selectedExamType || !selectedClass) {
            toast.error('Please select Exam Type and Class');
            return;
        }

        setLoadingSubjects(true);
        try {
            // Fetch subjects for the selected class
            const subjectsResponse = await subjectService.listByClass(String(selectedClass));
            const subjectsList: ISubject[] = (Array.isArray(subjectsResponse)
                ? subjectsResponse
                : (subjectsResponse.data || [])) as ISubject[];
            setSubjects(subjectsList);

            // Fetch existing configurations for this exam type and class
            const configsResponse = await examService.getExamConfigs({
                exam_type_id: selectedExamType,
                class_id: selectedClass,
                section_id: selectedSection || undefined,
            });
            setConfigurations(configsResponse.data || configsResponse || []);

            if (subjectsList.length === 0) {
                toast('No subjects found for this class', { icon: 'ℹ️' });
            }
        } catch (err) {
            console.error('Failed to fetch subjects and configurations:', err);
            toast.error('Failed to load subjects');
            setSubjects([]);
            setConfigurations([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const handleConfigureSubject = async (subject: ISubject) => {
        setSelectedSubject(subject);

        // Try to fetch existing configuration for this subject
        try {
            const response = await examService.getExamConfigs({
                exam_type_id: selectedExamType,
                class_id: selectedClass,
                section_id: selectedSection,
                subject_id: subject.id,
            });

            const existingConfig = response.data?.[0];
            if (existingConfig) {
                setEditingConfig(existingConfig);
            } else {
                setEditingConfig(null);
            }
        } catch (err) {
            console.error('Failed to fetch existing configuration:', err);
            setEditingConfig(null);
        }

        setShowModal(true);
    };

    const handleDeleteConfig = (configId: number) => {
        setDeleteTarget(configId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            await examService.deleteExamConfig(String(deleteTarget));
            toast.success('Configuration deleted successfully');
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            // Refresh subjects to update configurations
            if (selectedExamType && selectedClass) {
                await handleLoadSubjects();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete configuration');
        }
    };

    const handleModalClose = async () => {
        setShowModal(false);
        setSelectedSubject(null);
        setEditingConfig(null);
        // Refresh subjects to show updated configurations
        if (selectedExamType && selectedClass) {
            await handleLoadSubjects();
        }
    };

    const getExamTypeName = (examTypeId: number): string => {
        return examTypes.find(e => e.id === examTypeId)?.exam_name || `Exam ${examTypeId}`;
    };

    const getClassName = (classId: number): string => {
        return classes.find(c => c.id === classId)?.class_name || `Class ${classId}`;
    };

    // Table columns
    const columns = [
        {
            key: 'subject_name',
            label: 'Subject',
            render: (value: string) => (
                <div className="font-medium text-gray-900 dark:text-white">
                    {value}
                </div>
            ),
        },
        {
            key: 'total_max_marks',
            label: 'Total Marks',
            render: (value?: number) => (
                <div className="text-center text-gray-900 dark:text-white">
                    {value ? value : <span className="text-gray-400 dark:text-gray-500">-</span>}
                </div>
            ),
        },
        {
            key: 'min_passing_marks',
            label: 'Passing Marks',
            render: (value?: number) => (
                <div className="text-center text-gray-900 dark:text-white">
                    {value ? value : <span className="text-gray-400 dark:text-gray-500">-</span>}
                </div>
            ),
        },
        {
            key: 'marks_breakdown',
            label: 'Breakdown',
            render: (_value?: any, row?: any) => {
                if (!row || !row.has_internal_external) {
                    return <span className="text-gray-400 dark:text-gray-500">-</span>;
                }
                return (
                    <div className="text-center text-gray-900 dark:text-white">
                        <span className="text-sm">Int: {row.internal_max_marks} / Ext: {row.external_max_marks}</span>
                    </div>
                );
            },
        },
        {
            key: 'has_internal_external',
            label: 'Scheme',
            render: (value?: boolean) => {
                if (value === undefined || value === null) {
                    return <Badge variant="secondary" children="Not Configured" />;
                }
                return value ? (
                    <Badge variant="info" children="Internal-External" />
                ) : (
                    <Badge variant="secondary" children="Single" />
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Exam Subject Configuration"
                subtitle="Configure subjects, marks, and internal/external splits for exams"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Exams Types & Configs', href: '/exams' },
                    { label: 'Subject Config', href: '#' },
                ]}
            />

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    {/* Exam Type Filter */}
                    <FormField label="Exam Type" required>
                        <FormSelect
                            value={selectedExamType?.toString() || ''}
                            placeholder="Select Exam Type"
                            onChange={(e) => {
                                setSelectedExamType(e.target.value ? parseInt(e.target.value) : null);
                                setSubjects([]);
                                setConfigurations([]);
                            }}
                            options={examTypes.map((exam) => ({
                                value: exam.id.toString(),
                                label: exam.exam_name,
                            }))}
                        />
                    </FormField>

                    {/* Class Filter */}
                    <FormField label="Class" required>
                        <FormSelect
                            value={selectedClass?.toString() || ''}
                            placeholder="Select Class"
                            onChange={(e) => {
                                setSelectedClass(e.target.value ? parseInt(e.target.value) : null);
                                setSelectedSection(null);
                                setSubjects([]);
                                setConfigurations([]);
                            }}
                            options={classes.map((cls) => ({
                                value: cls.id.toString(),
                                label: cls.class_name,
                            }))}
                        />
                    </FormField>

                    {/* Section Filter (Optional) */}
                    <FormField label="Section (Optional)">
                        <FormSelect
                            value={selectedSection?.toString() || ''}
                            placeholder="All Sections"
                            onChange={(e) => {
                                setSelectedSection(e.target.value ? parseInt(e.target.value) : null);
                            }}
                            options={sections.map((section) => ({
                                value: section.id.toString(),
                                label: section.section_name,
                            }))}
                            disabled={!selectedClass}
                        />
                    </FormField>
                </div>

                {/* Load Button */}
                <div className="mt-4">
                    <Button
                        variant="primary"
                        onClick={handleLoadSubjects}
                        isLoading={loadingSubjects}
                        loadingText="Loading Subjects..."
                        disabled={!selectedExamType || !selectedClass}
                    >
                        Load Subjects
                    </Button>
                </div>
            </div>

            {/* Subjects Table */}
            {selectedExamType && selectedClass ? (
                <>
                    {subjects.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {getExamTypeName(selectedExamType)} → {getClassName(selectedClass)}
                                    {selectedSection && ` → Section ${sections.find(s => s.id === selectedSection)?.section_name}`}
                                </p>
                            </div>
                            <DataTable
                                columns={columns}
                                data={subjects.map((subject) => {
                                    // Find if this subject has a configuration
                                    const config = configurations.find(c => c.subject_id === subject.id);
                                    return {
                                        id: subject.id,
                                        subject_name: subject.subject_name,
                                        total_max_marks: config?.total_max_marks,
                                        min_passing_marks: config?.min_passing_marks,
                                        has_internal_external: config?.has_internal_external,
                                        internal_max_marks: config?.internal_max_marks,
                                        external_max_marks: config?.external_max_marks,
                                        config_id: config?.id,
                                    };
                                })}
                                loading={false}
                                actions={(row: any) => (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant={row.config_id ? "secondary" : "primary"}
                                            onClick={() => {
                                                const subject = subjects.find(s => s.id === row.id);
                                                if (subject) {
                                                    handleConfigureSubject(subject);
                                                }
                                            }}
                                        >
                                            {row.config_id ? "Edit" : "Configure"}
                                        </Button>
                                        {row.config_id && (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDeleteConfig(row.config_id)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                    ) : loadingSubjects ? (
                        <LoadingSpinner message="Loading subjects..." />
                    ) : (
                        <EmptyState
                            icon="📚"
                            title="No Subjects Found"
                            description="Click 'Load Subjects' to view subjects for the selected class"
                        />
                    )}
                </>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <p className="text-4xl mb-4">📋</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Select Exam Type and Class
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Choose an exam type and class, then click "Load Subjects" to view and configure subjects.
                    </p>
                </div>
            )}

            {/* Configuration Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleModalClose}
                title={editingConfig ? `Edit Configuration: ${selectedSubject?.subject_name}` : `Configure: ${selectedSubject?.subject_name}`}
                size="lg"
            >
                {selectedExamType && selectedClass && selectedSubject && (
                    <ExamSubjectConfigForm
                        examTypeId={selectedExamType}
                        classId={selectedClass}
                        sectionId={selectedSection ?? undefined}
                        subjectId={selectedSubject.id}
                        existingConfig={editingConfig}
                        onSuccess={handleModalClose}
                        onCancel={handleModalClose}
                    />
                )}
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                type="danger"
                title="Delete Configuration"
                message="Are you sure you want to delete this configuration?"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
            />
        </div>
    );
};

export default ExamSubjectConfigList;
