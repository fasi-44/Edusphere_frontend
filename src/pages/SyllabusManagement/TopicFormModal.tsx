import React, { FC, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal, Button } from '../../components';
import { syllabusService } from '../../services/modules/syllabusService';
import { ITopic, ITopicFormData, SyllabusStatus } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface TopicFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: string;
    topic?: ITopic | null;
    onSuccess: () => void;
}

const TopicFormModal: FC<TopicFormModalProps> = ({
    isOpen,
    onClose,
    lessonId,
    topic,
    onSuccess,
}) => {
    const { user } = useAuthStore();
    const isTeacher = user?.role === 'TEACHER';
    const isEditMode = !!topic?.id;

    const [formData, setFormData] = useState<ITopicFormData>({
        title: '',
        description: '',
        estimated_duration_hours: undefined,
        status: SyllabusStatus.PLANNED,
        planned_start_date: '',
        planned_end_date: '',
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (topic) {
                setFormData({
                    title: topic.title || '',
                    description: topic.description || '',
                    estimated_duration_hours: topic.estimated_duration_hours,
                    status: topic.status || SyllabusStatus.PLANNED,
                    planned_start_date: topic.planned_start_date || '',
                    planned_end_date: topic.planned_end_date || '',
                });
            } else {
                resetForm();
            }
        }
    }, [isOpen, topic]);

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            estimated_duration_hours: undefined,
            status: SyllabusStatus.PLANNED,
            planned_start_date: '',
            planned_end_date: '',
        });
        setErrors({});
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        }

        if (formData.planned_start_date && formData.planned_end_date) {
            if (new Date(formData.planned_start_date) > new Date(formData.planned_end_date)) {
                newErrors.planned_end_date = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const payload: ITopicFormData = {
                ...formData,
                estimated_duration_hours: formData.estimated_duration_hours || 0,
            };

            if (isEditMode && topic) {
                await syllabusService.updateTopic(topic.id, payload);
                toast.success('Topic updated successfully');
            } else {
                await syllabusService.createTopic(lessonId, payload);
                toast.success('Topic created successfully');
            }

            onSuccess();
        } catch (err: any) {
            toast.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} topic`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Topic' : 'Add New Topic'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Topic Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter topic title"
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                            errors.title
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Enter topic description"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Estimated Duration */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Estimated Duration (hours)
                    </label>
                    <input
                        type="number"
                        name="estimated_duration_hours"
                        value={formData.estimated_duration_hours || ''}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        placeholder="Enter hours"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Teacher-specific fields (only shown for teachers in edit mode) */}
                {isTeacher && isEditMode && (
                    <>
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={SyllabusStatus.PLANNED}>Planned</option>
                                <option value={SyllabusStatus.IN_PROGRESS}>In Progress</option>
                                <option value={SyllabusStatus.COMPLETED}>Completed</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Planned Start Date
                                </label>
                                <input
                                    type="date"
                                    name="planned_start_date"
                                    value={formData.planned_start_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Planned End Date
                                </label>
                                <input
                                    type="date"
                                    name="planned_end_date"
                                    value={formData.planned_end_date}
                                    onChange={handleChange}
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
                    </>
                )}

                {/* Form Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={loading}
                        loadingText={isEditMode ? 'Updating...' : 'Adding...'}
                    >
                        {isEditMode ? 'Update Topic' : 'Add Topic'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default TopicFormModal;
