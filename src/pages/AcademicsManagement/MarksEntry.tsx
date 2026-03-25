/**
 * Marks Entry Page
 * Complete marks entry system with exam configuration, student list, and marks submission
 */

import { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, FormField, FormSelect, Button, LoadingSpinner, EmptyState, ConfirmDialog, Badge } from '../../components';
import { MarksEntryTable } from '../../components/academics';
import { academicsService } from '../../services/modules/academicsService';
import { IExamConfig, IStudentWithMarks, IStudentMarkEntry } from '../../types/index';
import { useAuthStore } from '../../stores/authStore';

const MarksEntry: FC = () => {
    const navigate = useNavigate();
    const { user, academicYearVersion } = useAuthStore();
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');

    // Data states
    const [examConfig, setExamConfig] = useState<IExamConfig | null>(null);
    const [students, setStudents] = useState<IStudentWithMarks[]>([]);
    const [marksData, setMarksData] = useState<Record<string, IStudentMarkEntry>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Loading & UI states
    const [loading, setLoading] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkDialogType, setBulkDialogType] = useState<'absent' | 'present' | 'clear'>('absent');

    // ============================================
    // Fetch Functions
    // ============================================

    const fetchExamTypes = useCallback(async () => {
        try {
            const data = await academicsService.fetchExamTypes();
            setExamTypes(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch exam types');
        }
    }, []);

    const fetchClasses = useCallback(async () => {
        try {
            const data = await academicsService.fetchClasses();
            setClasses(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch classes');
        }
    }, []);

    const fetchSections = useCallback(async (classId: string) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const data = await academicsService.fetchSections(classId);
            setSections(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch sections');
            setSections([]);
        }
    }, []);

    const fetchSubjects = useCallback(async (sectionId: string) => {
        if (!sectionId) {
            setSubjects([]);
            return;
        }
        try {
            const data = await academicsService.fetchSectionSubjects(sectionId);
            setSubjects(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch subjects');
            setSubjects([]);
        }
    }, []);

    const fetchExamConfigAndStudents = useCallback(async () => {
        if (!selectedExam || !selectedClass || !selectedSection || !selectedSubject) {
            return;
        }

        try {
            setLoading(true);

            // Fetch exam configuration
            const configData = await academicsService.fetchExamConfig({
                examTypeId: selectedExam,
                classId: selectedClass,
                subjectId: selectedSubject,
            });

            if (!configData || configData.length === 0) {
                toast.error('No configuration found for this exam-subject combination. Please configure first.');
                setExamConfig(null);
                setStudents([]);
                setLoading(false);
                return;
            }

            // Find config - prioritize section-specific, fallback to class-level
            let config = configData.find((c: any) => c.section_id === parseInt(selectedSection) || String(c.section_id) === selectedSection);
            if (!config) {
                config = configData.find((c: any) => c.section_id === null);
            }

            if (!config) {
                toast.error('No configuration found for this section or class. Please configure first.');
                setExamConfig(null);
                setStudents([]);
                setLoading(false);
                return;
            }

            setExamConfig(config);


            const authUser = useAuthStore.getState().user;
            if (!authUser) {
                toast.error('User not authenticated');
                return;
            }
            // Fetch students with marks
            const studentsData = await academicsService.fetchStudentsWithMarks(
                config.id,
                selectedSection,
                authUser.current_academic_year.id.toString(),
            );

            if (!studentsData || studentsData.length === 0) {
                toast('No students found in this section', { icon: '⚠️' });
            }

            setStudents(studentsData || []);

            // Initialize marks data
            const initialMarksData: Record<string, IStudentMarkEntry> = {};
            (studentsData || []).forEach((student) => {
                initialMarksData[student.student_id] = {
                    student_id: student.student_id,
                    internal_marks: student.existing_marks?.internal_marks || 0,
                    external_marks: student.existing_marks?.external_marks || 0,
                    total_marks: student.existing_marks?.total_marks || 0,
                    is_absent: student.existing_marks?.is_absent || false,
                    remarks: student.existing_marks?.remarks || '',
                };
            });
            setMarksData(initialMarksData);
            setHasUnsavedChanges(false);
        } catch (error: any) {
            console.error('Error fetching exam data:', error);
            toast.error(error.message || 'Failed to fetch exam configuration or students');
            setExamConfig(null);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [selectedExam, selectedClass, selectedSection, selectedSubject, user?.current_academic_year?.id]);

    // ============================================
    // Event Handlers
    // ============================================

    useEffect(() => {
        fetchExamTypes();
        fetchClasses();
    }, [fetchExamTypes, fetchClasses, academicYearVersion]);

    useEffect(() => {
        if (selectedClass) {
            setSelectedSection('');
            setSections([]);
            setSubjects([]);
            setExamConfig(null);
            setStudents([]);
            setMarksData({});
            fetchSections(selectedClass);
        }
    }, [selectedClass, fetchSections]);

    useEffect(() => {
        if (selectedSection) {
            setSelectedSubject('');
            setSubjects([]);
            setExamConfig(null);
            setStudents([]);
            setMarksData({});
            fetchSubjects(selectedSection);
        }
    }, [selectedSection, fetchSubjects]);

    useEffect(() => {
        if (selectedExam && selectedClass && selectedSection && selectedSubject) {
            fetchExamConfigAndStudents();
        }
    }, [selectedExam, selectedClass, selectedSection, selectedSubject, fetchExamConfigAndStudents]);

    const handleMarksChange = (studentId: string, field: string, value: any) => {
        setMarksData((prev) => {
            const updated = { ...prev };
            const studentMarks = { ...updated[studentId] };

            // Convert to number for numeric fields
            if (field === 'internal_marks' || field === 'external_marks' || field === 'total_marks') {
                (studentMarks as Record<string, unknown>)[field] = Number(value) || 0;
            } else {
                (studentMarks as Record<string, unknown>)[field] = value;
            }

            // Auto-calculate total if internal/external split
            if (examConfig?.has_internal_external && (field === 'internal_marks' || field === 'external_marks')) {
                studentMarks.total_marks = studentMarks.internal_marks + studentMarks.external_marks;
            }

            // Clear marks if absent
            if (field === 'is_absent' && value) {
                studentMarks.internal_marks = 0;
                studentMarks.external_marks = 0;
                studentMarks.total_marks = 0;
            }

            updated[studentId] = studentMarks;
            setHasUnsavedChanges(true);
            return updated;
        });
    };

    const validateMarks = (studentMarks: IStudentMarkEntry): string[] => {
        const errors: string[] = [];

        if (!examConfig) return errors;

        if (examConfig.has_internal_external) {
            if (studentMarks.internal_marks > (examConfig.internal_max_marks || 0)) {
                errors.push(`Internal marks exceed maximum (${examConfig.internal_max_marks})`);
            }
            if (studentMarks.external_marks > (examConfig.external_max_marks || 0)) {
                errors.push(`External marks exceed maximum (${examConfig.external_max_marks})`);
            }
        }

        if (studentMarks.total_marks > examConfig.total_max_marks) {
            errors.push(`Total marks exceed maximum (${examConfig.total_max_marks})`);
        }

        return errors;
    };

    const handleBulkOperation = () => {
        const updated = { ...marksData };

        if (bulkDialogType === 'absent') {
            Object.keys(updated).forEach((studentId) => {
                updated[studentId] = {
                    ...updated[studentId],
                    is_absent: true,
                    internal_marks: 0,
                    external_marks: 0,
                    total_marks: 0,
                };
            });
            toast.success('All students marked as absent');
        } else if (bulkDialogType === 'present') {
            Object.keys(updated).forEach((studentId) => {
                updated[studentId] = {
                    ...updated[studentId],
                    is_absent: false,
                };
            });
            toast.success('All students marked as present');
        } else if (bulkDialogType === 'clear') {
            Object.keys(updated).forEach((studentId) => {
                updated[studentId] = {
                    student_id: studentId,
                    internal_marks: 0,
                    external_marks: 0,
                    total_marks: 0,
                    is_absent: false,
                    remarks: '',
                };
            });
            toast('All marks cleared', { icon: 'ℹ️' });
        }

        setMarksData(updated);
        setHasUnsavedChanges(true);
        setBulkDialogOpen(false);
    };

    const handleSaveMarks = async () => {
        if (!examConfig) {
            toast.error('Missing required information');
            return;
        }

        const authUser = useAuthStore.getState().user;
        if (!authUser) {
            toast.error('User not authenticated');
            return;
        }

        try {
            setLoading(true);

            const marksArray = Object.keys(marksData).map((studentId) => ({
                ...marksData[studentId],
                student_id: studentId,
            }));

            // Validate all marks
            let hasErrors = false;
            marksArray.forEach((marks, index) => {
                if (!marks.is_absent) {
                    const errors = validateMarks(marks);
                    if (errors.length > 0) {
                        toast.error(`Student ${index + 1}: ${errors.join(', ')}`);
                        hasErrors = true;
                    }
                }
            });

            if (hasErrors) {
                setLoading(false);
                return;
            }

            await academicsService.submitMarks(
                {
                    exam_config_id: examConfig.id,
                    marks_data: marksArray,
                    is_draft: false,
                    teacher_id: String(authUser.school_user_id),
                },
                authUser.current_academic_year.id.toString()
            );

            toast.success('Marks saved successfully');
            setHasUnsavedChanges(false);
            setSelectedExam('');
            setSelectedClass('');
            setSelectedSection('');
            setSelectedSubject('');
            setExamConfig(null);
            setStudents([]);
            setMarksData({});
        } catch (error: any) {
            console.error('Error saving marks:', error);
            toast.error(error.message || 'Failed to save marks');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const present = Object.values(marksData).filter((m) => !m.is_absent).length;
        const absent = Object.values(marksData).filter((m) => m.is_absent).length;
        const passing = Object.values(marksData).filter(
            (m) => !m.is_absent && m.total_marks >= (examConfig?.min_passing_marks || 0)
        ).length;

        return { present, absent, passing };
    };

    const stats = calculateStats();

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Academics', href: '/academics' },
        { label: 'Marks Entry', href: '#' },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Marks Entry"
                subtitle="Enter and manage student exam marks"
                breadcrumbs={breadcrumbs}
            />

            {/* Loading State */}
            {loading && <LoadingSpinner message="Loading marks data..." fullHeight />}

            {!loading && (
                <>
                    {/* Filter Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Select Exam & Class
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Exam Type Filter */}
                            <FormField label="Exam *" required>
                                <FormSelect
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                    options={examTypes.map((exam) => ({
                                        label: exam.exam_name || exam.name,
                                        value: exam.id,
                                    }))}
                                    placeholder="Select Exam"
                                />
                            </FormField>

                            {/* Class Filter */}
                            <FormField label="Class *" required>
                                <FormSelect
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    options={classes.map((cls) => ({
                                        label: cls.class_name || cls.name,
                                        value: cls.id,
                                    }))}
                                    placeholder="Select Class"
                                />
                            </FormField>

                            {/* Section Filter */}
                            <FormField label="Section *" required>
                                <FormSelect
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    options={sections.map((section) => ({
                                        label: section.section_name || section.name,
                                        value: section.id,
                                    }))}
                                    placeholder="Select Section"
                                    disabled={!selectedClass}
                                />
                            </FormField>

                            {/* Subject Filter */}
                            <FormField label="Subject *" required>
                                <FormSelect
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    options={subjects.map((subject) => ({
                                        label: subject.subject_name || subject.name,
                                        value: subject.id,
                                    }))}
                                    placeholder="Select Subject"
                                    disabled={!selectedSection}
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Exam Configuration Info */}
                    {examConfig && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Configuration Details */}
                                <div>
                                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">Configuration</p>
                                    <div className="text-gray-900 dark:text-white space-y-1">
                                        <p>
                                            <strong>Max Marks:</strong> {examConfig.total_max_marks}
                                        </p>
                                        <p>
                                            <strong>Min Passing:</strong> {examConfig.min_passing_marks}
                                        </p>
                                        {examConfig.has_internal_external && (
                                            <>
                                                <p>
                                                    <strong>Internal:</strong> {examConfig.internal_max_marks}
                                                </p>
                                                <p>
                                                    <strong>External:</strong> {examConfig.external_max_marks}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div>
                                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">Statistics</p>
                                    <div className="flex flex-wrap gap-3">
                                        <Badge variant="primary" size="md">Present: {stats.present}</Badge>
                                        <Badge variant="danger" size="md">Absent: {stats.absent}</Badge>
                                        <Badge variant="success" size="md">Passing: {stats.passing}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Marks Entry Table */}
                    {students.length > 0 && examConfig && (
                        <div className="space-y-4">
                            {/* Table Toolbar */}
                            <div className="flex flex-wrap gap-2 justify-between">
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setBulkDialogType('absent');
                                            setBulkDialogOpen(true);
                                        }}
                                    >
                                        Mark All Absent
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setBulkDialogType('present');
                                            setBulkDialogOpen(true);
                                        }}
                                    >
                                        Mark All Present
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setBulkDialogType('clear');
                                            setBulkDialogOpen(true);
                                        }}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={fetchExamConfigAndStudents}
                                >
                                    Refresh
                                </Button>
                            </div>

                            {/* Marks Entry Table Component */}
                            <MarksEntryTable
                                examConfig={examConfig}
                                students={students}
                                marksData={marksData}
                                onMarksChange={handleMarksChange}
                                loading={loading}
                            />

                            {/* Action Button */}
                            <div className="flex justify-end">
                                <Button
                                    variant="primary"
                                    onClick={handleSaveMarks}
                                    disabled={!hasUnsavedChanges || loading}
                                    isLoading={loading}
                                    loadingText="Saving..."
                                >
                                    Save Marks
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Tips Section */}
                    {students.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                <strong>💡 Tips:</strong> Click on marks fields to enter values. Totals are calculated
                                automatically if internal/external split is enabled. Use the Tab key to navigate quickly
                                between fields.
                            </p>
                        </div>
                    )}

                    {/* No Configuration Found State */}
                    {!examConfig && selectedExam && selectedClass && selectedSection && selectedSubject && (
                        <EmptyState
                            icon="⚙️"
                            title="No Configuration Found"
                            description="This exam-subject combination is not configured yet. Please configure it first."
                            action={
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/exams/configs')}
                                >
                                    Configure Now
                                </Button>
                            }
                        />
                    )}

                    {/* Get Started State */}
                    {(!selectedExam || !selectedClass || !selectedSection || !selectedSubject) && (
                        <EmptyState
                            icon="📝"
                            title="Get Started"
                            description="Select exam, class, section, and subject to start entering marks"
                        />
                    )}
                </>
            )}

            {/* Bulk Operation Confirmation Dialog */}
            <ConfirmDialog
                isOpen={bulkDialogOpen}
                title={
                    bulkDialogType === 'absent'
                        ? 'Mark All Students as Absent'
                        : bulkDialogType === 'present'
                            ? 'Mark All Students as Present'
                            : 'Clear All Marks'
                }
                message={
                    bulkDialogType === 'absent'
                        ? 'Are you sure you want to mark all students as absent? All marks will be cleared.'
                        : bulkDialogType === 'present'
                            ? 'Are you sure you want to mark all students as present?'
                            : 'Are you sure you want to clear all marks? This cannot be undone.'
                }
                type={bulkDialogType === 'clear' ? 'danger' : 'info'}
                confirmText={bulkDialogType === 'clear' ? 'Clear' : 'Confirm'}
                onConfirm={handleBulkOperation}
                onCancel={() => setBulkDialogOpen(false)}
            />
        </div>
    );
};

export default MarksEntry;
