import React, { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button, LoadingSpinner, Badge, ConfirmDialog } from '../../components';
import { syllabusService } from '../../services/modules/syllabusService';
import { classService } from '../../services/modules/classService';
import { sectionService } from '../../services/modules/sectionService';
import { ISyllabus, ILesson, ITopic, ISubtopic, SyllabusStatus, ISyllabusTeacherProgress, ITeacherSyllabusAssignment } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';
import LessonFormModal from './LessonFormModal';
import TopicFormModal from './TopicFormModal';
import SubtopicFormModal from './SubtopicFormModal';
import ConfigureTimelineModal from './ConfigureTimelineModal';

// Icons
const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

const ChevronDownIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
);

const CircleIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
);

const InProgressCircleIcon = () => (
    <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
        <circle cx="12" cy="12" r="5" fill="currentColor" />
    </svg>
);

const getStatusIcon = (status: SyllabusStatus) => {
    switch (status) {
        case SyllabusStatus.COMPLETED:
            return <CheckCircleIcon />;
        case SyllabusStatus.IN_PROGRESS:
            return <InProgressCircleIcon />;
        default:
            return <CircleIcon />;
    }
};

const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const SmallSpinner = () => (
    <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

// Timeline helper icons
const CalendarIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PlayIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// Date formatting helper
const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
};

const isOverdue = (endDate?: string | null, status?: string): boolean => {
    if (!endDate || status === 'completed') return false;
    try {
        const end = new Date(endDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return end < today;
    } catch {
        return false;
    }
};

// Date range chip for lessons and topics
const DateRangeChip: FC<{
    plannedStart?: string | null;
    plannedEnd?: string | null;
    actualStart?: string | null;
    actualEnd?: string | null;
    status?: string;
}> = ({ plannedStart, plannedEnd, actualStart, actualEnd, status }) => {
    if (!plannedStart && !plannedEnd && !actualStart && !actualEnd) return null;

    const overdue = isOverdue(plannedEnd, status);

    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            overdue
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
            <CalendarIcon />
            {plannedStart || actualStart ? formatDate(plannedStart || actualStart) : '?'}
            {' - '}
            {plannedEnd || actualEnd ? formatDate(plannedEnd || actualEnd) : '?'}
            {actualStart && plannedStart && (
                <span className="text-green-600 dark:text-green-400 ml-0.5" title={`Started ${formatDate(actualStart)}`}>
                    (started {formatDate(actualStart)})
                </span>
            )}
            {overdue && <span className="font-medium ml-0.5">Overdue</span>}
        </span>
    );
};

// Detailed timeline info for admin view
const TimelineDetail: FC<{
    item: any;
    showDates?: boolean;
    showNotes?: boolean;
}> = ({ item, showDates, showNotes }) => {
    const hasDates = !!(item.planned_start_date || item.actual_start_date);
    if (!hasDates && !(showNotes && item.teacher_notes)) return null;

    return (
        <>
            {showDates && hasDates && (
                <div className="flex items-center gap-2 flex-wrap text-xs mt-1">
                    {(item.planned_start_date || item.planned_end_date) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            <CalendarIcon />
                            Planned: {formatDate(item.planned_start_date)} - {formatDate(item.planned_end_date)}
                        </span>
                    )}
                    {(item.actual_start_date || item.actual_end_date) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                            <CalendarIcon />
                            Actual: {formatDate(item.actual_start_date)} - {item.actual_end_date ? formatDate(item.actual_end_date) : 'Ongoing'}
                        </span>
                    )}
                    {isOverdue(item.planned_end_date, item.status) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">
                            Overdue
                        </span>
                    )}
                </div>
            )}
            {showNotes && item.teacher_notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5">
                    Notes: {item.teacher_notes}
                </p>
            )}
        </>
    );
};

// Timeline state helpers
const getTimelineState = (item: any) => {
    const status = item.status;
    const hasPlannedDates = !!(item.planned_start_date || item.planned_end_date);
    const isGrandfathered = (status === 'in_progress' || status === 'completed') && !hasPlannedDates;

    return {
        isUnconfigured: !hasPlannedDates && status !== 'in_progress' && status !== 'completed',
        isPlanned: status === 'planned' && hasPlannedDates,
        isStarted: status === 'in_progress',
        isCompleted: status === 'completed',
        isGrandfathered,
        canMarkProgress: status === 'in_progress' || status === 'completed',
    };
};

const ProgressBar: FC<{ percentage: number; className?: string }> = ({ percentage, className = '' }) => (
    <div className={`w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
        <div
            className={`h-full rounded-full transition-all duration-300 ${percentage >= 100 ? 'bg-green-500' : percentage > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
        />
    </div>
);

const getStatusBadgeVariant = (status: SyllabusStatus): 'success' | 'primary' | 'secondary' => {
    switch (status) {
        case SyllabusStatus.COMPLETED:
            return 'success';
        case SyllabusStatus.IN_PROGRESS:
            return 'primary';
        case SyllabusStatus.PLANNED:
        default:
            return 'secondary';
    }
};

const getStatusLabel = (status: SyllabusStatus): string => {
    switch (status) {
        case SyllabusStatus.COMPLETED:
            return 'Completed';
        case SyllabusStatus.IN_PROGRESS:
            return 'In Progress';
        case SyllabusStatus.PLANNED:
        default:
            return 'Planned';
    }
};

const SyllabusDetail: FC = () => {
    const { id: syllabusId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, academicYearVersion } = useAuthStore();
    const isTeacher = user?.role === 'TEACHER';
    const isAdminOrPrincipal = user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL';
    const { hasPermission } = usePermissions();

    const [syllabus, setSyllabus] = useState<ISyllabus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Teacher selector state (admin/principal only)
    const [teachers, setTeachers] = useState<ISyllabusTeacherProgress[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | 'combined' | null>(null);
    const [combinedTeacherIds, setCombinedTeacherIds] = useState<number[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    // Accordion states
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

    // Modal states
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showSubtopicModal, setShowSubtopicModal] = useState(false);

    const [editLesson, setEditLesson] = useState<ILesson | null>(null);
    const [editTopic, setEditTopic] = useState<ITopic | null>(null);
    const [editSubtopic, setEditSubtopic] = useState<ISubtopic | null>(null);

    const [parentLessonId, setParentLessonId] = useState<string | null>(null);
    const [parentTopicId, setParentTopicId] = useState<string | null>(null);

    // Delete dialog states
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'lesson' | 'topic' | 'subtopic'; id: string; title: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Progress marking state (teacher only)
    const [markingProgress, setMarkingProgress] = useState<string | null>(null);

    // Timeline configuration state (teacher only)
    const [showConfigureModal, setShowConfigureModal] = useState(false);
    const [configureTarget, setConfigureTarget] = useState<{
        itemType: 'lesson' | 'topic' | 'subtopic';
        itemId: string;
        itemTitle: string;
        existingDates?: { planned_start_date?: string; planned_end_date?: string; teacher_notes?: string };
    } | null>(null);
    const [startingItem, setStartingItem] = useState<string | null>(null);

    // Teacher assignment management state (admin/principal only)
    const [assignments, setAssignments] = useState<ITeacherSyllabusAssignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [assignFormClassId, setAssignFormClassId] = useState<number | ''>('');
    const [assignFormSectionId, setAssignFormSectionId] = useState<number | ''>('');
    const [assignFormTeacherId, setAssignFormTeacherId] = useState<number | ''>('');
    const [assigningSaving, setAssigningSaving] = useState(false);
    const [unassigningId, setUnassigningId] = useState<number | null>(null);
    const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
    const [unassignTarget, setUnassignTarget] = useState<ITeacherSyllabusAssignment | null>(null);
    const [classList, setClassList] = useState<{ id: number; class_name: string }[]>([]);
    const [sectionList, setSectionList] = useState<{ id: number; section_name: string }[]>([]);
    const [assignTeacherList, setAssignTeacherList] = useState<{ teacher_id: number; teacher_name: string }[]>([]);

    // Show detailed timeline when admin views a specific (non-combined) teacher
    const showDetailedTimeline = isAdminOrPrincipal && !!selectedTeacherId && selectedTeacherId !== 'combined';

    const fetchTeachers = async () => {
        if (!syllabusId || !isAdminOrPrincipal) return;

        try {
            setLoadingTeachers(true);
            const data = await syllabusService.fetchTeachersForSyllabus(syllabusId);
            setTeachers(data);
        } catch (err: any) {
            // Non-critical — silently fail, teachers list just won't show
            console.error('Failed to fetch teachers for syllabus:', err);
        } finally {
            setLoadingTeachers(false);
        }
    };

    const fetchAssignments = async () => {
        if (!syllabusId || !isAdminOrPrincipal) return;
        try {
            setLoadingAssignments(true);
            const data = await syllabusService.getAssignments(syllabusId);
            setAssignments(data);
        } catch (err: any) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoadingAssignments(false);
        }
    };

    const fetchClassesForAssign = async () => {
        try {
            const response = await classService.list();
            setClassList((response.data || response || []).map((c: any) => ({ id: c.id, class_name: c.class_name })));
        } catch (err: any) {
            console.error('Failed to fetch classes:', err);
        }
        // Also fetch teachers for this syllabus's subject
        if (syllabus?.subject_id) {
            try {
                const teacherData = await syllabusService.getTeachersBySubject(Number(syllabus.subject_id));
                setAssignTeacherList(teacherData);
            } catch (err: any) {
                console.error('Failed to fetch teachers by subject:', err);
            }
        }
    };

    const handleAssignClassChange = async (classId: number | '') => {
        setAssignFormClassId(classId);
        setAssignFormSectionId('');
        setAssignFormTeacherId('');
        setSectionList([]);
        if (!classId) return;
        try {
            const sections = await sectionService.getByClass(String(classId));
            setSectionList((sections || []).map((s: any) => ({ id: s.id, section_name: s.section_name })));
        } catch (err: any) {
            console.error('Failed to fetch sections:', err);
        }
    };

    const handleAssignTeacher = async () => {
        if (!syllabusId || !assignFormTeacherId || !assignFormSectionId) return;
        try {
            setAssigningSaving(true);
            await syllabusService.assignTeacher(syllabusId, assignFormTeacherId as number, assignFormSectionId as number);
            toast.success('Teacher assigned successfully');
            setShowAssignForm(false);
            setAssignFormClassId('');
            setAssignFormSectionId('');
            setAssignFormTeacherId('');
            fetchAssignments();
            fetchTeachers();
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign teacher');
        } finally {
            setAssigningSaving(false);
        }
    };

    const handleUnassignTeacher = async () => {
        if (!unassignTarget) return;
        try {
            setUnassigningId(unassignTarget.id);
            await syllabusService.unassignTeacher(unassignTarget.id);
            toast.success('Teacher unassigned successfully');
            setShowUnassignConfirm(false);
            setUnassignTarget(null);
            fetchAssignments();
            fetchTeachers();
        } catch (err: any) {
            toast.error(err.message || 'Failed to unassign teacher');
        } finally {
            setUnassigningId(null);
        }
    };

    const fetchSyllabusDetail = async (teacherId?: number | 'combined' | null, teacherIds?: number[]) => {
        if (!syllabusId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await syllabusService.fetchSyllabusDetail(
                syllabusId,
                true,
                teacherId ?? undefined,
                teacherId === 'combined' ? teacherIds : undefined
            );
            setSyllabus(data);
            setIsReadOnly(!!(data as any).is_read_only);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch syllabus details');
            toast.error('Failed to fetch syllabus details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSyllabusDetail(selectedTeacherId, combinedTeacherIds);
        fetchTeachers();
        fetchAssignments();
    }, [syllabusId, academicYearVersion]);

    const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value.startsWith('combined:')) {
            // combined:<teacher_id1>,<teacher_id2>,...
            const ids = value.replace('combined:', '').split(',').map(Number);
            setSelectedTeacherId('combined');
            setCombinedTeacherIds(ids);
            fetchSyllabusDetail('combined', ids);
        } else if (value) {
            const teacherId = Number(value);
            setSelectedTeacherId(teacherId);
            setCombinedTeacherIds([]);
            fetchSyllabusDetail(teacherId);
        } else {
            setSelectedTeacherId(null);
            setCombinedTeacherIds([]);
            fetchSyllabusDetail(null);
        }
    };

    const toggleLesson = (lessonId: string) => {
        setExpandedLessons((prev) => {
            const next = new Set(prev);
            if (next.has(lessonId)) {
                next.delete(lessonId);
            } else {
                next.add(lessonId);
            }
            return next;
        });
    };

    const toggleTopic = (topicId: string) => {
        setExpandedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topicId)) {
                next.delete(topicId);
            } else {
                next.add(topicId);
            }
            return next;
        });
    };

    // Progress toggle handler (teacher only)
    const handleToggleProgress = async (itemType: string, itemId: string, currentlyCompleted: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        const key = `${itemType}-${itemId}`;
        setMarkingProgress(key);
        try {
            await syllabusService.markProgress(itemType, itemId, !currentlyCompleted);
            toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} ${!currentlyCompleted ? 'completed' : 'reverted'}`);
            await fetchSyllabusDetail(selectedTeacherId, combinedTeacherIds);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update progress');
        } finally {
            setMarkingProgress(null);
        }
    };

    // Timeline Configure handler
    const handleConfigure = (itemType: 'lesson' | 'topic' | 'subtopic', item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfigureTarget({
            itemType,
            itemId: item.id,
            itemTitle: item.title,
            existingDates: {
                planned_start_date: item.planned_start_date || undefined,
                planned_end_date: item.planned_end_date || undefined,
                teacher_notes: item.teacher_notes || undefined,
            },
        });
        setShowConfigureModal(true);
    };

    const handleConfigureSuccess = () => {
        setShowConfigureModal(false);
        setConfigureTarget(null);
        fetchSyllabusDetail(selectedTeacherId, combinedTeacherIds);
    };

    // Timeline Start handler
    const handleStartItem = async (itemType: string, itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const key = `${itemType}-${itemId}`;
        setStartingItem(key);
        try {
            await syllabusService.startItem(itemType, itemId);
            toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} started`);
            await fetchSyllabusDetail(selectedTeacherId, combinedTeacherIds);
        } catch (err: any) {
            toast.error(err.message || 'Failed to start item');
        } finally {
            setStartingItem(null);
        }
    };

    // Lesson handlers
    const handleAddLesson = () => {
        setEditLesson(null);
        setShowLessonModal(true);
    };

    const handleEditLesson = (lesson: ILesson, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditLesson(lesson);
        setShowLessonModal(true);
    };

    const handleDeleteLesson = (lesson: ILesson, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteTarget({ type: 'lesson', id: lesson.id, title: lesson.title });
        setShowDeleteDialog(true);
    };

    // Topic handlers
    const handleAddTopic = (lessonId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setParentLessonId(lessonId);
        setEditTopic(null);
        setShowTopicModal(true);
    };

    const handleEditTopic = (topic: ITopic, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditTopic(topic);
        setShowTopicModal(true);
    };

    const handleDeleteTopic = (topic: ITopic, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteTarget({ type: 'topic', id: topic.id, title: topic.title });
        setShowDeleteDialog(true);
    };

    // Subtopic handlers
    const handleAddSubtopic = (topicId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setParentTopicId(topicId);
        setEditSubtopic(null);
        setShowSubtopicModal(true);
    };

    const handleEditSubtopic = (subtopic: ISubtopic, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditSubtopic(subtopic);
        setShowSubtopicModal(true);
    };

    const handleDeleteSubtopic = (subtopic: ISubtopic, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteTarget({ type: 'subtopic', id: subtopic.id, title: subtopic.title });
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeleteLoading(true);

            switch (deleteTarget.type) {
                case 'lesson':
                    await syllabusService.deleteLesson(deleteTarget.id);
                    toast.success('Lesson deleted successfully');
                    break;
                case 'topic':
                    await syllabusService.deleteTopic(deleteTarget.id);
                    toast.success('Topic deleted successfully');
                    break;
                case 'subtopic':
                    await syllabusService.deleteSubtopic(deleteTarget.id);
                    toast.success('Subtopic deleted successfully');
                    break;
            }

            setShowDeleteDialog(false);
            setDeleteTarget(null);
            fetchSyllabusDetail(selectedTeacherId, combinedTeacherIds);
        } catch (err: any) {
            toast.error(err.message || `Failed to delete ${deleteTarget.type}`);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleFormSuccess = () => {
        setShowLessonModal(false);
        setShowTopicModal(false);
        setShowSubtopicModal(false);
        setEditLesson(null);
        setEditTopic(null);
        setEditSubtopic(null);
        setParentLessonId(null);
        setParentTopicId(null);
        fetchSyllabusDetail(selectedTeacherId, combinedTeacherIds);
    };

    const isItemCompleted = (status: SyllabusStatus) => status === SyllabusStatus.COMPLETED;

    // Check if an item is editable by the current teacher
    const isItemEditable = (item: any) => {
        if (isReadOnly) return false;
        return item.editable !== false;
    };

    // Get "Completed by" label for items completed by another teacher
    const getCompletedByLabel = (item: any) => {
        return item.completed_by || null;
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: isTeacher ? 'My Syllabus Progress' : 'Syllabus Management', href: isTeacher ? '/syllabus/my-progress' : '/syllabus' },
        { label: syllabus?.title || 'Details' },
    ];

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading syllabus details..." />;
    }

    if (error || !syllabus) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-red-500 dark:text-red-400 mb-4">{error || 'Syllabus not found'}</p>
                    <Button variant="secondary" onClick={() => navigate('/syllabus')}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-0">
            <PageHeader
                title={syllabus.title}
                subtitle={syllabus.description}
                breadcrumbs={breadcrumbs}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="secondary"
                            leftIcon={<BackIcon />}
                            onClick={() => navigate('/syllabus')}
                        >
                            Back
                        </Button>
                        <Button
                            variant="secondary"
                            leftIcon={<ChartIcon />}
                            onClick={() => navigate(`/syllabus/${syllabusId}/analytics`)}
                        >
                            Analytics
                        </Button>
                        {hasPermission(Permission.MANAGE_SYLLABUS) && (
                            <Button
                                variant="primary"
                                leftIcon={<PlusIcon />}
                                onClick={handleAddLesson}
                            >
                                Add Lesson
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Syllabus Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Subject</span>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                            {syllabus.subject_name}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Academic Year</span>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                            {syllabus.academic_year_name || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                        <div className="mt-1">
                            <Badge variant={getStatusBadgeVariant(syllabus.status)}>
                                {getStatusLabel(syllabus.status)}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Overall Progress</span>
                        <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {syllabus.completion_percentage || 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                                    style={{ width: `${syllabus.completion_percentage || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teacher Selector (Admin/Principal only) */}
                {isAdminOrPrincipal && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-0 sm:min-w-[250px] max-w-md">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    View Teacher Progress
                                </label>
                                <select
                                    value={
                                        selectedTeacherId === 'combined'
                                            ? `combined:${combinedTeacherIds.join(',')}`
                                            : selectedTeacherId ?? ''
                                    }
                                    onChange={handleTeacherChange}
                                    disabled={loadingTeachers}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                >
                                    <option value="">-- Select a teacher --</option>
                                    {(() => {
                                        // Group teachers by section (backend now returns correct section
                                        // info from assignment records, so no frontend merging needed)
                                        const sectionGroups: Record<string, { label: string; teacherIds: number[]; teachers: typeof teachers }> = {};
                                        const ungrouped: typeof teachers = [];

                                        teachers.forEach((t) => {
                                            if (t.sections && t.sections.length > 0) {
                                                t.sections.forEach((sec) => {
                                                    const key = `${sec.class_id}-${sec.section_id}`;
                                                    if (!sectionGroups[key]) {
                                                        sectionGroups[key] = {
                                                            label: `${sec.class_name} - ${sec.section_name}`,
                                                            teacherIds: [],
                                                            teachers: []
                                                        };
                                                    }
                                                    if (!sectionGroups[key].teacherIds.includes(t.teacher_id)) {
                                                        sectionGroups[key].teacherIds.push(t.teacher_id);
                                                        sectionGroups[key].teachers.push(t);
                                                    }
                                                });
                                            } else {
                                                ungrouped.push(t);
                                            }
                                        });

                                        const groups = Object.values(sectionGroups);

                                        return (
                                            <>
                                                {groups.map((group) => (
                                                    <optgroup key={group.label} label={group.label}>
                                                        {group.teacherIds.length > 1 && (
                                                            <option value={`combined:${group.teacherIds.join(',')}`}>
                                                                Combined Progress ({group.label})
                                                            </option>
                                                        )}
                                                        {group.teachers.map((t) => (
                                                            <option key={t.teacher_id} value={t.teacher_id}>
                                                                {t.teacher_name} ({t.completion_percentage}% - {t.status}){t.is_active ? '' : ' (Former)'}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                                {ungrouped.length > 0 && (
                                                    <optgroup label="Other Teachers">
                                                        {ungrouped.map((t) => (
                                                            <option key={t.teacher_id} value={t.teacher_id}>
                                                                {t.teacher_name} ({t.completion_percentage}% - {t.status}){t.is_active ? '' : ' (Former)'}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </>
                                        );
                                    })()}
                                </select>
                            </div>
                            {selectedTeacherId && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <span className="text-sm text-blue-700 dark:text-blue-300">
                                        {selectedTeacherId === 'combined' ? (
                                            <>Viewing: <strong>Combined Progress ({combinedTeacherIds.length} teachers)</strong></>
                                        ) : (
                                            <>Viewing progress for: <strong>{teachers.find(t => t.teacher_id === selectedTeacherId)?.teacher_name}</strong></>
                                        )}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setSelectedTeacherId(null);
                                            setCombinedTeacherIds([]);
                                            fetchSyllabusDetail(null);
                                        }}
                                        className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                            {!selectedTeacherId && teachers.length > 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Select a teacher to view their specific progress on this syllabus
                                </p>
                            )}
                            {loadingTeachers && (
                                <SmallSpinner />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Read-only banner for former teachers */}
            {isTeacher && isReadOnly && (
                <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        You are no longer assigned to this syllabus. Your progress is preserved but you cannot make changes.
                    </p>
                </div>
            )}

            {/* Teacher Assignment Management (Admin/Principal only) */}
            {isAdminOrPrincipal && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Teacher Assignments
                        </h3>
                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<PlusIcon />}
                            onClick={() => {
                                const next = !showAssignForm;
                                setShowAssignForm(next);
                                if (next) {
                                    fetchClassesForAssign();
                                    setAssignFormClassId('');
                                    setAssignFormSectionId('');
                                    setAssignFormTeacherId('');
                                    setSectionList([]);
                                    setAssignTeacherList([]);
                                }
                            }}
                        >
                            {showAssignForm ? 'Cancel' : 'Add'}
                        </Button>
                    </div>

                    {/* Inline Assign Form */}
                    {showAssignForm && (
                        <div className="flex items-end gap-2 sm:gap-3 mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 flex-wrap">
                            <div className="flex-1 min-w-[120px] sm:min-w-[160px]">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Class
                                </label>
                                <select
                                    value={assignFormClassId}
                                    onChange={(e) => handleAssignClassChange(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Select class --</option>
                                    {classList.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.class_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[120px] sm:min-w-[160px]">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Section
                                </label>
                                <select
                                    value={assignFormSectionId}
                                    onChange={(e) => { setAssignFormSectionId(e.target.value ? Number(e.target.value) : ''); setAssignFormTeacherId(''); }}
                                    disabled={!assignFormClassId}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">-- Select section --</option>
                                    {sectionList.map((sec) => (
                                        <option key={sec.id} value={sec.id}>
                                            {sec.section_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[120px] sm:min-w-[160px]">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Teacher
                                </label>
                                <select
                                    value={assignFormTeacherId}
                                    onChange={(e) => setAssignFormTeacherId(e.target.value ? Number(e.target.value) : '')}
                                    disabled={!assignFormSectionId}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">-- Select teacher --</option>
                                    {assignTeacherList.map((t) => (
                                        <option key={t.teacher_id} value={t.teacher_id}>
                                            {t.teacher_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAssignTeacher}
                                disabled={!assignFormTeacherId || !assignFormSectionId || assigningSaving}
                            >
                                {assigningSaving ? 'Assigning...' : 'Assign'}
                            </Button>
                        </div>
                    )}

                    {/* Assignments List grouped by section */}
                    {loadingAssignments ? (
                        <div className="flex justify-center py-4"><SmallSpinner /></div>
                    ) : assignments.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No teacher assignments yet. Use the Add button above to assign teachers manually.
                        </p>
                    ) : (
                        (() => {
                            // Group by section
                            const sectionGrouped: Record<string, ITeacherSyllabusAssignment[]> = {};
                            assignments.forEach((a) => {
                                const key = `${a.class_name} - ${a.section_name}`;
                                if (!sectionGrouped[key]) sectionGrouped[key] = [];
                                sectionGrouped[key].push(a);
                            });

                            return (
                                <div className="space-y-4">
                                    {Object.entries(sectionGrouped).map(([sectionLabel, sectionAssignments]) => (
                                        <div key={sectionLabel}>
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                {sectionLabel}
                                            </h4>
                                            <div className="space-y-2">
                                                {sectionAssignments.map((a) => (
                                                    <div
                                                        key={a.id}
                                                        className={`flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border ${
                                                            a.is_active
                                                                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-2 h-2 rounded-full ${
                                                                    a.is_active ? 'bg-green-500' : 'bg-gray-400'
                                                                }`}
                                                            />
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {a.teacher_name}
                                                                </span>
                                                                <span className={`ml-2 text-xs ${a.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                    ({a.is_active ? 'Active' : 'Former'})
                                                                </span>
                                                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    {a.is_active
                                                                        ? `assigned ${a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : ''}`
                                                                        : `${a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : ''} → ${a.unassigned_at ? new Date(a.unassigned_at).toLocaleDateString() : ''}`
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {a.is_active && (
                                                            <button
                                                                onClick={() => {
                                                                    setUnassignTarget(a);
                                                                    setShowUnassignConfirm(true);
                                                                }}
                                                                disabled={unassigningId === a.id}
                                                                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                {unassigningId === a.id ? 'Removing...' : 'Unassign'}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    )}
                </div>
            )}

            {/* Lessons Accordion */}
            <div className="space-y-4">
                {syllabus.lessons?.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No lessons added yet.</p>
                        {hasPermission(Permission.MANAGE_SYLLABUS) && (
                            <Button variant="primary" leftIcon={<PlusIcon />} onClick={handleAddLesson}>
                                Add First Lesson
                            </Button>
                        )}
                    </div>
                ) : (
                    syllabus.lessons?.map((lesson) => (
                        <div
                            key={lesson.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            {/* Lesson Header */}
                            <div
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-2 sm:gap-0"
                                onClick={() => toggleLesson(lesson.id)}
                            >
                                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                    {/* Teacher completion toggle for lesson */}
                                    {isTeacher && (
                                        markingProgress === `lesson-${lesson.id}` ? (
                                            <SmallSpinner />
                                        ) : isItemEditable(lesson) && getTimelineState(lesson).canMarkProgress ? (
                                            <button
                                                onClick={(e) => handleToggleProgress('lesson', lesson.id, isItemCompleted(lesson.status), e)}
                                                className="flex-shrink-0"
                                                title={isItemCompleted(lesson.status) ? 'Mark as incomplete' : 'Mark as complete'}
                                            >
                                                {getStatusIcon(lesson.status)}
                                            </button>
                                        ) : (
                                            <span className="flex-shrink-0">{getStatusIcon(lesson.status)}</span>
                                        )
                                    )}
                                    {/* Admin status icon when viewing teacher progress */}
                                    {isAdminOrPrincipal && selectedTeacherId && (
                                        <span className="flex-shrink-0">{getStatusIcon(lesson.status)}</span>
                                    )}
                                    <div
                                        className={`transform transition-transform ${expandedLessons.has(lesson.id) ? 'rotate-180' : ''
                                            }`}
                                    >
                                        <ChevronDownIcon />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                            {lesson.title}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                            <Badge variant={getStatusBadgeVariant(lesson.status)} size="sm">
                                                {getStatusLabel(lesson.status)}
                                            </Badge>
                                            {getCompletedByLabel(lesson) && (
                                                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                                                    Completed by {getCompletedByLabel(lesson)}
                                                </span>
                                            )}
                                            {!showDetailedTimeline && (
                                                <DateRangeChip
                                                    plannedStart={lesson.planned_start_date}
                                                    plannedEnd={lesson.planned_end_date}
                                                    actualStart={lesson.actual_start_date}
                                                    actualEnd={lesson.actual_end_date}
                                                    status={lesson.status}
                                                />
                                            )}
                                            <ProgressBar percentage={lesson.completion_percentage || 0} className="max-w-[150px] sm:max-w-xs" />
                                        </div>
                                        {lesson.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {lesson.description}
                                            </p>
                                        )}
                                        <TimelineDetail item={lesson} showDates={showDetailedTimeline} showNotes={showDetailedTimeline || isTeacher} />
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 sm:gap-2 flex-wrap ${isTeacher || (isAdminOrPrincipal && selectedTeacherId) ? 'pl-16' : 'pl-8'} sm:pl-0`}>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                                        {lesson.completion_percentage || 0}%
                                    </span>
                                    {/* Configure/Start/Progress buttons for teacher */}
                                    {isTeacher && isItemEditable(lesson) && (() => {
                                        const tl = getTimelineState(lesson);
                                        if (tl.isUnconfigured) {
                                            return (
                                                <button
                                                    onClick={(e) => handleConfigure('lesson', lesson, e)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                    title="Configure timeline"
                                                >
                                                    <SettingsIcon />
                                                    Configure
                                                </button>
                                            );
                                        }
                                        if (tl.isPlanned) {
                                            return (
                                                <>
                                                    {startingItem === `lesson-${lesson.id}` ? (
                                                        <SmallSpinner />
                                                    ) : (
                                                        <button
                                                            onClick={(e) => handleStartItem('lesson', lesson.id, e)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                            title="Start teaching"
                                                        >
                                                            <PlayIcon />
                                                            Start
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleConfigure('lesson', lesson, e)}
                                                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                                                        title="Edit timeline"
                                                    >
                                                        <SettingsIcon />
                                                    </button>
                                                </>
                                            );
                                        }
                                        if (tl.isGrandfathered) {
                                            return (
                                                <>
                                                    {markingProgress === `lesson-${lesson.id}` ? (
                                                        <SmallSpinner />
                                                    ) : (
                                                        <button
                                                            onClick={(e) => handleToggleProgress('lesson', lesson.id, isItemCompleted(lesson.status), e)}
                                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isItemCompleted(lesson.status)
                                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                                }`}
                                                        >
                                                            {isItemCompleted(lesson.status) ? 'Mark Incomplete' : 'Mark Complete'}
                                                        </button>
                                                    )}
                                                    {!tl.isCompleted && (
                                                        <button
                                                            onClick={(e) => handleConfigure('lesson', lesson, e)}
                                                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                                                            title="Configure timeline"
                                                        >
                                                            <SettingsIcon />
                                                        </button>
                                                    )}
                                                </>
                                            );
                                        }
                                        // Started or completed — show progress buttons
                                        return markingProgress === `lesson-${lesson.id}` ? (
                                            <SmallSpinner />
                                        ) : (
                                            <button
                                                onClick={(e) => handleToggleProgress('lesson', lesson.id, isItemCompleted(lesson.status), e)}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isItemCompleted(lesson.status)
                                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                    }`}
                                            >
                                                {isItemCompleted(lesson.status) ? 'Mark Incomplete' : 'Mark Complete'}
                                            </button>
                                        );
                                    })()}
                                    {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                        <button
                                            onClick={(e) => handleAddTopic(lesson.id, e)}
                                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium"
                                            title="Add Topic"
                                        >
                                            <PlusIcon />
                                            <span className="hidden sm:inline">Add Topic</span>
                                        </button>
                                    )}
                                    {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                        <button
                                            onClick={(e) => handleEditLesson(lesson, e)}
                                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
                                            title="Edit Lesson"
                                        >
                                            <EditIcon />
                                        </button>
                                    )}
                                    {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                        <button
                                            onClick={(e) => handleDeleteLesson(lesson, e)}
                                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                            title="Delete Lesson"
                                        >
                                            <TrashIcon />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Lesson Content (Topics) */}
                            {expandedLessons.has(lesson.id) && (
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                    {lesson.topics?.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                            No topics added yet.
                                            {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                <button
                                                    onClick={(e) => handleAddTopic(lesson.id, e)}
                                                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Add one
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        lesson.topics?.map((topic) => (
                                            <div key={topic.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                                {/* Topic Header */}
                                                <div
                                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 pl-6 sm:p-4 sm:pl-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-l-4 border-blue-500 gap-2 sm:gap-0"
                                                    onClick={() => toggleTopic(topic.id)}
                                                >
                                                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                                        {/* Teacher completion toggle for topic */}
                                                        {isTeacher && (
                                                            markingProgress === `topic-${topic.id}` ? (
                                                                <SmallSpinner />
                                                            ) : isItemEditable(topic) && getTimelineState(topic).canMarkProgress ? (
                                                                <button
                                                                    onClick={(e) => handleToggleProgress('topic', topic.id, isItemCompleted(topic.status), e)}
                                                                    className="flex-shrink-0"
                                                                    title={isItemCompleted(topic.status) ? 'Mark as incomplete' : 'Mark as complete'}
                                                                >
                                                                    {getStatusIcon(topic.status)}
                                                                </button>
                                                            ) : (
                                                                <span className="flex-shrink-0">{getStatusIcon(topic.status)}</span>
                                                            )
                                                        )}
                                                        {/* Admin status icon when viewing teacher progress */}
                                                        {isAdminOrPrincipal && selectedTeacherId && (
                                                            <span className="flex-shrink-0">{getStatusIcon(topic.status)}</span>
                                                        )}
                                                        <div
                                                            className={`transform transition-transform ${expandedTopics.has(topic.id) ? 'rotate-180' : ''
                                                                }`}
                                                        >
                                                            <ChevronDownIcon />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                                {topic.title}
                                                            </h4>
                                                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                                                <Badge variant={getStatusBadgeVariant(topic.status)} size="sm">
                                                                    {getStatusLabel(topic.status)}
                                                                </Badge>
                                                                {getCompletedByLabel(topic) && (
                                                                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                                                                        Completed by {getCompletedByLabel(topic)}
                                                                    </span>
                                                                )}
                                                                {!showDetailedTimeline && (
                                                                    <DateRangeChip
                                                                        plannedStart={topic.planned_start_date}
                                                                        plannedEnd={topic.planned_end_date}
                                                                        actualStart={topic.actual_start_date}
                                                                        actualEnd={topic.actual_end_date}
                                                                        status={topic.status}
                                                                    />
                                                                )}
                                                                <ProgressBar percentage={topic.completion_percentage || 0} className="max-w-[150px] sm:max-w-xs" />
                                                            </div>
                                                            {topic.description && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {topic.description}
                                                                </p>
                                                            )}
                                                            <TimelineDetail item={topic} showDates={showDetailedTimeline} showNotes={showDetailedTimeline || isTeacher} />
                                                        </div>
                                                    </div>
                                                    <div className={`flex items-center gap-1 sm:gap-2 flex-wrap ${isTeacher || (isAdminOrPrincipal && selectedTeacherId) ? 'pl-16' : 'pl-8'} sm:pl-0`}>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                                                            {topic.completion_percentage || 0}%
                                                        </span>
                                                        {/* Configure/Start/Progress buttons for topic */}
                                                        {isTeacher && isItemEditable(topic) && (() => {
                                                            const tl = getTimelineState(topic);
                                                            if (tl.isUnconfigured) {
                                                                return (
                                                                    <button
                                                                        onClick={(e) => handleConfigure('topic', topic, e)}
                                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                                        title="Configure timeline"
                                                                    >
                                                                        <SettingsIcon />
                                                                        Configure
                                                                    </button>
                                                                );
                                                            }
                                                            if (tl.isPlanned) {
                                                                return (
                                                                    <>
                                                                        {startingItem === `topic-${topic.id}` ? (
                                                                            <SmallSpinner />
                                                                        ) : (
                                                                            <button
                                                                                onClick={(e) => handleStartItem('topic', topic.id, e)}
                                                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                                                title="Start teaching"
                                                                            >
                                                                                <PlayIcon />
                                                                                Start
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={(e) => handleConfigure('topic', topic, e)}
                                                                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                                                                            title="Edit timeline"
                                                                        >
                                                                            <SettingsIcon />
                                                                        </button>
                                                                    </>
                                                                );
                                                            }
                                                            if (tl.isGrandfathered) {
                                                                return markingProgress === `topic-${topic.id}` ? (
                                                                    <SmallSpinner />
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => handleToggleProgress('topic', topic.id, isItemCompleted(topic.status), e)}
                                                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isItemCompleted(topic.status)
                                                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                                            }`}
                                                                    >
                                                                        {isItemCompleted(topic.status) ? 'Mark Incomplete' : 'Mark Complete'}
                                                                    </button>
                                                                );
                                                            }
                                                            return markingProgress === `topic-${topic.id}` ? (
                                                                <SmallSpinner />
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => handleToggleProgress('topic', topic.id, isItemCompleted(topic.status), e)}
                                                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isItemCompleted(topic.status)
                                                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                                        }`}
                                                                >
                                                                    {isItemCompleted(topic.status) ? 'Mark Incomplete' : 'Mark Complete'}
                                                                </button>
                                                            );
                                                        })()}
                                                        {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                            <button
                                                                onClick={(e) => handleAddSubtopic(topic.id, e)}
                                                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium"
                                                                title="Add Subtopic"
                                                            >
                                                                <PlusIcon />
                                                                <span className="hidden sm:inline">Add Subtopic</span>
                                                            </button>
                                                        )}
                                                        {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                            <button
                                                                onClick={(e) => handleEditTopic(topic, e)}
                                                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
                                                                title="Edit Topic"
                                                            >
                                                                <EditIcon />
                                                            </button>
                                                        )}
                                                        {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                            <button
                                                                onClick={(e) => handleDeleteTopic(topic, e)}
                                                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                                                title="Delete Topic"
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Topic Content (Subtopics) */}
                                                {expandedTopics.has(topic.id) && (
                                                    <div className="bg-gray-50 dark:bg-gray-900/30 border-l-4 border-blue-300 ml-2 sm:ml-12">
                                                        {topic.subtopics?.length === 0 ? (
                                                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                                No subtopics added yet.
                                                                {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                                    <button
                                                                        onClick={(e) => handleAddSubtopic(topic.id, e)}
                                                                        className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                                                                    >
                                                                        Add one
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            topic.subtopics?.map((subtopic) => (
                                                                <div
                                                                    key={subtopic.id}
                                                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 pl-4 sm:p-3 sm:pl-8 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-800/50 gap-1.5 sm:gap-0"
                                                                >
                                                                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                                                        {markingProgress === `subtopic-${subtopic.id}` ? (
                                                                            <SmallSpinner />
                                                                        ) : isTeacher && isItemEditable(subtopic) && getTimelineState(subtopic).canMarkProgress ? (
                                                                            <button
                                                                                onClick={(e) => handleToggleProgress('subtopic', subtopic.id, subtopic.is_completed, e)}
                                                                                className="flex-shrink-0"
                                                                                title={subtopic.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
                                                                            >
                                                                                {getStatusIcon(subtopic.status)}
                                                                            </button>
                                                                        ) : (
                                                                            <span className="flex-shrink-0">{getStatusIcon(subtopic.status)}</span>
                                                                        )}
                                                                        <div className="min-w-0">
                                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                                {subtopic.title}
                                                                            </span>
                                                                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                                                <Badge variant={getStatusBadgeVariant(subtopic.status)} size="sm">
                                                                                    {getStatusLabel(subtopic.status)}
                                                                                </Badge>
                                                                                {getCompletedByLabel(subtopic) && (
                                                                                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                                                                                        Completed by {getCompletedByLabel(subtopic)}
                                                                                    </span>
                                                                                )}
                                                                                {!showDetailedTimeline && (
                                                                                    <DateRangeChip
                                                                                        plannedStart={subtopic.planned_start_date}
                                                                                        plannedEnd={subtopic.planned_end_date || subtopic.planned_completion_date}
                                                                                        actualStart={subtopic.actual_start_date}
                                                                                        actualEnd={subtopic.actual_end_date || subtopic.actual_completion_date}
                                                                                        status={subtopic.status}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            {subtopic.learning_objectives && (
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                                    {subtopic.learning_objectives}
                                                                                </p>
                                                                            )}
                                                                            <TimelineDetail item={subtopic} showDates={showDetailedTimeline} showNotes={showDetailedTimeline || isTeacher} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap pl-8 sm:pl-0">
                                                                        {/* Configure/Start/Progress buttons for subtopic */}
                                                                        {isTeacher && isItemEditable(subtopic) && (() => {
                                                                            const tl = getTimelineState(subtopic);
                                                                            if (tl.isUnconfigured) {
                                                                                return (
                                                                                    <button
                                                                                        onClick={(e) => handleConfigure('subtopic', subtopic, e)}
                                                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                                                        title="Configure timeline"
                                                                                    >
                                                                                        <SettingsIcon />
                                                                                        Configure
                                                                                    </button>
                                                                                );
                                                                            }
                                                                            if (tl.isPlanned) {
                                                                                return (
                                                                                    <>
                                                                                        {startingItem === `subtopic-${subtopic.id}` ? (
                                                                                            <SmallSpinner />
                                                                                        ) : (
                                                                                            <button
                                                                                                onClick={(e) => handleStartItem('subtopic', subtopic.id, e)}
                                                                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                                                                title="Start teaching"
                                                                                            >
                                                                                                <PlayIcon />
                                                                                                Start
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={(e) => handleConfigure('subtopic', subtopic, e)}
                                                                                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                                                                                            title="Edit timeline"
                                                                                        >
                                                                                            <SettingsIcon />
                                                                                        </button>
                                                                                    </>
                                                                                );
                                                                            }
                                                                            if (tl.isGrandfathered) {
                                                                                return markingProgress === `subtopic-${subtopic.id}` ? (
                                                                                    <SmallSpinner />
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={(e) => handleToggleProgress('subtopic', subtopic.id, subtopic.is_completed, e)}
                                                                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${subtopic.is_completed
                                                                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                                                            }`}
                                                                                    >
                                                                                        {subtopic.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                                                                                    </button>
                                                                                );
                                                                            }
                                                                            return markingProgress === `subtopic-${subtopic.id}` ? (
                                                                                <SmallSpinner />
                                                                            ) : (
                                                                                <button
                                                                                    onClick={(e) => handleToggleProgress('subtopic', subtopic.id, subtopic.is_completed, e)}
                                                                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${subtopic.is_completed
                                                                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                                                        }`}
                                                                                >
                                                                                    {subtopic.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                                                                                </button>
                                                                            );
                                                                        })()}
                                                                        {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                                            <button
                                                                                onClick={(e) => handleEditSubtopic(subtopic, e)}
                                                                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
                                                                                title="Edit Subtopic"
                                                                            >
                                                                                <EditIcon />
                                                                            </button>
                                                                        )}
                                                                        {hasPermission(Permission.MANAGE_SYLLABUS) && (
                                                                            <button
                                                                                onClick={(e) => handleDeleteSubtopic(subtopic, e)}
                                                                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                                                                title="Delete Subtopic"
                                                                            >
                                                                                <TrashIcon />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Lesson Form Modal */}
            {syllabusId && (
                <LessonFormModal
                    isOpen={showLessonModal}
                    onClose={() => {
                        setShowLessonModal(false);
                        setEditLesson(null);
                    }}
                    syllabusId={syllabusId}
                    lesson={editLesson}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Topic Form Modal */}
            {(parentLessonId || editTopic) && (
                <TopicFormModal
                    isOpen={showTopicModal}
                    onClose={() => {
                        setShowTopicModal(false);
                        setEditTopic(null);
                        setParentLessonId(null);
                    }}
                    lessonId={parentLessonId || editTopic?.lesson_id || ''}
                    topic={editTopic}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Subtopic Form Modal */}
            {(parentTopicId || editSubtopic) && (
                <SubtopicFormModal
                    isOpen={showSubtopicModal}
                    onClose={() => {
                        setShowSubtopicModal(false);
                        setEditSubtopic(null);
                        setParentTopicId(null);
                    }}
                    topicId={parentTopicId || editSubtopic?.topic_id || ''}
                    subtopic={editSubtopic}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title={`Delete ${deleteTarget?.type ? deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1) : ''}`}
                message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
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

            {/* Unassign Teacher Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showUnassignConfirm}
                title="Unassign Teacher"
                message={`Are you sure you want to unassign "${unassignTarget?.teacher_name}" from ${unassignTarget?.class_name} - ${unassignTarget?.section_name}? Their progress history will be preserved.`}
                type="danger"
                confirmText="Unassign"
                cancelText="Cancel"
                onConfirm={handleUnassignTeacher}
                onCancel={() => {
                    setShowUnassignConfirm(false);
                    setUnassignTarget(null);
                }}
                isLoading={unassigningId !== null}
            />

            {/* Configure Timeline Modal */}
            {configureTarget && (
                <ConfigureTimelineModal
                    isOpen={showConfigureModal}
                    onClose={() => {
                        setShowConfigureModal(false);
                        setConfigureTarget(null);
                    }}
                    onSuccess={handleConfigureSuccess}
                    itemType={configureTarget.itemType}
                    itemId={configureTarget.itemId}
                    itemTitle={configureTarget.itemTitle}
                    existingDates={configureTarget.existingDates}
                />
            )}
        </div>
    );
};

export default SyllabusDetail;
