/**
 * Role Form Component
 * Form for creating and editing roles with permissions assignment
 */

import { FC, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import { PageHeader, Button, LoadingSpinner } from '../../components';
import { roleService } from '../../services/modules/roleService';

// Static permissions grouped by module
// These are stored as flat string arrays in the backend Role.permissions column
const PERMISSION_GROUPS = [
    {
        module: 'User Management',
        permissions: [
            { key: 'view_users', label: 'View Users' },
            { key: 'manage_users', label: 'Create / Edit Users' },
            { key: 'delete_users', label: 'Delete Users' },
        ],
    },
    {
        module: 'Student Management',
        permissions: [
            { key: 'view_students', label: 'View Students' },
            { key: 'manage_students', label: 'Create / Edit Students' },
            { key: 'delete_students', label: 'Delete Students' },
        ],
    },
    {
        module: 'Teacher Management',
        permissions: [
            { key: 'view_teachers', label: 'View Teachers' },
            { key: 'manage_teachers', label: 'Create / Edit Teachers' },
            { key: 'delete_teachers', label: 'Delete Teachers' },
        ],
    },
    {
        module: 'Class & Section',
        permissions: [
            { key: 'view_classes', label: 'View Classes & Sections' },
            { key: 'manage_classes', label: 'Create / Edit Classes & Sections' },
        ],
    },
    {
        module: 'Attendance',
        permissions: [
            { key: 'view_attendance', label: 'View Attendance' },
            { key: 'manage_attendance', label: 'Mark / Edit Attendance' },
        ],
    },
    {
        module: 'Timetable',
        permissions: [
            { key: 'view_timetable', label: 'View Timetable' },
            { key: 'manage_timetable', label: 'Create / Edit Timetable' },
        ],
    },
    {
        module: 'Exams & Marks',
        permissions: [
            { key: 'view_exams', label: 'View Exams & Marks' },
            { key: 'manage_exams', label: 'Create / Edit Exams' },
            { key: 'manage_marks', label: 'Enter / Edit Marks' },
        ],
    },
    {
        module: 'Finance',
        permissions: [
            { key: 'view_fees', label: 'View Fees & Payments' },
            { key: 'manage_fees', label: 'Manage Fee Structure & Collection' },
            { key: 'view_expenses', label: 'View Expenses' },
            { key: 'manage_expenses', label: 'Create / Edit Expenses' },
        ],
    },
    {
        module: 'Announcements',
        permissions: [
            { key: 'view_announcements', label: 'View Announcements' },
            { key: 'manage_announcements', label: 'Create / Edit Announcements' },
        ],
    },
    {
        module: 'Assignments',
        permissions: [
            { key: 'view_assignments', label: 'View Assignments' },
            { key: 'manage_assignments', label: 'Create / Edit / Review Assignments' },
        ],
    },
    {
        module: 'Syllabus',
        permissions: [
            { key: 'view_syllabus_and_progress', label: 'View Syllabus & Progress' },
            { key: 'manage_syllabus', label: 'Create / Edit Syllabus' },
        ],
    },
    {
        module: 'Reports',
        permissions: [
            { key: 'view_reports', label: 'View Reports' },
            { key: 'export_reports', label: 'Export Reports' },
        ],
    },
    {
        module: 'Administration',
        permissions: [
            { key: 'manage_roles', label: 'Manage Roles & Permissions' },
            { key: 'manage_academic_years', label: 'Manage Academic Years' },
            { key: 'manage_school_settings', label: 'Manage School Settings' },
        ],
    },
    {
        module: 'Bus Scan',
        permissions: [
            { key: 'view_bus_scan', label: 'View Bus Scan' },
            { key: 'manage_bus_scan', label: 'Scan QR & Manage Bus Scan' },
        ],
    },
];

const RoleForm: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        role_name: '',
        role_code: '',
        description: '',
    });

    useEffect(() => {
        if (isEditMode && id) {
            fetchRole();
        }
    }, [id]);

    const fetchRole = async () => {
        try {
            setLoading(true);
            const role = await roleService.getById(id!);
            setFormData({
                role_name: role.role_name || '',
                role_code: role.role_code || '',
                description: role.description || '',
            });
            setSelectedPermissions(role.permissions || []);
        } catch (error: any) {
            console.error('Error fetching role:', error);
            toast.error(error.message || 'Failed to fetch role');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateRoleCode = (name: string) => {
        return name.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            role_name: value,
            // Auto-generate role_code only in create mode
            ...(!isEditMode ? { role_code: generateRoleCode(value) } : {}),
        }));
    };

    const togglePermission = (key: string) => {
        setSelectedPermissions(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const toggleModuleAll = (modulePerms: { key: string }[]) => {
        const keys = modulePerms.map(p => p.key);
        const allSelected = keys.every(k => selectedPermissions.includes(k));
        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(p => !keys.includes(p)));
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...keys])]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.role_name.trim()) {
            toast.error('Role name is required');
            return;
        }
        if (!formData.role_code.trim()) {
            toast.error('Role code is required');
            return;
        }

        try {
            setIsSubmitting(true);
            if (isEditMode) {
                await roleService.update(id!, {
                    role_name: formData.role_name,
                    description: formData.description,
                });
                await roleService.assignPermissions(id!, selectedPermissions);
                toast.success('Role updated successfully');
            } else {
                const created = await roleService.create({
                    role_name: formData.role_name,
                    role_code: formData.role_code,
                    description: formData.description,
                });
                if (created?.id && selectedPermissions.length > 0) {
                    await roleService.assignPermissions(created.id, selectedPermissions);
                }
                toast.success('Role created successfully');
            }
            navigate('/roles');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save role');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading role..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={isEditMode ? 'Edit Role' : 'Create Role'}
                subtitle="Manage role information and permissions"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Roles', href: '/roles' },
                    { label: isEditMode ? 'Edit' : 'Create', href: '#' },
                ]}
            />

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Role Details */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-5 self-start">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Role Details</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="role_name"
                                value={formData.role_name}
                                onChange={handleNameChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Class Teacher"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Role Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="role_code"
                                value={formData.role_code}
                                onChange={handleInputChange}
                                disabled={isEditMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. CLASS_TEACHER"
                            />
                            {isEditMode && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Role code cannot be changed</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Describe what this role can do"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="secondary" type="button" onClick={() => navigate('/roles')}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Role' : 'Create Role'}
                            </Button>
                        </div>
                    </div>

                    {/* Permissions Section */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 self-start">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Permissions</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedPermissions.length} selected
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                            {PERMISSION_GROUPS.map((group) => {
                                const allKeys = group.permissions.map(p => p.key);
                                const allSelected = allKeys.every(k => selectedPermissions.includes(k));
                                const someSelected = allKeys.some(k => selectedPermissions.includes(k));

                                return (
                                    <div key={group.module} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                        {/* Module header */}
                                        <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                onChange={() => toggleModuleAll(group.permissions)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                {group.module}
                                            </span>
                                        </label>
                                        {/* Individual permissions */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 px-4 py-2.5">
                                            {group.permissions.map((perm) => (
                                                <label
                                                    key={perm.key}
                                                    className="flex items-center gap-2.5 py-1.5 cursor-pointer select-none"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.includes(perm.key)}
                                                        onChange={() => togglePermission(perm.key)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {perm.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default RoleForm;
