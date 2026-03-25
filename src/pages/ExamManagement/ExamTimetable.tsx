/**
 * Exam Timetable Management
 * Create and manage exam schedules with class, section, subject, date, time, room, and invigilator
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
    FormInput,
    FormTextarea,
    Modal,
} from '@/components';
import { examService } from '@/services/modules/examService';
import { classService } from '@/services/modules/classService';
import { subjectService } from '@/services/modules/subjectService';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/permissions';
import { useAuthStore } from '@/stores/authStore';

interface IExamTimetableEntry {
    id: number;
    exam_type_id: number;
    class_id: number;
    section_id?: number | null;
    subject_id: number;
    exam_date: string;
    start_time: string;
    end_time: string;
    duration_minutes?: number;
    room?: string;
    invigilator_id?: number | null;
    notes?: string;
    // Enriched fields from API
    exam_name?: string;
    class_name?: string;
    section_name?: string | null;
    subject_name?: string;
    invigilator_name?: string | null;
}

interface IFormData {
    exam_type_id: string;
    class_id: string;
    section_id: string;
    subject_id: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    notes: string;
}

interface IFormErrors {
    exam_type_id?: string;
    class_id?: string;
    subject_id?: string;
    exam_date?: string;
    start_time?: string;
    end_time?: string;
}

const INITIAL_FORM: IFormData = {
    exam_type_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    notes: '',
};

const ExamTimetable: FC = () => {
    const { hasPermission } = usePermissions();
    const canManage = hasPermission(Permission.MANAGE_EXAMS);
    const currentAcademicYear = useAuthStore(s => s.user?.current_academic_year);
    const academicYearVersion = useAuthStore(s => s.academicYearVersion);

    // Filter state
    const [filterExamType, setFilterExamType] = useState<string>('');
    const [filterClass, setFilterClass] = useState<string>('');
    const [filterSection, setFilterSection] = useState<string>('');

    // Data
    const [entries, setEntries] = useState<IExamTimetableEntry[]>([]);
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [filterSections, setFilterSections] = useState<any[]>([]);
    const [formSections, setFormSections] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    // Loading
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<IExamTimetableEntry | null>(null);
    const [formData, setFormData] = useState<IFormData>(INITIAL_FORM);
    const [formErrors, setFormErrors] = useState<IFormErrors>({});

    // Selection & Delete
    const [selectedRows, setSelectedRows] = useState<IExamTimetableEntry[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    // Fetch reference data on mount
    useEffect(() => {
        fetchExamTypes();
        fetchClasses();
    }, []);

    // Refetch timetable when academic year changes
    useEffect(() => {
        if (filterExamType && filterClass) {
            handleLoadTimetable();
        } else {
            setEntries([]);
        }
    }, [academicYearVersion]);

    // Fetch sections when filter class changes
    useEffect(() => {
        if (filterClass) {
            fetchSections(parseInt(filterClass), setFilterSections);
        } else {
            setFilterSections([]);
            setFilterSection('');
        }
    }, [filterClass]);

    // Fetch sections + subjects when form class changes
    useEffect(() => {
        if (formData.class_id) {
            fetchSections(parseInt(formData.class_id), setFormSections);
            fetchSubjects(formData.class_id);
        } else {
            setFormSections([]);
            setSubjects([]);
        }
    }, [formData.class_id]);


    const fetchExamTypes = async () => {
        try {
            const response = await examService.list();
            setExamTypes(response.data || response || []);
        } catch {
            toast.error('Failed to load exam types');
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await classService.list();
            setClasses(response.data || response || []);
        } catch {
            toast.error('Failed to load classes');
        }
    };

    const fetchSections = async (classId: number, setter: (s: any[]) => void) => {
        try {
            const sections = await classService.getSections(String(classId));
            setter(Array.isArray(sections) ? sections : []);
        } catch {
            setter([]);
        }
    };

    const fetchSubjects = async (classId: string) => {
        try {
            const response = await subjectService.listByClass(classId);
            const list = Array.isArray(response) ? response : (response.data || []);
            setSubjects(list);
        } catch {
            setSubjects([]);
        }
    };


    const handleLoadTimetable = async () => {
        if (!filterExamType || !filterClass) {
            toast.error('Please select Exam Type and Class');
            return;
        }

        setLoading(true);
        try {
            const filters: any = {
                exam_type_id: parseInt(filterExamType),
                class_id: parseInt(filterClass),
            };
            if (filterSection) filters.section_id = parseInt(filterSection);
            if (currentAcademicYear?.id) filters.academic_year_id = currentAcademicYear.id;

            const data = await examService.getExamTimetables(filters);
            setEntries(Array.isArray(data) ? data : (data?.data || []));
        } catch (err: any) {
            toast.error(err.message || 'Failed to load exam timetable');
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    // ──────────── Modal / Form ────────────

    const handleAddEntry = () => {
        setEditingEntry(null);
        setFormData({
            ...INITIAL_FORM,
            exam_type_id: filterExamType,
            class_id: filterClass,
            section_id: filterSection,
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEditEntry = (entry: IExamTimetableEntry) => {
        setEditingEntry(entry);
        setFormData({
            exam_type_id: String(entry.exam_type_id),
            class_id: String(entry.class_id),
            section_id: entry.section_id ? String(entry.section_id) : '',
            subject_id: String(entry.subject_id),
            exam_date: entry.exam_date,
            start_time: entry.start_time,
            end_time: entry.end_time,
            notes: entry.notes || '',
        });
        setFormErrors({});
        setShowModal(true);
    };

    const validateForm = (): boolean => {
        const errors: IFormErrors = {};

        if (!formData.exam_type_id) errors.exam_type_id = 'Exam type is required';
        if (!formData.class_id) errors.class_id = 'Class is required';
        if (!formData.subject_id) errors.subject_id = 'Subject is required';
        if (!formData.exam_date) errors.exam_date = 'Exam date is required';
        if (!formData.start_time) errors.start_time = 'Start time is required';
        if (!formData.end_time) {
            errors.end_time = 'End time is required';
        } else if (formData.start_time && formData.end_time <= formData.start_time) {
            errors.end_time = 'End time must be after start time';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload: any = {
                academic_year_id: currentAcademicYear?.id,
                exam_type_id: parseInt(formData.exam_type_id),
                class_id: parseInt(formData.class_id),
                section_id: formData.section_id ? parseInt(formData.section_id) : null,
                subject_id: parseInt(formData.subject_id),
                exam_date: formData.exam_date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                notes: formData.notes || null,
            };

            if (editingEntry) {
                await examService.updateExamTimetable(String(editingEntry.id), payload);
                toast.success('Timetable entry updated successfully');
            } else {
                await examService.createExamTimetable(payload);
                toast.success('Timetable entry created successfully');
            }

            setShowModal(false);
            setEditingEntry(null);
            setFormData(INITIAL_FORM);
            await handleLoadTimetable();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save timetable entry');
        } finally {
            setSubmitting(false);
        }
    };

    // ──────────── Delete ────────────

    const handleDelete = (id: number) => {
        setDeleteTarget(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await examService.deleteExamTimetable(String(deleteTarget));
            toast.success('Timetable entry deleted');
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            await handleLoadTimetable();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete');
        }
    };

    const handleBulkDelete = () => {
        if (selectedRows.length === 0) {
            toast.error('Please select entries to delete');
            return;
        }
        setShowBulkDeleteConfirm(true);
    };

    const confirmBulkDelete = async () => {
        try {
            await examService.bulkDeleteExamTimetables(selectedRows.map(r => r.id));
            toast.success(`${selectedRows.length} entry(ies) deleted`);
            setShowBulkDeleteConfirm(false);
            setSelectedRows([]);
            await handleLoadTimetable();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete');
        }
    };

    // ──────────── Helpers ────────────

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (t: string) => {
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    const getExamTypeName = (id: number) => examTypes.find(e => e.id === id)?.exam_name || `Exam ${id}`;

    // ──────────── Table columns ────────────

    const columns = [
        {
            key: 'subject_name',
            label: 'Subject',
            render: (value: string) => (
                <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            ),
        },
        {
            key: 'exam_date',
            label: 'Date',
            render: (value: string) => (
                <div className="text-sm text-gray-900 dark:text-white">{formatDate(value)}</div>
            ),
        },
        {
            key: 'time',
            label: 'Time',
            render: (_: any, row: IExamTimetableEntry) => (
                <div className="text-sm text-gray-900 dark:text-white">
                    {formatTime(row.start_time)} - {formatTime(row.end_time)}
                </div>
            ),
        },
        {
            key: 'duration_minutes',
            label: 'Duration',
            render: (value?: number) => (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {value ? `${value} min` : '-'}
                </div>
            ),
        },
{
            key: 'section_name',
            label: 'Section',
            render: (value?: string | null) => (
                value
                    ? <Badge variant="info" children={value} />
                    : <span className="text-gray-400 text-sm">All</span>
            ),
        },
    ];

    // Show loading spinner on initial load
    if (loading && entries.length === 0 && filterExamType && filterClass) {
        return <LoadingSpinner fullHeight message="Loading exam timetable..." />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Exam Timetable"
                subtitle="Create and manage exam schedules for classes"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Exam Management', href: '/exams' },
                    { label: 'Exam Timetable', href: '#' },
                ]}
            />

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <FormField label="Exam Type" required>
                        <FormSelect
                            value={filterExamType}
                            placeholder="Select Exam Type"
                            onChange={(e) => {
                                setFilterExamType(e.target.value);
                                setEntries([]);
                            }}
                            options={examTypes.map(e => ({ value: String(e.id), label: e.exam_name }))}
                        />
                    </FormField>

                    <FormField label="Class" required>
                        <FormSelect
                            value={filterClass}
                            placeholder="Select Class"
                            onChange={(e) => {
                                setFilterClass(e.target.value);
                                setFilterSection('');
                                setEntries([]);
                            }}
                            options={classes.map(c => ({ value: String(c.id), label: c.class_name }))}
                        />
                    </FormField>

                    <FormField label="Section (Optional)">
                        <FormSelect
                            value={filterSection}
                            placeholder="All Sections"
                            onChange={(e) => setFilterSection(e.target.value)}
                            options={filterSections.map(s => ({ value: String(s.id), label: s.section_name }))}
                            disabled={!filterClass}
                        />
                    </FormField>

                    <div className="flex gap-3 sm:col-span-2 lg:col-span-2 lg:justify-end items-end">
                        <Button
                            variant="primary"
                            onClick={handleLoadTimetable}
                            isLoading={loading}
                            loadingText="Loading..."
                            disabled={!filterExamType || !filterClass}
                        >
                            Load Timetable
                        </Button>

                        {canManage && filterExamType && filterClass && (
                            <Button variant="success" onClick={handleAddEntry}>
                                + Add Entry
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedRows.length > 0 && canManage && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                        {selectedRows.length} entr{selectedRows.length !== 1 ? 'ies' : 'y'} selected
                    </span>
                    <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                        Delete Selected
                    </Button>
                </div>
            )}

            {/* Timetable Table */}
            {filterExamType && filterClass ? (
                entries.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {getExamTypeName(parseInt(filterExamType))}
                                {' '} &rarr; {' '}
                                {classes.find(c => String(c.id) === filterClass)?.class_name}
                                {filterSection && ` → ${filterSections.find(s => String(s.id) === filterSection)?.section_name}`}
                                {' '} &mdash; {entries.length} subject{entries.length !== 1 ? 's' : ''} scheduled
                            </p>
                        </div>
                        <DataTable
                            columns={columns}
                            data={entries}
                            loading={loading}
                            onSelectionChange={canManage ? (selected) => {
                                setSelectedRows(selected as unknown as IExamTimetableEntry[]);
                            } : undefined}
                            actions={canManage ? (row: IExamTimetableEntry) => (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="info" onClick={() => handleEditEntry(row)}>
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
                                        Delete
                                    </Button>
                                </div>
                            ) : undefined}
                        />
                    </div>
                ) : loading ? (
                    <LoadingSpinner message="Loading timetable..." />
                ) : (
                    <EmptyState
                        icon="📅"
                        title="No Exam Timetable Found"
                        description="Click 'Load Timetable' to view or 'Add Entry' to create exam schedules."
                        action={canManage ? (
                            <Button variant="primary" onClick={handleAddEntry}>
                                + Create First Entry
                            </Button>
                        ) : undefined}
                    />
                )
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <p className="text-4xl mb-4">📅</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Select Exam Type and Class
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Choose an exam type and class, then click "Load Timetable" to view or create exam schedules.
                    </p>
                </div>
            )}

            {/* ───────── Add/Edit Modal ───────── */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingEntry(null);
                    setFormData(INITIAL_FORM);
                    setFormErrors({});
                }}
                title={editingEntry ? 'Edit Exam Timetable Entry' : 'Add Exam Timetable Entry'}
                size="lg"
            >
                <div className="space-y-4">
                    {/* Exam Type */}
                    <FormField label="Exam Type" required error={formErrors.exam_type_id}>
                        <FormSelect
                            value={formData.exam_type_id}
                            placeholder="Select Exam Type"
                            onChange={(e) => {
                                setFormData({ ...formData, exam_type_id: e.target.value });
                                setFormErrors({ ...formErrors, exam_type_id: undefined });
                            }}
                            options={examTypes.map(e => ({ value: String(e.id), label: e.exam_name }))}
                            disabled={!!editingEntry}
                        />
                    </FormField>

                    {/* Class & Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Class" required error={formErrors.class_id}>
                            <FormSelect
                                value={formData.class_id}
                                placeholder="Select Class"
                                onChange={(e) => {
                                    setFormData({ ...formData, class_id: e.target.value, section_id: '', subject_id: '' });
                                    setFormErrors({ ...formErrors, class_id: undefined });
                                }}
                                options={classes.map(c => ({ value: String(c.id), label: c.class_name }))}
                                disabled={!!editingEntry}
                            />
                        </FormField>

                        <FormField label="Section (Optional)">
                            <FormSelect
                                value={formData.section_id}
                                placeholder="All Sections"
                                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                                options={formSections.map(s => ({ value: String(s.id), label: s.section_name }))}
                                disabled={!formData.class_id || !!editingEntry}
                            />
                        </FormField>
                    </div>

                    {/* Subject — hide subjects already scheduled for this exam+class+section */}
                    <FormField label="Subject" required error={formErrors.subject_id}>
                        <FormSelect
                            value={formData.subject_id}
                            placeholder="Select Subject"
                            onChange={(e) => {
                                setFormData({ ...formData, subject_id: e.target.value });
                                setFormErrors({ ...formErrors, subject_id: undefined });
                            }}
                            options={subjects
                                .filter(s => {
                                    // When editing, always show the current subject
                                    if (editingEntry) return true;
                                    // When adding, hide subjects already in the timetable
                                    return !entries.some(e => e.subject_id === s.id);
                                })
                                .map(s => ({
                                    value: String(s.id),
                                    label: s.subject_name,
                                }))}
                            disabled={!formData.class_id || !!editingEntry}
                        />
                    </FormField>

                    {/* Date */}
                    <FormField label="Exam Date" required error={formErrors.exam_date}>
                        <FormInput
                            type="date"
                            value={formData.exam_date}
                            onChange={(e) => {
                                setFormData({ ...formData, exam_date: e.target.value });
                                setFormErrors({ ...formErrors, exam_date: undefined });
                            }}
                        />
                    </FormField>

                    {/* Start & End Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Start Time" required error={formErrors.start_time}>
                            <FormInput
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => {
                                    setFormData({ ...formData, start_time: e.target.value });
                                    setFormErrors({ ...formErrors, start_time: undefined });
                                }}
                            />
                        </FormField>

                        <FormField label="End Time" required error={formErrors.end_time}>
                            <FormInput
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => {
                                    setFormData({ ...formData, end_time: e.target.value });
                                    setFormErrors({ ...formErrors, end_time: undefined });
                                }}
                            />
                        </FormField>
                    </div>

                    {/* Duration display */}
                    {formData.start_time && formData.end_time && formData.end_time > formData.start_time && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                            Duration: {(() => {
                                const [sh, sm] = formData.start_time.split(':').map(Number);
                                const [eh, em] = formData.end_time.split(':').map(Number);
                                const mins = (eh * 60 + em) - (sh * 60 + sm);
                                const h = Math.floor(mins / 60);
                                const m = mins % 60;
                                return h > 0 ? `${h}h ${m}m` : `${m}m`;
                            })()}
                        </div>
                    )}

                    {/* Notes */}
                    <FormField label="Notes (Optional)">
                        <FormTextarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="e.g., Bring calculator, Open book exam"
                            rows={2}
                        />
                    </FormField>

                    {/* Modal Footer */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowModal(false);
                                setEditingEntry(null);
                                setFormData(INITIAL_FORM);
                                setFormErrors({});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            isLoading={submitting}
                            loadingText="Saving..."
                        >
                            {editingEntry ? 'Update Entry' : 'Create Entry'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                type="danger"
                title="Delete Timetable Entry"
                message="Are you sure you want to delete this timetable entry? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
            />

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                type="danger"
                title="Delete Multiple Entries"
                message={`Are you sure you want to delete ${selectedRows.length} timetable entr${selectedRows.length !== 1 ? 'ies' : 'y'}?`}
                onConfirm={confirmBulkDelete}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />
        </div>
    );
};

export default ExamTimetable;
