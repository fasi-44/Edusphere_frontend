/**
 * Exam Form Page
 * Create and edit exam configurations/types
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    FormField,
    FormInput,
    FormSelect,
    LoadingSpinner,
} from '@/components';
import { examService } from '@/services/modules/examService';

interface IExamConfig {
    id?: number;
    exam_name: string;
    exam_code: string;
    exam_category: string;
    sequence_order: number;
}

interface IFormErrors {
    [key: string]: string;
}

const ExamForm: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    // State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState<IExamConfig>({
        exam_name: '',
        exam_code: '',
        exam_category: 'Formative',
        sequence_order: 1,
    });

    const [errors, setErrors] = useState<IFormErrors>({});

    // Fetch exam data if editing
    useEffect(() => {
        if (isEditMode && id) {
            const fetchExam = async () => {
                setLoading(true);
                try {
                    const exam = await examService.getById(id);
                    setFormData({
                        id: Number(exam.id) || undefined,
                        exam_name: exam.exam_name || '',
                        exam_code: exam.exam_code || '',
                        exam_category: exam.exam_category || 'Formative',
                        sequence_order: exam.sequence_order ?? 1,
                    });
                } catch (err: any) {
                    setError(err.message || 'Failed to load exam');
                } finally {
                    setLoading(false);
                }
            };
            fetchExam();
        }
    }, [id, isEditMode]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: IFormErrors = {};

        // Exam name validation
        if (!formData.exam_name.trim()) {
            newErrors.exam_name = 'Exam name is required';
        } else if (formData.exam_name.length < 3) {
            newErrors.exam_name = 'Exam name must be at least 3 characters';
        }

        // Exam code validation
        if (!formData.exam_code.trim()) {
            newErrors.exam_code = 'Exam code is required';
        } else if (formData.exam_code.length < 2) {
            newErrors.exam_code = 'Exam code must be at least 2 characters';
        }

        // Category validation
        if (!formData.exam_category) {
            newErrors.exam_category = 'Category is required';
        }

        // Sequence order validation
        if (formData.sequence_order < 1) {
            newErrors.sequence_order = 'Sequence order must be at least 1';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'sequence_order' ? parseInt(value) : value,
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode && formData.id) {
                await examService.update(String(formData.id), formData as any);
                toast.success('Exam type updated successfully');
            } else {
                await examService.create(formData as any);
                toast.success('Exam type created successfully');
            }
            setTimeout(() => navigate('/exams'), 1500);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save exam type');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading spinner while fetching data in edit mode
    if (isEditMode && loading && !formData.id) {
        return <LoadingSpinner fullHeight message="Loading exam..." />;
    }

    // Show error message
    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Exam Management"
                    subtitle="Create and manage exam types"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Exams', href: '/exams' },
                        { label: isEditMode ? 'Edit' : 'New', href: '#' },
                    ]}
                />
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button variant="secondary" onClick={() => navigate('/exams')}>
                        Back to Exams
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={isEditMode ? 'Edit Exam Type' : 'Create New Exam Type'}
                subtitle={
                    isEditMode
                        ? `Update exam type: ${formData.exam_name}`
                        : 'Create a new exam type/category'
                }
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Exams Types & Configs', href: '/exams' },
                    { label: isEditMode ? 'Edit' : 'New', href: '#' },
                ]}
            />

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Exam Name */}
                    <FormField
                        label="Exam Name"
                        required
                        error={errors.exam_name}
                    >
                        <FormInput
                            name="exam_name"
                            type="text"
                            value={formData.exam_name}
                            onChange={handleInputChange}
                            placeholder="e.g., First Term Exam, Mid-Term Assessment"
                            error={Boolean(errors.exam_name)}
                            required
                        />
                    </FormField>

                    {/* Exam Code */}
                    <FormField
                        label="Exam Code"
                        required
                        error={errors.exam_code}
                    >
                        <FormInput
                            name="exam_code"
                            type="text"
                            value={formData.exam_code}
                            onChange={handleInputChange}
                            placeholder="e.g., FTE1, MT1, FA1"
                            error={Boolean(errors.exam_code)}
                            required
                        />
                    </FormField>

                    {/* Category and Sequence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <FormField
                            label="Category"
                            required
                            error={errors.exam_category}
                        >
                            <FormSelect
                                name="exam_category"
                                value={formData.exam_category}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Formative', label: 'Formative Assessment' },
                                    { value: 'Summative', label: 'Summative Assessment' },
                                    { value: 'Annual', label: 'Annual' },
                                ]}
                                required
                            />
                        </FormField>

                        {/* Sequence Order */}
                        <FormField
                            label="Sequence Order"
                            required
                            error={errors.sequence_order}
                        >
                            <FormInput
                                name="sequence_order"
                                type="number"
                                value={String(formData.sequence_order)}
                                onChange={handleInputChange}
                                placeholder="1, 2, 3..."
                                error={Boolean(errors.sequence_order)}
                                required
                                min="1"
                            />
                        </FormField>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/exams')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isSubmitting}
                            loadingText={isEditMode ? 'Updating...' : 'Creating...'}
                        >
                            {isEditMode ? 'Update Exam Type' : 'Create Exam Type'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> Create exam types/categories that will be used across the school.
                    Examples: Formative Assessment 1, First Term Exam, Final Exam, etc.
                </p>
            </div>
        </div>
    );
};

export default ExamForm;
