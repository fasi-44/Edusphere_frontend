/**
 * User Form Page
 * Create and edit users with comprehensive form validation
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
import { userService } from '../../services/modules/userService';
import { roleService } from '../../services/modules/roleService';
import { IUser } from '../../types/index';

interface IFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    status: 'active' | 'inactive';
    password?: string;
    confirmPassword?: string;
}

interface IFormErrors {
    [key: string]: string;
}

const UserForm: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    // State
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState<IFormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        status: 'active',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<IFormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<{ label: string; value: string }[]>([]);

    const EXCLUDED_ROLES = ['STUDENT', 'PARENT', 'TEACHER'];

    // Fetch roles for dropdown
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await roleService.list({ limit: 100 });
                const filteredRoles = response.data
                    .filter((role: any) => !EXCLUDED_ROLES.includes(role.role_code?.toUpperCase()))
                    .map((role: any) => ({
                        label: role.role_name,
                        value: role.role_code.toLowerCase(),
                    }));
                setRoles(filteredRoles);
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        };
        fetchRoles();
    }, []);

    // Fetch user data if editing
    useEffect(() => {
        if (isEditMode && id) {
            const fetchUser = async () => {
                setLoading(true);
                try {
                    const user = await userService.getById(id);
                    setSelectedUser(user);
                    setFormData({
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        email: user.email,
                        phone: user.phone || '',
                        role: user.role,
                        status: user.status as any,
                    });
                } catch (err: any) {
                    setError(err.message || 'Failed to load user');
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        }
    }, [id, isEditMode]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: IFormErrors = {};

        // First name validation
        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        } else if (formData.first_name.length < 2) {
            newErrors.first_name = 'First name must be at least 2 characters';
        }

        // Last name validation
        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        } else if (formData.last_name.length < 2) {
            newErrors.last_name = 'Last name must be at least 2 characters';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation (optional but must be valid if provided)
        if (formData.phone) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
                newErrors.phone = 'Please enter a valid 10-digit phone number';
            }
        }

        // Role validation
        if (!formData.role) {
            newErrors.role = 'Role is required';
        }

        // Password validation (required for new users)
        if (!isEditMode) {
            if (!formData.password) {
                newErrors.password = 'Password is required';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
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
            const submitData: any = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone || null,
                role: formData.role,
                status: formData.status,
            };

            if (!isEditMode) {
                submitData.password = formData.password;
            }

            if (isEditMode && id) {
                await userService.update(id, submitData);
                toast.success('User updated successfully');
            } else {
                await userService.create(submitData);
                toast.success('User created successfully');
            }
            setTimeout(() => navigate('/users'), 1500);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading spinner while fetching data in edit mode
    if (isEditMode && loading && !selectedUser) {
        return <LoadingSpinner fullHeight message="Loading user details..." />;
    }

    // Show error message
    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="User Management"
                    subtitle="Create and manage users"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Users', href: '/users' },
                        { label: isEditMode ? 'Edit' : 'New', href: '#' },
                    ]}
                />
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button variant="secondary" onClick={() => navigate('/users')}>
                        Back to Users
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={isEditMode ? 'Edit User' : 'Add New User'}
                subtitle={
                    isEditMode
                        ? `Update details for ${selectedUser?.name}`
                        : 'Create a new user account'
                }
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Users', href: '/users' },
                    { label: isEditMode ? 'Edit' : 'New', href: '#' },
                ]}
            />

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Account Information Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Account Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <FormField
                                label="First Name"
                                required
                                error={errors.first_name}
                            >
                                <FormInput
                                    name="first_name"
                                    type="text"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    placeholder="Enter First full name"
                                    error={Boolean(errors.first_name)}
                                    required
                                />
                            </FormField>
                            <FormField
                                label="last Name"
                                required
                                error={errors.first_name}
                            >
                                <FormInput
                                    name="last_name"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    placeholder="Enter Last full name"
                                    error={Boolean(errors.last_name)}
                                    required
                                />
                            </FormField>

                            {/* Email */}
                            <FormField
                                label="Email Address"
                                required
                                error={errors.email}
                            >
                                <FormInput
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email address"
                                    error={Boolean(errors.email)}
                                    required
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
                                    placeholder="Enter phone number"
                                    error={Boolean(errors.phone)}
                                />
                            </FormField>

                            {/* Role */}
                            <FormField
                                label="Role"
                                required
                                error={errors.role}
                            >
                                <FormSelect
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    options={roles}
                                    required
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Password Section (only for new users) */}
                    {!isEditMode && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Password
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Password */}
                                <FormField
                                    label="Password"
                                    required
                                    error={errors.password}
                                    help="Minimum 6 characters"
                                >
                                    <div className="relative">
                                        <FormInput
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Enter password"
                                            error={Boolean(errors.password)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </FormField>

                                {/* Confirm Password */}
                                <FormField
                                    label="Confirm Password"
                                    required
                                    error={errors.confirmPassword}
                                >
                                    <FormInput
                                        name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="Confirm password"
                                        error={Boolean(errors.confirmPassword)}
                                        required
                                    />
                                </FormField>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/users')}
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
                            {isEditMode ? 'Update User' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> All fields marked as required must be filled. Users will receive an email with their login credentials after account creation.
                </p>
            </div>
        </div>
    );
};

export default UserForm;
