/**
 * Subject Dialog Component
 * Modal dialog for assigning subjects and teachers to timetable slots
 */

import { FC, useState, useEffect } from 'react';
import { Modal, Button, FormField, FormSelect } from '../index';
import { ISubject, IUser, ITimetableEntry } from '../../types/index';

export interface IRoom {
    id: number;
    room_name: string;
    room_type?: string;
    capacity?: number;
}

export interface ISubjectDialogProps {
    isOpen: boolean;
    day: string;
    timeSlot: string;
    existingEntry?: ITimetableEntry;
    subjects: ISubject[];
    teachers: IUser[];
    rooms?: IRoom[];
    onClose: () => void;
    onSave: (entry: Partial<ITimetableEntry>) => void;
    onDelete?: () => void;
    loading?: boolean;
}

const CLASS_TYPES = [
    { label: 'Regular', value: 'Regular' },
    { label: 'Lab', value: 'Lab' },
    { label: 'Tutorial', value: 'Tutorial' },
    { label: 'Practical', value: 'Practical' },
];

const SubjectDialog: FC<ISubjectDialogProps> = ({
    isOpen,
    day,
    timeSlot,
    existingEntry,
    subjects,
    teachers,
    rooms = [],
    onClose,
    onSave,
    onDelete,
    loading = false,
}) => {
    const [formData, setFormData] = useState({
        subjectId: '',
        teacherId: '',
        room: '',
        type: 'Regular',
    });

    useEffect(() => {
        if (existingEntry) {
            setFormData({
                subjectId: String(existingEntry.subject.id),
                teacherId: String(existingEntry.teacher.id),
                room: existingEntry.room || '',
                type: existingEntry.type || 'Regular',
            });
        } else {
            setFormData({
                subjectId: '',
                teacherId: '',
                room: '',
                type: 'Regular',
            });
        }
    }, [existingEntry, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = () => {
        if (!formData.subjectId || !formData.teacherId) {
            alert('Please select both subject and teacher');
            return;
        }

        // Convert both to strings for comparison (handle number/string ID type mismatch)
        const selectedSubject = subjects.find((s) => String(s.id) === String(formData.subjectId));
        const selectedTeacher = teachers.find((t) => String(t.id) === String(formData.teacherId));

        if (!selectedSubject || !selectedTeacher) {
            alert('Invalid subject or teacher selection');
            return;
        }

        onSave({
            subject: selectedSubject,
            teacher: selectedTeacher,
            room: formData.room,
            type: formData.type as 'Regular' | 'Lab' | 'Tutorial' | 'Practical',
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={existingEntry ? 'Edit Time Slot' : 'Add Subject to Time Slot'}
            size="md"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <div>
                        {existingEntry && onDelete && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={onDelete}
                                disabled={loading}
                            >
                                Delete
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            disabled={loading || !formData.subjectId || !formData.teacherId}
                        >
                            {loading ? 'Saving...' : existingEntry ? 'Update' : 'Add'}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Time Slot Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Time Slot Details</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {day} - {timeSlot}
                    </p>
                </div>

                {/* Subject Selection */}
                <FormField label="Subject" required>
                    <FormSelect
                        name="subjectId"
                        value={formData.subjectId}
                        onChange={handleChange}
                        options={subjects.map((s) => ({
                            label: `${s.subject_name} (${s.subject_code})`,
                            value: String(s.id),
                        }))}
                        placeholder="Select subject"
                        required
                    />
                </FormField>

                {/* Teacher Selection */}
                <FormField label="Teacher" required>
                    <FormSelect
                        name="teacherId"
                        value={formData.teacherId}
                        onChange={handleChange}
                        options={teachers.map((t) => ({
                            label: t.full_name || t.name,
                            value: String(t.id),
                        }))}
                        placeholder="Select teacher"
                        required
                        disabled={!formData.subjectId}
                    />
                </FormField>

                {/* Room Selection */}
                <FormField label="Room">
                    <FormSelect
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        placeholder="Select room"
                        options={rooms.map((r) => ({
                            label: `${r.room_name}${r.room_type ? ` (${r.room_type})` : ''}${r.capacity ? ` - ${r.capacity} seats` : ''}`,
                            value: r.room_name,
                        }))}
                    />
                </FormField>

                {/* Class Type */}
                <FormField label="Class Type">
                    <FormSelect
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        options={CLASS_TYPES}
                    />
                </FormField>
            </div>
        </Modal>
    );
};

export default SubjectDialog;
