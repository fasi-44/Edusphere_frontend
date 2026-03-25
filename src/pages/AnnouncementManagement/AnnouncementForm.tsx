/**
 * Announcement Form Page
 * Create and edit announcements with role-based target audience selection
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
} from '../../components';
import MultiSelect from '../../components/form/MultiSelect';
import { announcementService } from '../../services/modules/announcementService';
import { classService } from '../../services/modules/classService';
import { useAuthStore } from '@/stores/authStore';
import { IAnnouncement, AnnouncementPriority } from '../../types/index';

interface IFormData {
    title: string;
    description: string;
    announcement_type: string;
    priority: AnnouncementPriority;
    target_audience: string;
    target_classes: string[];
    target_sections: string[];
    publish_date: string;
    expiry_date: string;
    academic_year_id?: number;
    created_by?: number;
    is_published?: boolean;
}

interface IFormErrors {
    [key: string]: string;
}

const AnnouncementForm: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { user, academicYearVersion } = useAuthStore();

    // State
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<IAnnouncement | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState<IFormData>({
        title: '',
        description: '',
        announcement_type: 'General',
        priority: AnnouncementPriority.MEDIUM,
        target_audience: 'All Users',
        target_classes: [],
        target_sections: [],
        publish_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const [errors, setErrors] = useState<IFormErrors>({});

    // Fetch announcement data if editing and fetch classes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Always fetch classes for both create and edit modes
                const classResponse = await classService.list();
                setClasses(classResponse.data || []);

                // If editing, fetch announcement data
                if (isEditMode && id) {
                    const announcement = await announcementService.getById(id);
                    setSelectedAnnouncement(announcement);
                    setFormData({
                        title: announcement.title,
                        description: announcement.description || '',
                        announcement_type: announcement.announcement_type || 'General',
                        priority: announcement.priority,
                        target_audience: announcement.target_audience as string,
                        target_classes: announcement.target_classes?.map(c => c.toString()) || [],
                        target_sections: announcement.target_sections?.map(s => s.toString()) || [],
                        publish_date: announcement.publish_date?.split('T')[0] || '',
                        expiry_date: announcement.expiry_date?.split('T')[0] || '',
                    });

                    // If editing and has target classes, fetch their sections
                    if (announcement.target_classes && announcement.target_classes.length > 0) {
                        setSelectedClasses(announcement.target_classes.map(c => c.toString()));
                        await fetchSections(announcement.target_classes.map(c => c.toString()));
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditMode, academicYearVersion]);

    // Handle target audience change
    useEffect(() => {
        if (formData.target_audience !== 'Specific Classes' && formData.target_audience !== 'Specific Sections') {
            setClasses([]);
            setSections([]);
            setSelectedClasses([]);
            setFormData((prev) => ({
                ...prev,
                target_classes: [],
                target_sections: [],
            }));
        }
    }, [formData.target_audience]);

    // Fetch sections when classes are selected
    useEffect(() => {
        if (formData.target_audience === 'Specific Sections' && selectedClasses.length > 0) {
            fetchSections(selectedClasses);
        } else if (formData.target_audience !== 'Specific Sections') {
            setSections([]);
        }
    }, [selectedClasses, formData.target_audience]);

    const fetchSections = async (classIds: string[]) => {
        try {
            setLoading(true);
            const allSections: any[] = [];

            for (const classId of classIds) {
                const response = await classService.getSections(classId);
                if (Array.isArray(response)) {
                    allSections.push(...response);
                }
            }

            setSections(allSections);
        } catch (err: any) {
            toast.error('Failed to load sections');
            console.error(err.message);
            setSections([]);
        } finally {
            setLoading(false);
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: IFormErrors = {};

        // Title validation
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length < 5) {
            newErrors.title = 'Title must be at least 5 characters';
        }

        // Description validation
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 20) {
            newErrors.description = 'Description must be at least 20 characters';
        }

        // Announcement type validation
        if (!formData.announcement_type.trim()) {
            newErrors.announcement_type = 'Announcement type is required';
        }

        // Target audience validation
        if (!formData.target_audience) {
            newErrors.target_audience = 'Target audience is required';
        }

        // Classes validation for specific classes/sections
        if (formData.target_audience === 'Specific Classes' && formData.target_classes.length === 0) {
            newErrors.target_classes = 'Please select at least one class';
        }

        if (formData.target_audience === 'Specific Sections' && formData.target_sections.length === 0) {
            newErrors.target_sections = 'Please select at least one section';
        }

        // Publish date validation
        if (!formData.publish_date) {
            newErrors.publish_date = 'Publishing date is required';
        }

        // Expiry date validation
        if (!formData.expiry_date) {
            newErrors.expiry_date = 'Expiry date is required';
        } else if (formData.expiry_date < formData.publish_date) {
            newErrors.expiry_date = 'Expiry date must be after publishing date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    // Handle priority change
    const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData((prev) => ({
            ...prev,
            priority: e.target.value as AnnouncementPriority,
        }));
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
            const authUser = useAuthStore.getState().user;

            // Validate academic year
            if (!authUser?.current_academic_year?.id) {
                toast.error('⚠️ No academic year selected. Please select an academic year from the header.');
                setIsSubmitting(false);
                return;
            }

            const payload = {
                ...formData,
                target_classes: formData.target_classes.map(id => parseInt(id)),
                target_sections: formData.target_sections.map(id => parseInt(id)),
                academic_year_id: authUser.current_academic_year.id,
                created_by: authUser?.school_user_id,
                is_published: true,
            };

            let response;
            if (isEditMode && id) {
                response = await announcementService.update(id, payload as any);
                toast.success('✅ Announcement updated successfully');
            } else {
                response = await announcementService.create(payload as any);
                toast.success('✅ Announcement published successfully');
            }
            if (response) {
                navigate('/announcements')
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to save announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading spinner while fetching data in edit mode
    if (isEditMode && loading && !selectedAnnouncement) {
        return <LoadingSpinner fullHeight message="Loading announcement..." />;
    }

    // Show error message
    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Announcement Management"
                    subtitle="Create and manage announcements"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Announcements', href: '/announcements' },
                        { label: isEditMode ? 'Edit' : 'New', href: '#' },
                    ]}
                />
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button variant="secondary" onClick={() => navigate('/announcements')}>
                        Back to Announcements
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={isEditMode ? 'Edit Announcement' : 'Create New Announcement'}
                subtitle={
                    isEditMode
                        ? `Update announcement: ${selectedAnnouncement?.title}`
                        : 'Create a new school announcement'
                }
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Announcements', href: '/announcements' },
                    { label: isEditMode ? 'Edit' : 'New', href: '#' },
                ]}
            />

            {/* Academic Year Info */}
            {user?.current_academic_year ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📅</span>
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Academic Year: {user.current_academic_year.year_name}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                This announcement will be created for the current academic year
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                No Academic Year Selected
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                Please select an academic year from the header dropdown before creating an announcement
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Announcement Details
                        </h3>
                        <div className="space-y-6">
                            {/* Title */}
                            <FormField
                                label="Title"
                                required
                                error={errors.title}
                            >
                                <FormInput
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., School Closure - Maintenance"
                                    error={Boolean(errors.title)}
                                    required
                                />
                            </FormField>

                            {/* Description */}
                            <FormField
                                label="Description"
                                required
                                error={errors.description}
                            >
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter announcement description..."
                                    rows={6}
                                    className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 resize-none transition-all duration-200 ${errors.description
                                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    required
                                />
                            </FormField>

                            {/* announcement_type and Priority */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    label="announcement_type"
                                    required
                                    error={errors.announcement_type}
                                >
                                    <FormSelect
                                        name="announcement_type"
                                        value={formData.announcement_type}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'General', label: 'General' },
                                            { value: 'Academic', label: 'Academic' },
                                            { value: 'Examination', label: 'Examination' },
                                            { value: 'Event', label: 'Event' },
                                            { value: 'Holiday', label: 'Holiday' },
                                            { value: 'Urgent', label: 'Urgent' },
                                            { value: 'Fee Related', label: 'Fee Related' },
                                            { value: 'Sports', label: 'SPORTS' }
                                        ]}
                                        placeholder="Select announcement_type"
                                        required
                                    />
                                </FormField>

                                <FormField
                                    label="Priority"
                                    required
                                >
                                    <FormSelect
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handlePriorityChange}
                                        options={Object.values(AnnouncementPriority).map((priority) => ({
                                            label:
                                                priority === AnnouncementPriority.LOW
                                                    ? '🟢 Low'
                                                    : priority === AnnouncementPriority.MEDIUM
                                                        ? '🟡 Medium'
                                                        : priority === AnnouncementPriority.HIGH
                                                            ? '🟠 High'
                                                            : '🔴 Urgent',
                                            value: priority,
                                        }))}
                                        required
                                    />
                                </FormField>
                            </div>

                            {/* Publishing Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    label="Publishing Date"
                                    error={errors.publish_date}
                                    required
                                >
                                    <FormInput
                                        name="publish_date"
                                        type="date"
                                        value={formData.publish_date}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.publish_date)}
                                    />
                                </FormField>
                                {/* Expiry Date */}
                                <FormField
                                    label="Expiry or Event Date"
                                    error={errors.expiry_date}
                                    required
                                >
                                    <FormInput
                                        name="expiry_date"
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={handleInputChange}
                                        error={Boolean(errors.expiry_date)}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    {/* Target Audience Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span>👥</span>
                            Target Audience
                        </h3>

                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Select who will receive this announcement
                            </p>
                        </div>

                        {/* Target Audience Selection */}
                        <FormField label="Send To" required error={errors.target_audience}>
                            <FormSelect
                                name="target_audience"
                                value={formData.target_audience}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'All Users', label: 'All Users (Students, Teachers, Parents)' },
                                    { value: 'All Students', label: 'All Students' },
                                    { value: 'All Teachers', label: 'All Teachers' },
                                    { value: 'All Parents', label: 'All Parents' },
                                    { value: 'Specific Classes', label: 'Specific Classes' },
                                    { value: 'Specific Sections', label: 'Specific Sections' }
                                ]}
                                placeholder="Select target audience"
                                required
                            />
                        </FormField>

                        {/* Classes Selection - Show for Specific Classes or Specific Sections */}
                        {(formData.target_audience === 'Specific Classes' || formData.target_audience === 'Specific Sections') && (
                            <div className="mt-4">
                                <MultiSelect
                                    label={formData.target_audience === 'Specific Sections' ? 'Select Classes (Required for sections)' : 'Select Classes *'}
                                    options={classes.map((cls) => ({
                                        text: cls.class_name,
                                        value: cls.id.toString(),
                                    }))}
                                    value={selectedClasses}
                                    onChange={(selected) => {
                                        setSelectedClasses(selected);
                                        setFormData((prev) => ({
                                            ...prev,
                                            target_classes: selected,
                                        }));
                                    }}
                                    placeholder="Select classes to send announcement"
                                    disabled={loading}
                                />
                                {errors.target_classes && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.target_classes}</p>
                                )}
                            </div>
                        )}

                        {/* Sections Selection - Show only for Specific Sections */}
                        {formData.target_audience === 'Specific Sections' && selectedClasses.length > 0 && (
                            <div className="mt-4">
                                <MultiSelect
                                    label="Select Sections *"
                                    options={sections.map((section) => ({
                                        text: `${section.section_name} (${section.teacher_name || 'No teacher'})`,
                                        value: section.id.toString(),
                                    }))}
                                    value={formData.target_sections}
                                    onChange={(selected) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            target_sections: selected,
                                        }));
                                    }}
                                    placeholder="Select sections to send announcement"
                                    disabled={loading}
                                />
                                {errors.target_sections && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.target_sections}</p>
                                )}
                            </div>
                        )}

                        {/* Selected Classes/Sections Display */}
                        {selectedClasses.length > 0 && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">
                                    ✅ Selected {formData.target_audience === 'Specific Sections' && formData.target_sections.length > 0
                                        ? `${formData.target_sections.length} section(s)`
                                        : `${selectedClasses.length} class(es)`}
                                </p>
                                {formData.target_audience === 'Specific Sections' && formData.target_sections.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.target_sections.map((sectionId) => {
                                            const section = sections.find((s) => s.id === parseInt(sectionId));
                                            return (
                                                <span
                                                    key={sectionId}
                                                    className="inline-block px-3 py-1 bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full text-xs font-medium"
                                                >
                                                    {section?.section_name}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedClasses.map((classId) => {
                                            const cls = classes.find((c) => c.id === parseInt(classId));
                                            return (
                                                <span
                                                    key={classId}
                                                    className="inline-block px-3 py-1 bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full text-xs font-medium"
                                                >
                                                    {cls?.class_name}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/announcements')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isSubmitting}
                            loadingText={isEditMode ? 'Updating...' : 'Publishing...'}
                        >
                            {isEditMode ? '📝 Update Announcement' : '✅ Publish Announcement'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> Announcements are only visible to users in the selected target
                    audience. Students will see their announcements on their dashboard feed.
                </p>
            </div>
        </div>
    );
};

export default AnnouncementForm;
