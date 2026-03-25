/**
 * Reusable Student Exam Timetable Modal
 * Shows exam timetable for a selected student with print support.
 * Used in StudentList and FeeCollection pages.
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, FormField, FormSelect, PrintActions, LoadingSpinner, DataTable } from '@/components';
import { examService } from '@/services/modules/examService';
import { useAuthStore } from '@/stores/authStore';
import { generateExamTimetablePdf } from '@/prints';
import type { SchoolData, PdfAction } from '@/prints';

export interface StudentExamTimetableModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: {
        id: number;
        full_name?: string;
        name?: string;
        class_name?: string;
        class?: string | { class_name?: string; name?: string };
        section_name?: string;
        section?: string | { section_name?: string; name?: string };
    } | null;
}

const StudentExamTimetableModal: FC<StudentExamTimetableModalProps> = ({ isOpen, onClose, student }) => {
    const currentAcademicYear = useAuthStore(s => s.user?.current_academic_year);

    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [selectedExamType, setSelectedExamType] = useState('');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [examTypesLoaded, setExamTypesLoaded] = useState(false);

    // Load exam types when modal opens
    useEffect(() => {
        if (isOpen && !examTypesLoaded) {
            loadExamTypes();
        }
        if (!isOpen) {
            setSelectedExamType('');
            setEntries([]);
        }
    }, [isOpen]);

    const loadExamTypes = async () => {
        try {
            const res = await examService.list();
            setExamTypes(Array.isArray(res) ? res : res?.data || []);
            setExamTypesLoaded(true);
        } catch {
            toast.error('Failed to load exam types');
        }
    };

    const handleExamTypeChange = async (examTypeId: string) => {
        setSelectedExamType(examTypeId);
        if (!examTypeId || !student) {
            setEntries([]);
            return;
        }
        setLoading(true);
        try {
            const data = await examService.getStudentExamTimetable(
                student.id,
                Number(examTypeId),
                currentAcademicYear?.id
            );
            setEntries(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load student timetable');
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const getStudentClassName = (): string => {
        if (!student) return '';
        if (entries.length > 0 && entries[0].class_name) return entries[0].class_name;
        if (student.class_name) return student.class_name;
        if (typeof student.class === 'string') return student.class;
        if (student.class && typeof student.class === 'object') return student.class.class_name || student.class.name || '';
        return '';
    };

    const getStudentSectionName = (): string | undefined => {
        if (!student) return undefined;
        if (entries.length > 0 && entries[0].section_name) return entries[0].section_name;
        if (student.section_name) return student.section_name;
        if (typeof student.section === 'string') return student.section;
        if (student.section && typeof student.section === 'object') return student.section.section_name || student.section.name || undefined;
        return undefined;
    };

    const handlePrint = async (action: PdfAction) => {
        if (entries.length === 0) {
            toast.error('No timetable entries to print');
            return;
        }
        try {
            const examName = examTypes.find(e => String(e.id) === selectedExamType)?.exam_name || '';
            const studentName = student?.full_name || student?.name || '';

            const authUser = useAuthStore.getState().user;
            const schoolData: SchoolData = {
                schoolName: authUser?.school_name || 'School Name',
                schoolAddress: '',
                schoolPhone: '',
                schoolEmail: authUser?.email || '',
                logo: null,
                generatedBy: authUser?.full_name || authUser?.name || 'System',
            };

            await generateExamTimetablePdf(
                {
                    examName,
                    className: getStudentClassName(),
                    sectionName: getStudentSectionName(),
                    studentName,
                    entries,
                },
                schoolData,
                action
            );
            toast.success(
                action === 'download' ? 'PDF downloaded' :
                action === 'print' ? 'Sent to printer' : 'PDF opened'
            );
        } catch {
            toast.error('Failed to generate PDF');
        }
    };

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

    const notAssigned = <span className="text-yellow-600 dark:text-yellow-400 text-xs">Not assigned</span>;

    const columns = [
        {
            key: 'subject_name',
            label: 'Subject',
            render: (value: any) => <span className="font-medium">{value}</span>,
        },
        {
            key: 'exam_date',
            label: 'Date',
            render: (value: any) => formatDate(value),
        },
        {
            key: 'start_time',
            label: 'Time',
            render: (_: any, row: any) => `${formatTime(row.start_time)} - ${formatTime(row.end_time)}`,
        },
        {
            key: 'room',
            label: 'Room',
            render: (value: any) => value
                ? <span className="text-blue-600 dark:text-blue-400 font-medium">{value}</span>
                : notAssigned,
        },
        {
            key: 'seat_label',
            label: 'Seat',
            render: (value: any) => value
                ? <span className="text-purple-600 dark:text-purple-400 font-medium">{value}</span>
                : notAssigned,
        },
        {
            key: 'invigilator_name',
            label: 'Invigilator',
        },
    ];

    const renderMobileCards = () => (
        <div className="space-y-3 md:hidden">
            {entries.map((entry: any) => (
                <div
                    key={entry.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                    <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-2">
                        {entry.subject_name}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-xs">Date</span>
                            <span className="text-gray-900 dark:text-white">{formatDate(entry.exam_date)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-xs">Time</span>
                            <span className="text-gray-900 dark:text-white">{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-xs">Room</span>
                            {entry.room
                                ? <span className="text-blue-600 dark:text-blue-400 font-medium">{entry.room}</span>
                                : notAssigned
                            }
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-xs">Seat</span>
                            {entry.seat_label
                                ? <span className="text-purple-600 dark:text-purple-400 font-medium">{entry.seat_label}</span>
                                : notAssigned
                            }
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400 block text-xs">Invigilator</span>
                            <span className="text-gray-900 dark:text-white">{entry.invigilator_name || '-'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Exam Timetable - ${student?.full_name || student?.name || ''}`}
            size="5xl"
        >
            <div className="space-y-4">
                <FormField label="Select Exam Type" required>
                    <FormSelect
                        value={selectedExamType}
                        onChange={(e) => handleExamTypeChange(e.target.value)}
                        placeholder="Choose an exam"
                        options={examTypes.map((e: any) => ({
                            value: String(e.id),
                            label: e.exam_name,
                        }))}
                    />
                </FormField>

                {selectedExamType && (
                    <>
                        {entries.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {entries.length} subject{entries.length !== 1 ? 's' : ''} scheduled
                                </p>
                                <PrintActions onAction={handlePrint} />
                            </div>
                        )}

                        {loading ? (
                            <LoadingSpinner message="Loading timetable..." />
                        ) : entries.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No exam timetable found for this student.
                            </div>
                        ) : (
                            <>
                                {renderMobileCards()}
                                <div className="hidden md:block">
                                    <DataTable
                                        columns={columns}
                                        data={entries}
                                        emptyMessage="No exam timetable found for this student."
                                        striped
                                        hover={false}
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default StudentExamTimetableModal;
