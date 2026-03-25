/**
 * Teacher Invigilator Schedule
 * Shows a teacher's assigned invigilator slots with room, class, and subject details.
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Badge,
    LoadingSpinner,
    EmptyState,
    FormField,
    FormSelect,
} from '@/components';
import { examService } from '@/services/modules/examService';
import { useAuthStore } from '@/stores/authStore';

interface IInvigilatorSlot {
    id: number;
    exam_date: string;
    start_time: string;
    end_time: string;
    room: string | null;
    room_capacity: number | null;
    subjects: string[];
    classes: string[];
    student_count: number;
    notes: string | null;
}

const TeacherInvigilatorSchedule: FC = () => {
    const user = useAuthStore((s) => s.user);
    const currentAcademicYear = useAuthStore((s) => s.user?.current_academic_year);
    const academicYearVersion = useAuthStore((s) => s.academicYearVersion);

    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [selectedExamType, setSelectedExamType] = useState('');
    const [slots, setSlots] = useState<IInvigilatorSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        fetchExamTypes();
    }, []);

    useEffect(() => {
        if (selectedExamType) {
            fetchSchedule();
        } else {
            setSlots([]);
        }
    }, [selectedExamType, academicYearVersion]);

    const fetchExamTypes = async () => {
        try {
            const res = await examService.list();
            setExamTypes(Array.isArray(res) ? res : res?.data || []);
        } catch {
            toast.error('Failed to load exam types');
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchSchedule = async () => {
        if (!user?.school_user_id || !selectedExamType) return;
        setLoading(true);
        try {
            const data = await examService.getInvigilatorSchedule(
                user.school_user_id,
                Number(selectedExamType),
                currentAcademicYear?.id
            );
            setSlots(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load invigilator schedule');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (t: string) => {
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    if (initialLoading) {
        return <LoadingSpinner fullHeight message="Loading..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Invigilator Schedule"
                subtitle="View your assigned exam invigilation duties"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'My Invigilator Schedule', href: '#' },
                ]}
            />

            {/* Exam Type Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="max-w-sm">
                    <FormField label="Select Exam" required>
                        <FormSelect
                            value={selectedExamType}
                            onChange={(e) => setSelectedExamType(e.target.value)}
                            placeholder="Choose an exam"
                            options={examTypes.map(e => ({
                                value: String(e.id),
                                label: e.exam_name,
                            }))}
                        />
                    </FormField>
                </div>
            </div>

            {/* Schedule */}
            {!selectedExamType ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
                    <p className="text-4xl mb-4">🏫</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Select an Exam
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Choose an exam type above to view your invigilation duties.
                    </p>
                </div>
            ) : loading ? (
                <LoadingSpinner message="Loading your schedule..." />
            ) : slots.length === 0 ? (
                <EmptyState
                    icon="📋"
                    title="No Duties Assigned"
                    description="You have not been assigned as an invigilator for this exam."
                />
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {slots.length} session{slots.length !== 1 ? 's' : ''} assigned
                        </p>
                    </div>

                    <div className="grid gap-3">
                        {slots.map((slot) => (
                            <div
                                key={slot.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                            >
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatDate(slot.exam_date)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                                        </p>
                                    </div>
                                    <Badge variant={slot.room ? 'success' : 'warning'}>
                                        {slot.room ? 'Room Assigned' : 'Pending'}
                                    </Badge>
                                </div>

                                {/* Details grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Room</span>
                                        {slot.room
                                            ? <span className="text-blue-600 dark:text-blue-400 font-medium">{slot.room}</span>
                                            : <span className="text-yellow-600 dark:text-yellow-400 text-xs">Not assigned</span>
                                        }
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Capacity</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {slot.student_count}{slot.room_capacity ? ` / ${slot.room_capacity}` : ''} students
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Classes</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {slot.classes.length > 0 ? slot.classes.join(', ') : '-'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-4">
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">Subjects</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {slot.subjects.length > 0
                                                ? slot.subjects.map((s) => (
                                                    <span
                                                        key={s}
                                                        className="inline-block px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                                    >
                                                        {s}
                                                    </span>
                                                ))
                                                : <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
                                            }
                                        </div>
                                    </div>
                                </div>

                                {slot.notes && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                        {slot.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherInvigilatorSchedule;
