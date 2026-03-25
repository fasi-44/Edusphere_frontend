import { useAuthStore } from '@/stores/authStore';
import { FC, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import {
    Button,
    FormField,
    FormSelect,
    FormTextarea,
    LoadingSpinner,
    PageHeader,
    ConfirmDialog,
} from '../../components';
import DrawingCanvas from '../../components/DrawingCanvas';
import { assignmentService } from '../../services/modules/assignmentService';
import { IAssignment, ITeacherClassSubject } from '../../types/index';

const Assignments: FC = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);

    // Tab state
    const [activeTab, setActiveTab] = useState<'today' | 'past'>('today');

    // Teacher class-subject combos
    const [classSubjects, setClassSubjects] = useState<ITeacherClassSubject[]>([]);
    const [loadingClassSubjects, setLoadingClassSubjects] = useState(false);

    // Form state (Tab 1 - create)
    const [selectedCombo, setSelectedCombo] = useState('');
    const [assignmentText, setAssignmentText] = useState('');
    const [assignmentDrawing, setAssignmentDrawing] = useState<string | null>(null);
    const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
    const [todayDate, setTodayDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [editDrawing, setEditDrawing] = useState<string | null>(null);
    const [showEditDrawing, setShowEditDrawing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Today's assignments list
    const [todayAssignments, setTodayAssignments] = useState<IAssignment[]>([]);
    const [loadingToday, setLoadingToday] = useState(false);

    // Past assignments (Tab 2)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const [pastDate, setPastDate] = useState(yesterday.toISOString().split('T')[0]);
    const [pastAssignments, setPastAssignments] = useState<IAssignment[]>([]);
    const [loadingPast, setLoadingPast] = useState(false);

    // Delete
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Parse combo value (class_id-section_id-subject_id)
    const parsedCombo = useMemo(() => {
        if (!selectedCombo) return null;
        const parts = selectedCombo.split('-');
        if (parts.length !== 3) return null;
        return {
            class_id: parseInt(parts[0]),
            section_id: parseInt(parts[1]),
            subject_id: parseInt(parts[2]),
        };
    }, [selectedCombo]);

    const selectedComboDetails = useMemo(() => {
        if (!parsedCombo) return null;
        return classSubjects.find(
            (c) =>
                c.class_id === parsedCombo.class_id &&
                c.section_id === parsedCombo.section_id &&
                c.subject_id === parsedCombo.subject_id
        );
    }, [parsedCombo, classSubjects]);

    // Fetch teacher's class-subject combos on mount
    useEffect(() => {
        if (user?.school_user_id) {
            fetchClassSubjects();
        }
    }, [user?.school_user_id, academicYearVersion]);

    // Fetch today's assignments when tab is active or date changes
    useEffect(() => {
        if (activeTab === 'today' && user?.school_user_id && user?.current_academic_year?.id) {
            fetchAssignmentsByDate(todayDate, setTodayAssignments, setLoadingToday);
        }
    }, [activeTab, todayDate, user?.school_user_id, user?.current_academic_year?.id, academicYearVersion]);

    // Fetch past assignments when tab is active or date changes
    useEffect(() => {
        if (activeTab === 'past' && user?.school_user_id && user?.current_academic_year?.id) {
            fetchAssignmentsByDate(pastDate, setPastAssignments, setLoadingPast);
        }
    }, [activeTab, pastDate, user?.school_user_id, user?.current_academic_year?.id, academicYearVersion]);

    const fetchClassSubjects = async () => {
        setLoadingClassSubjects(true);
        try {
            const data = await assignmentService.getTeacherClassSubjects(user!.school_user_id);
            setClassSubjects(data);
        } catch (err: any) {
            toast.error('Failed to load your class-subject assignments');
            console.error(err);
        } finally {
            setLoadingClassSubjects(false);
        }
    };

    const fetchAssignmentsByDate = async (
        date: string,
        setter: (data: IAssignment[]) => void,
        loadingSetter: (val: boolean) => void
    ) => {
        loadingSetter(true);
        try {
            const data = await assignmentService.listByDate(
                user!.school_user_id,
                date,
                user!.current_academic_year.id
            );
            setter(data);
        } catch (err: any) {
            toast.error('Failed to load assignments');
            console.error(err);
        } finally {
            loadingSetter(false);
        }
    };

    const handleCreate = async () => {
        if (!parsedCombo) {
            toast.error('Please select a class, section, and subject');
            return;
        }
        if (!assignmentText.trim() && !assignmentDrawing) {
            toast.error('Please enter assignment text or draw something');
            return;
        }
        if (showDrawingCanvas && !assignmentDrawing) {
            toast.error('Please draw something or remove the drawing canvas');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                teacher_id: user!.school_user_id,
                class_id: parsedCombo.class_id,
                section_id: parsedCombo.section_id,
                subject_id: parsedCombo.subject_id,
                academic_year_id: user!.current_academic_year.id,
                assignment_date: todayDate,
            };
            if (assignmentText.trim()) payload.assignment_text = assignmentText.trim();
            if (assignmentDrawing) payload.assignment_drawing = assignmentDrawing;

            await assignmentService.create(payload);
            toast.success('Assignment created successfully');
            setAssignmentText('');
            setAssignmentDrawing(null);
            setShowDrawingCanvas(false);
            // Refresh today's list
            fetchAssignmentsByDate(todayDate, setTodayAssignments, setLoadingToday);
        } catch (err: any) {
            toast.error(err.message || 'Failed to create assignment');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editText.trim() && !editDrawing) {
            toast.error('Please enter assignment text or draw something');
            return;
        }
        if (showEditDrawing && !editDrawing) {
            toast.error('Please draw something or remove the drawing canvas');
            return;
        }
        setIsUpdating(true);
        try {
            const payload: any = {};
            payload.assignment_text = editText.trim() || '';
            if (editDrawing !== undefined) payload.assignment_drawing = editDrawing;

            await assignmentService.update(id, payload);
            toast.success('Assignment updated successfully');
            setEditingId(null);
            setEditText('');
            setEditDrawing(null);
            setShowEditDrawing(false);
            // Refresh list for current tab
            if (activeTab === 'today') {
                fetchAssignmentsByDate(todayDate, setTodayAssignments, setLoadingToday);
            } else {
                fetchAssignmentsByDate(pastDate, setPastAssignments, setLoadingPast);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update assignment');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await assignmentService.delete(deleteId);
            toast.success('Assignment deleted');
            setDeleteId(null);
            // Refresh the active tab's list
            if (activeTab === 'today') {
                fetchAssignmentsByDate(todayDate, setTodayAssignments, setLoadingToday);
            } else {
                fetchAssignmentsByDate(pastDate, setPastAssignments, setLoadingPast);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete assignment');
        }
    };

    const startEdit = (assignment: IAssignment) => {
        setEditingId(assignment.id);
        setEditText(assignment.assignment_text || '');
        setEditDrawing(assignment.assignment_drawing || null);
        setShowEditDrawing(!!assignment.assignment_drawing);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
        setEditDrawing(null);
        setShowEditDrawing(false);
    };

    // Build dropdown options from combos
    const comboOptions = classSubjects.map((c) => ({
        label: `${c.class_name} - ${c.section_name} | ${c.subject_name}`,
        value: `${c.class_id}-${c.section_id}-${c.subject_id}`,
    }));

    const renderAssignmentCard = (assignment: IAssignment, showReview: boolean) => {
        const isEditing = editingId === assignment.id;
        const stats = assignment.completion_stats;

        return (
            <div
                key={assignment.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Subject + Class badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                {assignment.subject_name}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                {assignment.class_name} - {assignment.section_name}
                            </span>
                            {stats && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    stats.completed === stats.total && stats.total > 0
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : stats.completed > 0
                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                            : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}>
                                    {stats.completed}/{stats.total} done
                                </span>
                            )}
                        </div>

                        {/* Assignment text or edit input */}
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    rows={3}
                                    placeholder="Assignment text..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {/* Add/show drawing in edit */}
                                {!showEditDrawing && !editDrawing && (
                                    <button
                                        type="button"
                                        onClick={() => setShowEditDrawing(true)}
                                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        + Add Drawing
                                    </button>
                                )}
                                {showEditDrawing && (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Drawing</span>
                                            <button
                                                type="button"
                                                onClick={() => { setShowEditDrawing(false); setEditDrawing(null); }}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <DrawingCanvas
                                            onDrawingChange={setEditDrawing}
                                            initialDrawing={editDrawing || undefined}
                                            height={250}
                                        />
                                    </div>
                                )}
                                {!showEditDrawing && editDrawing && (
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                                        <img src={editDrawing} alt="Drawing" className="h-10 rounded border border-gray-300 dark:border-gray-500" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Drawing attached</span>
                                        <button type="button" onClick={() => setShowEditDrawing(true)} className="text-xs text-blue-600 dark:text-blue-400 mr-1">Edit</button>
                                        <button type="button" onClick={() => setEditDrawing(null)} className="text-xs text-red-500">Remove</button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleUpdate(assignment.id)}
                                        isLoading={isUpdating}
                                        loadingText="Saving..."
                                    >
                                        Save
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={cancelEdit}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {assignment.assignment_text && (
                                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                        {assignment.assignment_text}
                                    </p>
                                )}
                                {assignment.assignment_drawing && (
                                    <div className={assignment.assignment_text ? 'mt-2' : ''}>
                                        <img
                                            src={assignment.assignment_drawing}
                                            alt="Assignment drawing"
                                            className="max-w-full rounded-lg border border-gray-200 dark:border-gray-600"
                                            style={{ maxHeight: '200px' }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Time */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(assignment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' | '}
                            {assignment.assignment_date}
                        </p>
                    </div>

                    {/* Action buttons */}
                    {!isEditing && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {showReview && (
                                <button
                                    onClick={() => navigate(`/assignments/${assignment.id}/review`)}
                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Review students"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={() => startEdit(assignment)}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Edit assignment"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setDeleteId(assignment.id)}
                                className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete assignment"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Assignments"
                subtitle="Create and manage student assignments"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Assignments', href: '#' },
                ]}
            />

            {/* Tab Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                                activeTab === 'today'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Today's Assignments
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                                activeTab === 'past'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Past Assignments
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* ===== TAB 1: TODAY'S ASSIGNMENTS ===== */}
                    {activeTab === 'today' && (
                        <div className="space-y-6">
                            {/* Create assignment form */}
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                    Create New Assignment
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField label="Class - Section | Subject" required>
                                        <FormSelect
                                            name="combo"
                                            value={selectedCombo}
                                            onChange={(e) => setSelectedCombo(e.target.value)}
                                            options={comboOptions}
                                            placeholder={
                                                loadingClassSubjects
                                                    ? 'Loading...'
                                                    : comboOptions.length === 0
                                                        ? 'No assignments found for your timetable'
                                                        : 'Select class, section & subject'
                                            }
                                            disabled={loadingClassSubjects || comboOptions.length === 0}
                                        />
                                    </FormField>
                                    <FormField label="Date">
                                        <input
                                            type="date"
                                            value={todayDate}
                                            onChange={(e) => setTodayDate(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </FormField>
                                </div>

                                {selectedCombo && (
                                    <div className="space-y-3">
                                        {selectedComboDetails && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Assigning for:{' '}
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {selectedComboDetails.class_name} - {selectedComboDetails.section_name}
                                                </span>{' '}
                                                | Subject:{' '}
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {selectedComboDetails.subject_name}
                                                </span>
                                            </p>
                                        )}

                                        {/* Text Input — always visible */}
                                        <FormField label="Assignment Details">
                                            <FormTextarea
                                                name="assignmentText"
                                                value={assignmentText}
                                                onChange={(e) => setAssignmentText(e.target.value)}
                                                placeholder="e.g., Write 2x1 table for 10 times"
                                                rows={3}
                                            />
                                        </FormField>

                                        {/* Add Drawing toggle */}
                                        {!showDrawingCanvas && !assignmentDrawing && (
                                            <button
                                                type="button"
                                                onClick={() => setShowDrawingCanvas(true)}
                                                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                                + Add Drawing
                                            </button>
                                        )}

                                        {/* Drawing Canvas */}
                                        {showDrawingCanvas && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Drawing
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowDrawingCanvas(false); setAssignmentDrawing(null); }}
                                                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                    >
                                                        Remove Drawing
                                                    </button>
                                                </div>
                                                <DrawingCanvas
                                                    onDrawingChange={setAssignmentDrawing}
                                                    initialDrawing={assignmentDrawing || undefined}
                                                    height={300}
                                                />
                                            </div>
                                        )}

                                        {/* Drawing preview thumbnail when canvas is hidden but drawing exists */}
                                        {!showDrawingCanvas && assignmentDrawing && (
                                            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                <img
                                                    src={assignmentDrawing}
                                                    alt="Drawing preview"
                                                    className="h-12 rounded border border-gray-300 dark:border-gray-500"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">Drawing attached</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDrawingCanvas(true)}
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 mr-2"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setAssignmentDrawing(null)}
                                                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <Button
                                                variant="primary"
                                                onClick={handleCreate}
                                                isLoading={isSubmitting}
                                                loadingText="Saving..."
                                                disabled={(!assignmentText.trim() && !assignmentDrawing) || (showDrawingCanvas && !assignmentDrawing) || isSubmitting}
                                            >
                                                Save Assignment
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 dark:border-gray-700" />

                            {/* Today's assignments list */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                                    Today's Assignments ({todayAssignments.length})
                                </h3>

                                {loadingToday ? (
                                    <LoadingSpinner message="Loading assignments..." />
                                ) : todayAssignments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            No assignments created for today yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {todayAssignments.map((a) => renderAssignmentCard(a, true))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===== TAB 2: PAST ASSIGNMENTS ===== */}
                    {activeTab === 'past' && (
                        <div className="space-y-6">
                            {/* Date filter */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField label="Select Date">
                                    <input
                                        type="date"
                                        value={pastDate}
                                        onChange={(e) => setPastDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </FormField>
                            </div>

                            {/* Past assignments list */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                                    Assignments for {pastDate} ({pastAssignments.length})
                                </h3>

                                {loadingPast ? (
                                    <LoadingSpinner message="Loading assignments..." />
                                ) : pastAssignments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            No assignments found for this date.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pastAssignments.map((a) => renderAssignmentCard(a, true))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteId !== null}
                title="Delete Assignment"
                message="Are you sure you want to delete this assignment? This action cannot be undone."
                type="danger"
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
};

export default Assignments;
