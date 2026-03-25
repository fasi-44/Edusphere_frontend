import { FC, useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import AutocompleteSelect from '../../components/form/AutocompleteSelect';
import { teacherService } from '../../services/modules/teacherService';
import { subjectService } from '../../services/modules/subjectService';
import { classService } from '../../services/modules/classService';

interface GroupedSubjects {
    classId: number;
    className: string;
    subjects: { id: number; subject_name: string; subject_code: string }[];
}

const TeacherSubjectAssignment: FC = () => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [allSubjects, setAllSubjects] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [assignedSubjectIds, setAssignedSubjectIds] = useState<Set<number>>(new Set());
    const [checkedSubjectIds, setCheckedSubjectIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

    // Load teachers, subjects, and classes on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [teachersRes, subjectsRes, classesRes] = await Promise.all([
                    teacherService.list({ limit: 100 }),
                    subjectService.listAll(),
                    classService.list(),
                ]);
                setTeachers(teachersRes.data || []);
                setAllSubjects(subjectsRes || []);
                setClasses(classesRes || []);
            } catch (err: any) {
                toast.error(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch teacher's current assignments when selection changes
    useEffect(() => {
        if (!selectedTeacherId) {
            setAssignedSubjectIds(new Set());
            setCheckedSubjectIds(new Set());
            return;
        }

        const fetchAssignments = async () => {
            setLoadingAssignments(true);
            try {
                const ids = await teacherService.getSubjectIds(selectedTeacherId);
                const idSet = new Set(ids);
                setAssignedSubjectIds(idSet);
                setCheckedSubjectIds(new Set(idSet));
                // Expand classes that have assigned subjects
                const classIdsWithAssignments = new Set<number>();
                allSubjects.forEach((s) => {
                    if (idSet.has(s.id)) {
                        classIdsWithAssignments.add(s.class_id);
                    }
                });
                setExpandedClasses(classIdsWithAssignments);
            } catch (err: any) {
                toast.error(err.message || 'Failed to load teacher assignments');
            } finally {
                setLoadingAssignments(false);
            }
        };
        fetchAssignments();
    }, [selectedTeacherId, allSubjects]);

    // Group subjects by class
    const groupedSubjects: GroupedSubjects[] = useMemo(() => {
        const classMap = new Map<number, string>();
        classes.forEach((c: any) => {
            classMap.set(c.id, c.class_name || c.name || `Class ${c.id}`);
        });

        const groups = new Map<number, GroupedSubjects>();
        allSubjects.forEach((s: any) => {
            if (!groups.has(s.class_id)) {
                groups.set(s.class_id, {
                    classId: s.class_id,
                    className: classMap.get(s.class_id) || `Class ${s.class_id}`,
                    subjects: [],
                });
            }
            groups.get(s.class_id)!.subjects.push({
                id: s.id,
                subject_name: s.subject_name,
                subject_code: s.subject_code || '',
            });
        });

        return Array.from(groups.values()).sort((a, b) =>
            a.className.localeCompare(b.className, undefined, { numeric: true })
        );
    }, [allSubjects, classes]);

    // Check if there are changes
    const hasChanges = useMemo(() => {
        if (assignedSubjectIds.size !== checkedSubjectIds.size) return true;
        for (const id of assignedSubjectIds) {
            if (!checkedSubjectIds.has(id)) return true;
        }
        return false;
    }, [assignedSubjectIds, checkedSubjectIds]);

    // Count summary
    const changesSummary = useMemo(() => {
        const added = [...checkedSubjectIds].filter((id) => !assignedSubjectIds.has(id)).length;
        const removed = [...assignedSubjectIds].filter((id) => !checkedSubjectIds.has(id)).length;
        return { total: checkedSubjectIds.size, added, removed };
    }, [assignedSubjectIds, checkedSubjectIds]);

    const handleToggleSubject = useCallback((subjectId: number) => {
        setCheckedSubjectIds((prev) => {
            const next = new Set(prev);
            if (next.has(subjectId)) {
                next.delete(subjectId);
            } else {
                next.add(subjectId);
            }
            return next;
        });
    }, []);

    const handleToggleClass = useCallback((classId: number) => {
        setExpandedClasses((prev) => {
            const next = new Set(prev);
            if (next.has(classId)) {
                next.delete(classId);
            } else {
                next.add(classId);
            }
            return next;
        });
    }, []);

    const handleSelectAllInClass = useCallback((subjects: { id: number }[], checked: boolean) => {
        setCheckedSubjectIds((prev) => {
            const next = new Set(prev);
            subjects.forEach((s) => {
                if (checked) {
                    next.add(s.id);
                } else {
                    next.delete(s.id);
                }
            });
            return next;
        });
    }, []);

    const handleSave = async () => {
        if (!selectedTeacherId) return;
        setSaving(true);
        try {
            await teacherService.assignSubjects(selectedTeacherId, Array.from(checkedSubjectIds));
            setAssignedSubjectIds(new Set(checkedSubjectIds));
            toast.success('Subjects assigned successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign subjects');
        } finally {
            setSaving(false);
        }
    };

    const selectedTeacher = teachers.find(
        (t) => String(t.id) === selectedTeacherId
    );

    if (loading) {
        return <LoadingSpinner message="Loading data..." />;
    }

    return (
        <div>
            <PageHeader
                title="Assign Subjects to Teacher"
                subtitle="Select a teacher and assign subjects across classes"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Academics', href: '/academics/subjects' },
                    { label: 'Assign Subjects' },
                ]}
            />

            {/* Teacher Selection */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
                <AutocompleteSelect
                    label="Select Teacher"
                    placeholder="Search by name or employee ID..."
                    value={selectedTeacherId}
                    onChange={setSelectedTeacherId}
                    options={teachers.map((t) => ({
                        value: String(t.id),
                        label: `${t.first_name} ${t.last_name}${t.teacher?.employee_id ? ` (${t.teacher.employee_id})` : ''}`,
                    }))}
                    noResultsText="No teachers found"
                />
            </div>

            {/* Content Area */}
            {!selectedTeacherId ? (
                <EmptyState
                    title="No Teacher Selected"
                    message="Select a teacher from the dropdown above to manage their subject assignments."
                />
            ) : loadingAssignments ? (
                <LoadingSpinner message="Loading assignments..." />
            ) : (
                <>
                    {/* Teacher Info + Summary Bar */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20 mb-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                    Assigning subjects for:{' '}
                                    <span className="font-bold">
                                        {selectedTeacher?.first_name} {selectedTeacher?.last_name}
                                    </span>
                                    {selectedTeacher?.teacher?.employee_id && (
                                        <span className="ml-1 text-blue-700 dark:text-blue-300">
                                            ({selectedTeacher.teacher.employee_id})
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-blue-800 dark:text-blue-200">
                                    {changesSummary.total} selected
                                </span>
                                {hasChanges && (
                                    <span className="text-blue-600 dark:text-blue-300">
                                        ({changesSummary.added > 0 ? `+${changesSummary.added}` : ''}
                                        {changesSummary.added > 0 && changesSummary.removed > 0 ? ', ' : ''}
                                        {changesSummary.removed > 0 ? `-${changesSummary.removed}` : ''})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Subjects Grouped by Class */}
                    {groupedSubjects.length === 0 ? (
                        <EmptyState
                            title="No Subjects Found"
                            message="No subjects have been created yet. Create subjects first before assigning them."
                        />
                    ) : (
                        <div className="space-y-3">
                            {groupedSubjects.map((group) => {
                                const isExpanded = expandedClasses.has(group.classId);
                                const checkedCount = group.subjects.filter((s) =>
                                    checkedSubjectIds.has(s.id)
                                ).length;
                                const allChecked = checkedCount === group.subjects.length;
                                const someChecked = checkedCount > 0 && !allChecked;

                                return (
                                    <div
                                        key={group.classId}
                                        className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
                                    >
                                        {/* Class Header */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleClass(group.classId)}
                                            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <svg
                                                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                                        isExpanded ? 'rotate-90' : ''
                                                    }`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {group.className}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    ({group.subjects.length} subject{group.subjects.length !== 1 ? 's' : ''})
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {checkedCount}/{group.subjects.length} assigned
                                            </span>
                                        </button>

                                        {/* Subject Checkboxes */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-3">
                                                {/* Select All for this class */}
                                                <label className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={allChecked}
                                                        ref={(el) => {
                                                            if (el) el.indeterminate = someChecked;
                                                        }}
                                                        onChange={() =>
                                                            handleSelectAllInClass(group.subjects, !allChecked)
                                                        }
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        Select All
                                                    </span>
                                                </label>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {group.subjects.map((subject) => {
                                                        const isChecked = checkedSubjectIds.has(subject.id);
                                                        const wasAssigned = assignedSubjectIds.has(subject.id);
                                                        const isNew = isChecked && !wasAssigned;
                                                        const isRemoved = !isChecked && wasAssigned;

                                                        return (
                                                            <label
                                                                key={subject.id}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                                    isNew
                                                                        ? 'bg-green-50 dark:bg-green-900/20'
                                                                        : isRemoved
                                                                        ? 'bg-red-50 dark:bg-red-900/20'
                                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => handleToggleSubject(subject.id)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                                        {subject.subject_name}
                                                                    </span>
                                                                    {subject.subject_code && (
                                                                        <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                            ({subject.subject_code})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {isNew && (
                                                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                                                        new
                                                                    </span>
                                                                )}
                                                                {isRemoved && (
                                                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                                                        removed
                                                                    </span>
                                                                )}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                        {hasChanges && (
                            <button
                                type="button"
                                onClick={() => setCheckedSubjectIds(new Set(assignedSubjectIds))}
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
                                !hasChanges || saving
                                    ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-700'
                                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                            }`}
                        >
                            {saving ? 'Saving...' : 'Save Assignments'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherSubjectAssignment;
