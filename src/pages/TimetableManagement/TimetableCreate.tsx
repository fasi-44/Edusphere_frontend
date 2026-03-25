/**
 * Timetable Create Page
 * Main component for creating and managing timetables with 4-step stepper workflow
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    FormField,
    FormSelect,
    FormInput,
    LoadingSpinner,
    Stepper,
    TimetableGrid,
    SubjectDialog,
    ConflictDialog,
} from '../../components';
import { timetableService } from '../../services/modules/timetableService';
import { classService } from '../../services/modules/classService';
import { sectionService } from '../../services/modules/sectionService';
import { subjectService } from '../../services/modules/subjectService';
import { teacherService } from '../../services/modules/teacherService';
import { roomService } from '../../services/modules/roomService';
import { useAuthStore } from '../../stores/authStore';
import {
    ITimeSlotGenerated,
    ITimetableEntry,
    IClass,
    ISection,
    ISubject,
    IUser,
} from '../../types/index';

const STEPS = ['Configuration', 'Period Setup', 'Create Timetable', 'Validate & Save'];

const TimetableCreate: FC = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);
    const academicYearId = authUser?.current_academic_year?.id;

    // Stepper state
    const [activeStep, setActiveStep] = useState(0);

    // Configuration
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [semester, setSemester] = useState('1');

    // Period configuration
    const [periodConfig, setPeriodConfig] = useState({
        period_duration: 45,
        total_periods: 7,
        school_start_time: '09:00',
        lunch_start_time: '12:30',
        lunch_duration: 30,
    });

    // Data lists
    const [classes, setClasses] = useState<IClass[]>([]);
    const [sections, setSections] = useState<ISection[]>([]);
    const [subjects, setSubjects] = useState<ISubject[]>([]);
    const [teachers, setTeachers] = useState<IUser[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [timeSlots, setTimeSlots] = useState<ITimeSlotGenerated[]>([]);
    const [timetableEntries, setTimetableEntries] = useState<Record<string, ITimetableEntry>>({});

    // UI States
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
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

    // Load initial data
    useEffect(() => {
        if (!academicYearId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const classesResponse = await classService.list();
                setClasses(classesResponse);

                const teachersResponse = await teacherService.list();
                setTeachers(teachersResponse.data);

                const roomsResponse = await roomService.list({ is_active: true });
                setRooms(Array.isArray(roomsResponse) ? roomsResponse : roomsResponse?.data || []);
            } catch (err: any) {
                toast.error('Failed to load initial data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [academicYearId, academicYearVersion]);

    // Load sections when class changes
    useEffect(() => {
        if (!selectedClass) return;

        const loadSections = async () => {
            try {
                const sectionsData = await sectionService.getByClass(selectedClass);
                setSections(sectionsData);
                setSelectedSection('');
            } catch (err: any) {
                toast.error('Failed to load sections');
            }
        };

        loadSections();
    }, [selectedClass]);

    // Load subjects when section changes
    useEffect(() => {
        if (!selectedSection) return;

        const loadSubjects = async () => {
            try {
                const subjectsData = await subjectService.getBySection(selectedSection);
                setSubjects(subjectsData);
            } catch (err: any) {
                toast.error('Failed to load subjects');
            }
        };

        loadSubjects();
    }, [selectedSection]);

    // Handle period config change
    const handlePeriodConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPeriodConfig((prev) => ({
            ...prev,
            [name]: name.includes('time') ? value : Number(value),
        }));
        // Reset time slots when config changes
        setTimeSlots([]);
    };

    // Generate time slots
    const handleGenerateTimeSlots = async () => {
        if (!selectedClass || !selectedSection || !semester) {
            toast.error('Please complete the configuration first');
            return;
        }

        setGenerating(true);
        try {
            const slotsData = await timetableService.generateTimeSlots({
                school_start_time: periodConfig.school_start_time,
                lunch_start_time: periodConfig.lunch_start_time,
                lunch_duration: periodConfig.lunch_duration,
                period_duration: periodConfig.period_duration,
                total_periods: periodConfig.total_periods,
            });

            setTimeSlots(slotsData);
            setTimetableEntries({});
            setActiveStep(2);
            toast.success('Time slots generated successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate time slots');
        } finally {
            setGenerating(false);
        }
    };

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
                    teacher_id: entry.teacher.id,
                    day,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    academic_year_id: String(academicYearId || ''),
                    semester: String(semester),
                });

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
                class_id: selectedClass,
                section_id: selectedSection,
                academic_year_id: String(academicYearId || ''),
                semester: String(semester),
                entries: transformedEntries,
            });

            setValidationResult(result);
            if (result.is_valid) {
                toast.success('Timetable validation passed!');
                setActiveStep(3);
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
                class_id: selectedClass,
                section_id: selectedSection,
                academic_year_id: academicYearId,
                semester: semester,
                period_duration: periodConfig.period_duration,
                school_start_time: periodConfig.school_start_time,
                lunch_start_time: periodConfig.lunch_start_time,
                lunch_duration: periodConfig.lunch_duration,
                total_periods: periodConfig.total_periods,
                entries: transformedEntries,
                is_draft: asDraft,
            };

            if (asDraft) {
                await timetableService.saveDraft(data);
                toast.success('Timetable saved as draft');
            } else {
                await timetableService.createFinal(data);
                toast.success('Timetable created successfully');
            }

            setTimeout(() => navigate('/timetable'), 500);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save timetable');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading timetable data..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Timetable"
                subtitle="Set up class schedule with the 4-step process"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Timetables', href: '/timetable' },
                    { label: 'New', href: '#' },
                ]}
            />

            {/* Stepper */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <Stepper steps={STEPS} activeStep={activeStep} />
            </div>

            {/* Step 0: Configuration */}
            {activeStep === 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Step 1: Class Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Class" required>
                            <FormSelect
                                name="selectedClass"
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedSection('');
                                }}
                                options={classes.map((c) => ({
                                    label: c.class_name || c.name || '',
                                    value: String(c.id),
                                }))}
                                placeholder="Select class"
                                required
                            />
                        </FormField>

                        <FormField label="Section" required>
                            <FormSelect
                                name="selectedSection"
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                options={sections?.map((s) => ({
                                    label: s.section_name || '',
                                    value: String(s.id),
                                }))}
                                placeholder="Select section"
                                required
                                disabled={!selectedClass}
                            />
                        </FormField>

                        <FormField label="Semester" required>
                            <FormSelect
                                name="semester"
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                options={[
                                    { label: 'Semester 1', value: '1' },
                                    { label: 'Semester 2', value: '2' },
                                ]}
                                required
                            />
                        </FormField>

                        <FormField label="Academic Year" required>
                            <FormInput
                                type="text"
                                value={academicYearId || ''}
                                disabled
                                placeholder="From profile"
                            />
                        </FormField>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="primary"
                            onClick={() => setActiveStep(1)}
                            disabled={!selectedClass || !selectedSection || !semester}
                        >
                            Next: Period Configuration →
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 1: Period Configuration */}
            {activeStep === 1 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Step 2: Period Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Period Duration (minutes)" required>
                            <FormInput
                                type="number"
                                name="period_duration"
                                value={periodConfig.period_duration}
                                onChange={handlePeriodConfigChange}
                                min="30"
                                max="90"
                                required
                            />
                        </FormField>

                        <FormField label="Total Periods" required>
                            <FormInput
                                type="number"
                                name="total_periods"
                                value={periodConfig.total_periods}
                                onChange={handlePeriodConfigChange}
                                min="4"
                                max="10"
                                required
                            />
                        </FormField>

                        <FormField label="School Start Time" required>
                            <FormInput
                                type="time"
                                name="school_start_time"
                                value={periodConfig.school_start_time}
                                onChange={handlePeriodConfigChange}
                                required
                            />
                        </FormField>

                        <FormField label="Lunch Start Time" required>
                            <FormInput
                                type="time"
                                name="lunch_start_time"
                                value={periodConfig.lunch_start_time}
                                onChange={handlePeriodConfigChange}
                                required
                            />
                        </FormField>

                        <FormField label="Lunch Duration (minutes)" required>
                            <FormInput
                                type="number"
                                name="lunch_duration"
                                value={periodConfig.lunch_duration}
                                onChange={handlePeriodConfigChange}
                                min="15"
                                max="60"
                                required
                            />
                        </FormField>
                    </div>

                    <div className="flex justify-between">
                        <Button variant="secondary" onClick={() => setActiveStep(0)}>
                            ← Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleGenerateTimeSlots}
                            disabled={generating}
                        >
                            {generating ? 'Generating...' : 'Generate Time Slots →'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Create Timetable */}
            {activeStep === 2 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Step 3: Create Timetable
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Click on any cell to assign a subject
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setActiveStep(1);
                                    setTimeSlots([]);
                                }}
                            >
                                ← Back
                            </Button>
                            <Button
                                variant="success"
                                size="sm"
                                onClick={handleValidate}
                                disabled={validating || Object.keys(timetableEntries).length === 0}
                            >
                                {validating ? 'Validating...' : 'Validate & Proceed →'}
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

                    {/* Timetable Grid */}
                    <TimetableGrid
                        timeSlots={timeSlots}
                        entries={timetableEntries}
                        onCellClick={handleCellClick}
                    />
                </div>
            )}

            {/* Step 3: Validate & Save */}
            {activeStep === 3 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Step 4: Validate & Save
                    </h3>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-green-700 dark:text-green-300 font-semibold">
                            ✓ Timetable validation passed! You can now save it.
                        </p>
                    </div>

                    <div className="flex justify-between items-center">
                        <Button
                            variant="secondary"
                            onClick={() => setActiveStep(2)}
                        >
                            ← Edit Timetable
                        </Button>

                        <div className="flex gap-3">
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
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save & Publish'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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

export default TimetableCreate;
