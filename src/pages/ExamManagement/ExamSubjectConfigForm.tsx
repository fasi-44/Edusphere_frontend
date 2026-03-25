/**
 * Exam Subject Configuration Form
 * Modal form for creating and editing exam-subject configurations
 */

import { FC, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Button,
  FormField,
  FormInput,
} from '@/components';
import { examService } from '@/services/modules/examService';

interface IExamSubjectConfig {
  id?: number;
  exam_type_id: number;
  class_id: number;
  section_id?: number;
  subject_id: number;
  has_internal_external: boolean;
  internal_max_marks: number;
  external_max_marks: number;
  total_max_marks: number;
  min_passing_marks: number;
  weightage_percentage: number;
}

interface IFormErrors {
  [key: string]: string;
}

interface ExamSubjectConfigFormProps {
  examTypeId: number;
  classId: number;
  sectionId?: number;
  subjectId: number;
  existingConfig?: IExamSubjectConfig | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ExamSubjectConfigForm: FC<ExamSubjectConfigFormProps> = ({
  examTypeId,
  classId,
  sectionId,
  subjectId,
  existingConfig,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = Boolean(existingConfig?.id);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - initialize with props
  const [formData, setFormData] = useState<IExamSubjectConfig>(() => {
    if (existingConfig) {
      return existingConfig;
    }
    return {
      exam_type_id: examTypeId,
      class_id: classId,
      section_id: sectionId,
      subject_id: subjectId,
      has_internal_external: false,
      internal_max_marks: 0,
      external_max_marks: 0,
      total_max_marks: 100,
      min_passing_marks: 35,
      weightage_percentage: 100,
    };
  });

  const [errors, setErrors] = useState<IFormErrors>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: IFormErrors = {};

    // Total marks validation
    if (!formData.total_max_marks || formData.total_max_marks <= 0) {
      newErrors.total_max_marks = 'Total marks must be greater than 0';
    }

    // Min passing marks validation
    if (!formData.min_passing_marks || formData.min_passing_marks < 0) {
      newErrors.min_passing_marks = 'Minimum passing marks cannot be negative';
    }

    if (formData.min_passing_marks > formData.total_max_marks) {
      newErrors.min_passing_marks = 'Cannot exceed total marks';
    }

    // Internal/External validation
    if (formData.has_internal_external) {
      if (formData.internal_max_marks + formData.external_max_marks !== formData.total_max_marks) {
        newErrors.total_max_marks =
          `Internal (${formData.internal_max_marks}) + External (${formData.external_max_marks}) must equal Total marks (${formData.total_max_marks})`;
      }

      if (formData.internal_max_marks < 0) {
        newErrors.internal_max_marks = 'Internal marks cannot be negative';
      }

      if (formData.external_max_marks < 0) {
        newErrors.external_max_marks = 'External marks cannot be negative';
      }
    } else {
      // If not using internal/external, both should be 0
      if (formData.internal_max_marks !== 0 || formData.external_max_marks !== 0) {
        newErrors.has_internal_external =
          'Internal and external marks should be 0 when not using split marks';
      }
    }

    // Weightage validation
    if (formData.weightage_percentage < 0 || formData.weightage_percentage > 100) {
      newErrors.weightage_percentage = 'Weightage must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let newValue: any = value;
    if (type === 'number') {
      newValue = value ? parseInt(value) : 0;
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: newValue,
      };

      // If total_max_marks changed and internal/external split is enabled, recalculate
      if (name === 'total_max_marks' && prev.has_internal_external) {
        const internal = Math.floor(newValue * 0.4);
        const external = newValue - internal;
        updatedData.internal_max_marks = internal;
        updatedData.external_max_marks = external;
      }

      return updatedData;
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle internal/external toggle
  const handleToggleInternalExternal = () => {
    setFormData((prev) => {
      if (prev.has_internal_external) {
        // Turning off - reset to single marks
        return {
          ...prev,
          has_internal_external: false,
          internal_max_marks: 0,
          external_max_marks: 0,
        };
      } else {
        // Turning on - suggest 40/60 split
        const internal = Math.floor(prev.total_max_marks * 0.4);
        const external = prev.total_max_marks - internal;
        return {
          ...prev,
          has_internal_external: true,
          internal_max_marks: internal,
          external_max_marks: external,
        };
      }
    });

    if (errors.has_internal_external) {
      setErrors((prev) => ({
        ...prev,
        has_internal_external: '',
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
        await examService.updateExamConfig(String(formData.id), formData);
        toast.success('Configuration updated successfully');
      } else {
        await examService.createExamConfig(formData);
        toast.success('Configuration created successfully');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Marks Configuration */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Marks Configuration
        </h3>

        {/* Total Marks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            label="Total Maximum Marks"
            required
            error={errors.total_max_marks}
          >
            <FormInput
              name="total_max_marks"
              type="number"
              value={String(formData.total_max_marks)}
              onChange={handleInputChange}
              placeholder="e.g., 100"
              required
              min="1"
            />
          </FormField>

          <FormField
            label="Minimum Passing Marks"
            required
            error={errors.min_passing_marks}
          >
            <FormInput
              name="min_passing_marks"
              type="number"
              value={String(formData.min_passing_marks)}
              onChange={handleInputChange}
              placeholder="e.g., 35"
              required
              min="0"
            />
          </FormField>
        </div>

        {/* Internal/External Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_internal_external}
              onChange={handleToggleInternalExternal}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Split marks into Internal & External assessment
            </span>
          </label>
          {errors.has_internal_external && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {errors.has_internal_external}
            </p>
          )}
        </div>

        {/* Internal/External Marks */}
        {formData.has_internal_external && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Internal Assessment Marks"
                required
                error={errors.internal_max_marks}
              >
                <FormInput
                  name="internal_max_marks"
                  type="number"
                  value={String(formData.internal_max_marks)}
                  onChange={handleInputChange}
                  placeholder="e.g., 40"
                  required
                  min="0"
                />
              </FormField>

              <FormField
                label="External Exam Marks"
                required
                error={errors.external_max_marks}
              >
                <FormInput
                  name="external_max_marks"
                  type="number"
                  value={String(formData.external_max_marks)}
                  onChange={handleInputChange}
                  placeholder="e.g., 60"
                  required
                  min="0"
                />
              </FormField>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-4">
              <strong>Note:</strong> Internal ({formData.internal_max_marks}) + External (
              {formData.external_max_marks}) must equal Total ({formData.total_max_marks})
            </p>
          </div>
        )}
      </div>

      {/* Section 3: Additional Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Additional Settings
        </h3>

        <FormField
          label="Weightage Percentage"
          error={errors.weightage_percentage}
          help="Percentage weight for grade calculation (0-100)"
        >
          <FormInput
            name="weightage_percentage"
            type="number"
            value={String(formData.weightage_percentage)}
            onChange={handleInputChange}
            placeholder="100"
            min="0"
            max="100"
            step="0.5"
          />
        </FormField>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          onClick={onCancel}
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
          {isEditMode ? 'Update Configuration' : 'Create Configuration'}
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Configuration Scope:</strong> This configuration defines marks allocation and
          assessment scheme for a specific exam, class, and subject combination. Leave Section
          blank to apply the configuration to all sections of the selected class.
        </p>
      </div>
    </form>
  );
};

export default ExamSubjectConfigForm;
