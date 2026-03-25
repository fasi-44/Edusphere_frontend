import React, { FC, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal, Button } from '../../components';
import { syllabusService } from '../../services/modules/syllabusService';
import { ISubtopic, ISubtopicFormData, SyllabusStatus } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface SubtopicFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    topicId: string;
    subtopic?: ISubtopic | null;
    onSuccess: () => void;
}

const SubtopicFormModal: FC<SubtopicFormModalProps> = ({
    isOpen,
    onClose,
    topicId,
    subtopic,
    onSuccess,
}) => {
    const { user } = useAuthStore();
    const isTeacher = user?.role === 'TEACHER';
    const isEditMode = !!subtopic?.id;

    const [formData, setFormData] = useState<ISubtopicFormData>({
        title: '',
        description: '',
        estimated_duration_hours: undefined,
        learning_objectives: '',
        status: SyllabusStatus.PLANNED,
        planned_completion_date: '',
        is_completed: false,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (subtopic) {
                setFormData({
                    title: subtopic.title || '',
                    description: subtopic.description || '',
                    estimated_duration_hours: subtopic.estimated_duration_hours,
                    learning_objectives: subtopic.learning_objectives || '',
                    status: subtopic.status || SyllabusStatus.PLANNED,
                    planned_completion_date: subtopic.planned_completion_date || '',
                    is_completed: subtopic.is_completed || false,
                });
            } else {
                resetForm();
            }
        }
    }, [isOpen, subtopic]);

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            estimated_duration_hours: undefined,
            learning_objectives: '',
            status: SyllabusStatus.PLANNED,
            planned_completion_date: '',
            is_completed: false,
        });
        setErrors({});
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? (value ? parseFloat(value) : undefined) : value,
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

            const payload: ISubtopicFormData = {
                ...formData,
                estimated_duration_hours: formData.estimated_duration_hours || 0,
            };

            if (isEditMode && subtopic) {
                await syllabusService.updateSubtopic(subtopic.id, payload);
                toast.success('Subtopic updated successfully');
            } else {
                await syllabusService.createSubtopic(topicId, payload);
                toast.success('Subtopic created successfully');
            }

            onSuccess();
        } catch (err: any) {
            toast.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} subtopic`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Subtopic' : 'Add New Subtopic'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Subtopic Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter subtopic title"
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
                        placeholder="Enter subtopic description"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Learning Objectives */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Learning Objectives
                    </label>
                    <textarea
                        name="learning_objectives"
                        value={formData.learning_objectives}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Enter learning objectives"
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

                        {/* Planned Completion Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Planned Completion Date
                            </label>
                            <input
                                type="date"
                                name="planned_completion_date"
                                value={formData.planned_completion_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Mark as Completed */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_completed"
                                name="is_completed"
                                checked={formData.is_completed}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                            />
                            <label
                                htmlFor="is_completed"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Mark as completed
                            </label>
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
                        {isEditMode ? 'Update Subtopic' : 'Add Subtopic'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SubtopicFormModal;
