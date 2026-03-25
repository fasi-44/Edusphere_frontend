/**
 * Timetable Edit Page
 * Edit existing draft timetables with interactive grid interface
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    LoadingSpinner,
    EmptyState,
    TimetableGrid,
    SubjectDialog,
    ConflictDialog,
} from '../../components';
import { timetableService } from '../../services/modules/timetableService';
import { subjectService } from '../../services/modules/subjectService';
import { teacherService } from '../../services/modules/teacherService';
import { roomService } from '../../services/modules/roomService';
import { useAuthStore } from '../../stores/authStore';
import {
    ITimetable,
    ITimeSlotGenerated,
    ITimetableEntry,
    ISubject,
    IUser,
} from '../../types/index';

const TimetableEdit: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const authUser = useAuthStore((state) => state.user);
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);

    // Timetable data
    const [timetable, setTimetable] = useState<ITimetable | null>(null);
    const [timeSlots, setTimeSlots] = useState<ITimeSlotGenerated[]>([]);
    const [timetableEntries, setTimetableEntries] = useState<Record<string, ITimetableEntry>>({});

    // Data lists
    const [subjects, setSubjects] = useState<ISubject[]>([]);
    const [teachers, setTeachers] = useState<IUser[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);

    // Dialog states
    const [subjectDialog, setSubjectDialog] = useState({
        isOpen: false,
        day: '',
        timeSlot: '',
    });
    const [conflictDialog, setConflictDialog] = useState({
        open: false,
        conflicts: [] as any[],
    });
    const [existingEntryToEdit, setExistingEntryToEdit] = useState<ITimetableEntry | undefined>();

    // Load timetable data on mount
    useEffect(() => {
        if (!id) return;

        const fetchTimetableData = async () => {
            try {
                setLoading(true);

                // Fetch timetable
                const timetableData = await timetableService.getById(id);

                // Verify it's a draft
                if (!timetableData.is_draft) {
                    toast.error('You can only edit draft timetables');
                    navigate('/timetable');
                    return;
                }

                setTimetable(timetableData);
                setTimeSlots(timetableData.time_slots || []);
                setTimetableEntries(timetableData.entries || {});

                // Fetch subjects for the section
                const subjectsData = await subjectService.getBySection(
                    String(timetableData.section_id)
                );
                setSubjects(subjectsData);

                // Fetch teachers
                const teachersResponse = await teacherService.list();
                setTeachers(teachersResponse.data);

                const roomsResponse = await roomService.list({ is_active: true });
                setRooms(Array.isArray(roomsResponse) ? roomsResponse : roomsResponse?.data || []);
            } catch (err: any) {
                toast.error('Failed to load timetable');
                console.error(err);
                navigate('/timetable');
            } finally {
                setLoading(false);
            }
        };

        fetchTimetableData();
    }, [id, navigate, academicYearVersion]);

    // Handle grid cell click
    const handleCellClick = (day: string, timeSlot: string) => {
        const key = `${day}-${timeSlot}`;
        const existing = timetableEntries[key];
        setExistingEntryToEdit(existing);
        setSubjectDialog({ isOpen: true, day, timeSlot });
    };

    // Handle subject assignment
    const handleAssignSubject = async (entry: Partial<ITimetableEntry>) => {
        const { day, timeSlot } = subjectDialog;

        // Check for teacher conflict
        const slot = timeSlots.find((s) => s.time_display === timeSlot);
        if (slot && !slot.is_lunch && entry.teacher?.id) {
            try {
                const conflictData = await timetableService.checkTeacherConflict({
                    skid: authUser?.skid || '',
                    teacher_id: String(entry.teacher.id),
                    day,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    academic_year_id: timetable?.academic_year_id || '',
                    semester: timetable?.semester || 1,
                    exclude_timetable_id: id,
                });
                console.log(conflictData)

                if (conflictData.has_conflict) {
                    setConflictDialog({
                        open: true,
                        conflicts: conflictData.conflicts,
                    });
                    return;
                }
            } catch (err: any) {
                toast.error('Failed to check conflicts');
                return;
            }
        }

        // Save the entry
        const key = `${day}-${timeSlot}`;
        setTimetableEntries((prev) => ({
            ...prev,
            [key]: entry as ITimetableEntry,
        }));

        setSubjectDialog({ isOpen: false, day: '', timeSlot: '' });
        setValidationResult(null);
        toast.success(existingEntryToEdit ? 'Entry updated' : 'Entry added');
    };

    // Handle entry deletion
    const handleDeleteEntry = () => {
        const { day, timeSlot } = subjectDialog;
        const key = `${day}-${timeSlot}`;
        setTimetableEntries((prev) => {
            const newEntries = { ...prev };
            delete newEntries[key];
            return newEntries;
        });
        setSubjectDialog({ isOpen: false, day: '', timeSlot: '' });
        toast.success('Entry deleted');
    };

    // Validate timetable
    const handleValidate = async () => {
        if (Object.keys(timetableEntries).length === 0) {
            toast.error('Please add at least one subject');
            return;
        }

        setValidating(true);
        try {
            const transformedEntries: Record<string, any> = {};
            Object.entries(timetableEntries).forEach(([key, entry]) => {
                transformedEntries[key] = {
                    subject_id: entry.subject.id,
                    teacher_id: entry.teacher.id,
                    room: entry.room,
                    type: entry.type,
                };
            });

            const result = await timetableService.validateConflicts({
                skid: authUser?.skid || '',
                class_id: String(timetable?.class_id),
                section_id: String(timetable?.section_id),
                academic_year_id: timetable?.academic_year_id || '',
                semester: timetable?.semester || 1,
                entries: transformedEntries,
                exclude_timetable_id: id,
            });

            setValidationResult(result);
            if (result.is_valid) {
                toast.success('Timetable validation passed!');
            } else {
                toast.error(`Validation failed: ${result.validation_message}`);
            }
        } catch (err: any) {
            toast.error('Validation failed');
            setValidationResult({ is_valid: false, validation_message: 'Validation failed' });
        } finally {
            setValidating(false);
        }
    };

    // Save timetable
    const handleSave = async (asDraft: boolean) => {
        if (Object.keys(timetableEntries).length === 0) {
            toast.error('Please add at least one subject');
            return;
        }

        if (!asDraft && (!validationResult || !validationResult.is_valid)) {
            toast.error('Please validate the timetable first');
            return;
        }

        setSaving(true);
        try {
            const transformedEntries: Record<string, any> = {};
            Object.entries(timetableEntries).forEach(([key, entry]) => {
                transformedEntries[key] = {
                    subject: entry.subject,
                    teacher: entry.teacher,
                    teacher_id: entry.teacher.id,
                    room: entry.room,
                    type: entry.type,
                };
            });

            const data = {
                class_id: timetable?.class_id,
                section_id: timetable?.section_id,
                academic_year_id: timetable?.academic_year_id,
                semester: timetable?.semester,
                period_duration: timetable?.configuration.period_duration,
                school_start_time: timetable?.configuration.school_start_time,
                lunch_start_time: timetable?.configuration.lunch_start_time,
                lunch_duration: timetable?.configuration.lunch_duration,
                total_periods: timetable?.configuration.total_periods,
                entries: transformedEntries,
                is_draft: asDraft,
            };

            if (asDraft) {
                await timetableService.saveDraft(data);
                toast.success('Timetable updated as draft');
            } else {
                await timetableService.createFinal(data);
                toast.success('Timetable published successfully');
            }

            setTimeout(() => navigate('/timetable'), 500);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save timetable');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading timetable..." />;
    }

    if (!timetable) {
        return (
            <EmptyState
                title="Timetable Not Found"
                description="The timetable you're trying to edit could not be found."
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Edit Draft Timetable"
                subtitle="Update your timetable schedule"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Timetables', href: '/timetable' },
                    { label: 'Edit', href: '#' },
                ]}
            />

            {/* Configuration Card (Read-Only) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Timetable Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Class Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">
                            Class
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {timetable.class_name} - {timetable.section_name}
                        </p>
                    </div>

                    {/* Academic Year */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">
                            Academic Year
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {timetable.academic_year}
                        </p>
                    </div>

                    {/* Semester */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">
                            Semester
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            Semester {timetable.semester}
                        </p>
                    </div>

                    {/* Period Duration */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase">
                            Period Duration
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {timetable.configuration.period_duration} min
                        </p>
                    </div>

                    {/* School Start Time */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase">
                            School Start
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {timetable.configuration.school_start_time}
                        </p>
                    </div>

                    {/* Total Periods */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase">
                            Total Periods
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {timetable.configuration.total_periods}
                        </p>
                    </div>

                    {/* Lunch Start Time */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase">
                            Lunch Start
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {timetable.configuration.lunch_start_time}
                        </p>
                    </div>

                    {/* Lunch Duration */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase">
                            Lunch Duration
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {timetable.configuration.lunch_duration} min
                        </p>
                    </div>

                    {/* Status */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium uppercase">
                            Status
                        </p>
                        <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded">
                            {timetable.is_draft ? 'Draft' : 'Published'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Timetable Schedule
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Click on any cell to assign a subject
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/timetable')}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleValidate}
                            disabled={validating || Object.keys(timetableEntries).length === 0}
                        >
                            {validating ? 'Validating...' : 'Validate'}
                        </Button>
                    </div>
                </div>

                {/* Validation Result */}
                {validationResult && (
                    <div
                        className={`p-4 rounded-lg border ${validationResult.is_valid
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}
                    >
                        <p
                            className={`text-sm font-semibold ${validationResult.is_valid
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-red-700 dark:text-red-300'
                                }`}
                        >
                            {validationResult.is_valid
                                ? '✓ No conflicts found! Timetable is ready to save.'
                                : `✗ ${validationResult.validation_message || 'Validation failed'}`}
                        </p>
                    </div>
                )}

                {/* Grid */}
                <TimetableGrid
                    timeSlots={timeSlots}
                    entries={timetableEntries}
                    onCellClick={handleCellClick}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
                <Button
                    variant="secondary"
                    onClick={() => navigate('/timetable')}
                >
                    Cancel
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                    variant="primary"
                    onClick={() => handleSave(false)}
                    disabled={saving || !validationResult || !validationResult.is_valid}
                >
                    {saving ? 'Saving...' : 'Save & Publish'}
                </Button>
            </div>

            {/* Subject Dialog */}
            <SubjectDialog
                isOpen={subjectDialog.isOpen}
                day={subjectDialog.day}
                timeSlot={subjectDialog.timeSlot}
                existingEntry={existingEntryToEdit}
                subjects={subjects}
                teachers={teachers}
                rooms={rooms}
                onClose={() => setSubjectDialog({ isOpen: false, day: '', timeSlot: '' })}
                onSave={handleAssignSubject}
                onDelete={existingEntryToEdit ? handleDeleteEntry : undefined}
                loading={saving}
            />

            {/* Conflict Dialog */}
            <ConflictDialog
                open={conflictDialog.open}
                conflicts={conflictDialog.conflicts}
                onClose={() => setConflictDialog({ open: false, conflicts: [] })}
            />
        </div>
    );
};

export default TimetableEdit;
