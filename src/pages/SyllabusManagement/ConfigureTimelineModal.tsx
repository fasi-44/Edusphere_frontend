import React, { FC, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal, Button } from '../../components';
import { syllabusService } from '../../services/modules/syllabusService';

interface ConfigureTimelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    itemType: 'lesson' | 'topic' | 'subtopic';
    itemId: string;
    itemTitle: string;
    existingDates?: {
        planned_start_date?: string;
        planned_end_date?: string;
        teacher_notes?: string;
    };
}

const ConfigureTimelineModal: FC<ConfigureTimelineModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    itemType,
    itemId,
    itemTitle,
    existingDates,
}) => {
    const [plannedStartDate, setPlannedStartDate] = useState('');
    const [plannedEndDate, setPlannedEndDate] = useState('');
    const [teacherNotes, setTeacherNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setPlannedStartDate(existingDates?.planned_start_date || '');
            setPlannedEndDate(existingDates?.planned_end_date || '');
            setTeacherNotes(existingDates?.teacher_notes || '');
            setErrors({});
        }
    }, [isOpen, existingDates]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!plannedStartDate) {
            newErrors.planned_start_date = 'Start date is required';
        }
        if (!plannedEndDate) {
            newErrors.planned_end_date = 'End date is required';
        }
        if (plannedStartDate && plannedEndDate && new Date(plannedStartDate) > new Date(plannedEndDate)) {
            newErrors.planned_end_date = 'End date must be on or after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            await syllabusService.configureTimeline(itemType, itemId, {
                planned_start_date: plannedStartDate,
                planned_end_date: plannedEndDate,
                teacher_notes: teacherNotes || undefined,
            });
            toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} timeline configured`);
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Failed to configure timeline');
        } finally {
            setLoading(false);
        }
    };

    const typeLabel = itemType.charAt(0).toUpperCase() + itemType.slice(1);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Configure ${typeLabel} Timeline`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="px-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Set planned dates for: <strong className="text-gray-900 dark:text-white">{itemTitle}</strong>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Planned Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={plannedStartDate}
                            onChange={(e) => {
                                setPlannedStartDate(e.target.value);
                                if (errors.planned_start_date) setErrors((prev) => ({ ...prev, planned_start_date: '' }));
                            }}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                                errors.planned_start_date
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                        />
                        {errors.planned_start_date && (
                            <p className="mt-1 text-sm text-red-500">{errors.planned_start_date}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Planned End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={plannedEndDate}
                            onChange={(e) => {
                                setPlannedEndDate(e.target.value);
                                if (errors.planned_end_date) setErrors((prev) => ({ ...prev, planned_end_date: '' }));
                            }}
                            min={plannedStartDate || undefined}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                                errors.planned_end_date
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                        />
                        {errors.planned_end_date && (
                            <p className="mt-1 text-sm text-red-500">{errors.planned_end_date}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Notes (optional)
                    </label>
                    <textarea
                        value={teacherNotes}
                        onChange={(e) => setTeacherNotes(e.target.value)}
                        rows={3}
                        placeholder="Add any planning notes..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={loading}
                        loadingText="Saving..."
                    >
                        {existingDates?.planned_start_date ? 'Update Timeline' : 'Configure Timeline'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ConfigureTimelineModal;
