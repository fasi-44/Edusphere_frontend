/**
 * School Form Page
 * Create and edit schools with comprehensive form validation
 */

import { FC, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    FormField,
    FormInput,
    FormSelect,
    LoadingSpinner,
    Modal,
} from '../../components';
import { schoolService } from '../../services/modules/schoolService';
import { userService } from '../../services/modules/userService';
import { ISchool } from '../../types/index';

interface IFormData {
    name: string;
    code: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    website: string;
    plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
}

interface IFormErrors {
    [key: string]: string;
}

const SchoolForm: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    // State
    const [selectedSchool, setSelectedSchool] = useState<ISchool | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<IFormData>({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        website: '',
        plan: 'BASIC',
    });

    const [errors, setErrors] = useState<IFormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track original plan for upgrade detection
    const originalPlan = useRef<string>('');

    // Bulk provisioning modal state
    const [provisionModalOpen, setProvisionModalOpen] = useState(false);
    const [provisionPassword, setProvisionPassword] = useState('');
    const [provisionShowPassword, setProvisionShowPassword] = useState(false);
    const [provisionRoleFilter, setProvisionRoleFilter] = useState('');
    const [provisionLoading, setProvisionLoading] = useState(false);
    const [provisionResult, setProvisionResult] = useState<any>(null);

    // Fetch school data if editing
    useEffect(() => {
        if (isEditMode && id) {
            const fetchSchool = async () => {
                setLoading(true);
                try {
                    const school = await schoolService.getById(id);
                    setSelectedSchool(school);
                    originalPlan.current = (school.plan as string) || 'BASIC';
                    setFormData({
                        name: school.name,
                        code: school.code,
                        email: school.email,
                        phone: school.phone,
                        address: school.address,
                        city: school.city || '',
                        state: school.state || '',
                        country: school.country || '',
                        website: school.website || '',
                        plan: (school.plan as 'BASIC' | 'STANDARD' | 'PREMIUM') || 'BASIC',
                    });
                } catch (err: any) {
                    setError(err.message || 'Failed to load school');
                } finally {
                    setLoading(false);
                }
            };
            fetchSchool();
        }
    }, [id, isEditMode]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: IFormErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'School name is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'School name must be at least 3 characters';
        }

        // Code validation
        if (!formData.code.trim()) {
            newErrors.code = 'School code is required';
        } else if (formData.code.length < 2) {
            newErrors.code = 'School code must be at least 2 characters';
        }

        // Email validation (optional)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email.trim() && !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation (optional)
        if (formData.phone.trim()) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
                newErrors.phone = 'Please enter a valid 10-digit phone number';
            }
        }

        // Address validation
        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        // City validation
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        // State validation
        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }

        // Country validation
        if (!formData.country.trim()) {
            newErrors.country = 'Country is required';
        }

        // Plan validation
        if (!formData.plan) {
            newErrors.plan = 'Please select a subscription plan';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode && id) {
                await schoolService.update(id, formData);
                toast.success('School updated successfully');

                // Check if plan was upgraded from BASIC to STANDARD/PREMIUM
                const wasBasic = originalPlan.current === 'BASIC';
                const isUpgraded = formData.plan === 'STANDARD' || formData.plan === 'PREMIUM';
                if (wasBasic && isUpgraded) {
                    setProvisionModalOpen(true);
                    setProvisionResult(null);
                    setProvisionPassword('');
                    setProvisionRoleFilter('');
                    return; // Don't navigate — show provisioning modal
                }
            } else {
                await schoolService.create(formData as Omit<ISchool, 'id' | 'created_at' | 'updated_at'>);
                toast.success('School created successfully');
            }
            setTimeout(() => navigate('/schools'), 1500);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save school');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle bulk provisioning
    const handleBulkProvision = async () => {
        if (!provisionPassword || provisionPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        if (!selectedSchool) return;

        try {
            setProvisionLoading(true);
            const result = await userService.provisionBulkLogins({
                skid: selectedSchool.skid,
                school_id: Number(selectedSchool.id),
                default_password: provisionPassword,
                role_filter: provisionRoleFilter || undefined,
            });
            setProvisionResult(result);
            if (result.success_count > 0) {
                toast.success(`${result.success_count} login(s) created successfully`);
            }
            if (result.failed_count > 0) {
                toast.error(`${result.failed_count} login(s) failed`);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to provision logins');
        } finally {
            setProvisionLoading(false);
        }
    };

    // Export provisioning report
    const handleExportReport = async () => {
        if (!selectedSchool) return;
        try {
            const report = await userService.getProvisioningReport(selectedSchool.skid, Number(selectedSchool.id));

            // Build a map of failure reasons from provisioning result (school_user_id -> reason)
            const failureReasons: Record<number, string> = {};
            if (provisionResult?.failures) {
                for (const f of provisionResult.failures) {
                    failureReasons[f.school_user_id] = f.reason;
                }
            }

            // Build a set of successfully provisioned user IDs
            const provisionedIds = new Set<number>();
            if (provisionResult?.successes) {
                for (const s of provisionResult.successes) {
                    provisionedIds.add(s.school_user_id);
                }
            }

            // Generate CSV
            const headers = ['Name', 'Email', 'Username', 'Role', 'Phone', 'Gender', 'Login Status', 'Login Active', 'Login Username', 'Remarks'];
            const csvRows = [headers.join(',')];
            for (const u of report.users) {
                // Determine login status and reason
                let loginStatus = '';
                let remarks = '';
                if (u.has_login) {
                    if (provisionedIds.has(u.school_user_id)) {
                        loginStatus = 'Login Created';
                    } else {
                        loginStatus = 'Has Login';
                    }
                } else if (failureReasons[u.school_user_id]) {
                    loginStatus = 'Failed';
                    remarks = failureReasons[u.school_user_id];
                } else {
                    loginStatus = 'No Login';
                }

                csvRows.push([
                    `"${u.full_name}"`,
                    `"${u.email}"`,
                    `"${u.username}"`,
                    `"${u.role}"`,
                    `"${u.phone || ''}"`,
                    `"${u.gender || ''}"`,
                    `"${loginStatus}"`,
                    u.login_active ? 'Yes' : 'No',
                    `"${u.login_username || ''}"`,
                    `"${remarks}"`,
                ].join(','));
            }
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${report.school_name}_users_login_report.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to export report');
        }
    };

    // Show loading spinner while fetching data in edit mode
    if (isEditMode && loading && !selectedSchool) {
        return <LoadingSpinner fullHeight message="Loading school details..." />;
    }

    // Show error message
    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button variant="secondary" onClick={() => navigate('/schools')}>
                    Back to Schools
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={isEditMode ? 'Edit School' : 'Add New School'}
                subtitle={
                    isEditMode
                        ? `Update details for ${selectedSchool?.name}`
                        : 'Register a new school in the system'
                }
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Schools', href: '/schools' },
                    { label: isEditMode ? 'Edit' : 'New', href: '#' },
                ]}
            />

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* School Name */}
                            <FormField
                                label="School Name"
                                required
                                error={errors.name}
                            >
                                <FormInput
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter school name"
                                    error={Boolean(errors.name)}
                                    required
                                />
                            </FormField>

                            {/* School Code */}
                            <FormField
                                label="School Code"
                                required
                                error={errors.code}
                            >
                                <FormInput
                                    name="code"
                                    type="text"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="Enter unique school code"
                                    error={Boolean(errors.code)}
                                    required
                                    disabled={isEditMode}
                                />
                            </FormField>

                            {/* Phone */}
                            <FormField
                                label="Phone Number"
                                error={errors.phone}
                                help="10-digit phone number (optional)"
                            >
                                <FormInput
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Enter 10-digit phone number"
                                    error={Boolean(errors.phone)}
                                />
                            </FormField>

                            {/* Email */}
                            <FormField
                                label="Email Address"
                                error={errors.email}
                                help="Valid email address (optional)"
                            >
                                <FormInput
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email address"
                                    error={Boolean(errors.email)}
                                />
                            </FormField>

                            {/* Website */}
                            <FormField
                                label="Website"
                                error={errors.website}
                            >
                                <FormInput
                                    name="website"
                                    type="url"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    placeholder="https://www.school.com"
                                    error={Boolean(errors.website)}
                                />
                            </FormField>

                            {/* Subscription Plan */}
                            <FormField
                                label="Subscription Plan"
                                required
                                error={errors.plan}
                            >
                                <FormSelect
                                    name="plan"
                                    value={formData.plan}
                                    onChange={handleInputChange}
                                    options={[
                                        { label: 'BASIC', value: 'BASIC' },
                                        { label: 'STANDARD', value: 'STANDARD' },
                                        { label: 'PREMIUM', value: 'PREMIUM' },
                                    ]}
                                    required
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Address Information
                        </h3>
                        <div className="space-y-4">
                            {/* Full Address */}
                            <FormField
                                label="Street Address"
                                required
                                error={errors.address}
                            >
                                <FormInput
                                    name="address"
                                    type="text"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter street address"
                                    error={Boolean(errors.address)}
                                    required
                                />
                            </FormField>

                            {/* City, State, Country Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* City */}
                                <FormField
                                    label="City"
                                    required
                                    error={errors.city}
                                >
                                    <FormInput
                                        name="city"
                                        type="text"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Enter city"
                                        error={Boolean(errors.city)}
                                        required
                                    />
                                </FormField>

                                {/* State */}
                                <FormField
                                    label="State/Province"
                                    required
                                    error={errors.state}
                                >
                                    <FormInput
                                        name="state"
                                        type="text"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        placeholder="Enter state"
                                        error={Boolean(errors.state)}
                                        required
                                    />
                                </FormField>

                                {/* Country */}
                                <FormField
                                    label="Country"
                                    required
                                    error={errors.country}
                                >
                                    <FormInput
                                        name="country"
                                        type="text"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        placeholder="Enter country"
                                        error={Boolean(errors.country)}
                                        required
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/schools')}
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
                            {isEditMode ? 'Update School' : 'Create School'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> All fields are required. Please ensure the information is accurate before submitting.
                    Once a school is created, you can manage users, classes, and other settings from the school dashboard.
                </p>
            </div>

            {/* Bulk Provisioning Modal */}
            <Modal
                isOpen={provisionModalOpen}
                onClose={() => { setProvisionModalOpen(false); navigate('/schools'); }}
                title="Plan Upgraded! Provision Login Access"
                size="lg"
                closeButton={!!provisionResult}
                footer={
                    !provisionResult ? (
                        <div className="flex justify-between">
                            <Button
                                variant="secondary"
                                onClick={() => { setProvisionModalOpen(false); navigate('/schools'); }}
                            >
                                Skip
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleBulkProvision}
                                disabled={provisionLoading || provisionPassword.length < 8}
                                isLoading={provisionLoading}
                                loadingText="Provisioning..."
                            >
                                Provision Logins
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-between">
                            <Button
                                variant="secondary"
                                onClick={handleExportReport}
                            >
                                Export Report
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => { setProvisionModalOpen(false); navigate('/schools'); }}
                            >
                                Done
                            </Button>
                        </div>
                    )
                }
            >
                {!provisionResult ? (
                    <>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            School plan has been upgraded from BASIC to {formData.plan}.
                            Would you like to create login access for students and parents?
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Default Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={provisionShowPassword ? 'text' : 'password'}
                                        value={provisionPassword}
                                        onChange={(e) => setProvisionPassword(e.target.value)}
                                        placeholder="Minimum 8 characters"
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setProvisionShowPassword(!provisionShowPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        {provisionShowPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    This password will be set for all newly provisioned users
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Role Filter
                                </label>
                                <select
                                    value={provisionRoleFilter}
                                    onChange={(e) => setProvisionRoleFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All (Students & Parents)</option>
                                    <option value="STUDENT">Students Only</option>
                                    <option value="PARENT">Parents Only</option>
                                </select>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        {/* Results Summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{provisionResult.total_eligible}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">Total Eligible</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{provisionResult.already_provisioned}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Already Had Login</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{provisionResult.success_count}</p>
                                <p className="text-xs text-green-600 dark:text-green-400">Logins Created</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{provisionResult.failed_count}</p>
                                <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                            </div>
                        </div>

                        {/* Failures List */}
                        {provisionResult.failures && provisionResult.failures.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Failed Users:</h4>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {provisionResult.failures.map((f: any, i: number) => (
                                        <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-2">
                                            <p className="text-sm font-medium text-red-700 dark:text-red-300">{f.name} ({f.role})</p>
                                            <p className="text-xs text-red-600 dark:text-red-400">{f.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SchoolForm;
