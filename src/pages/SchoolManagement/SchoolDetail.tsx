/**
 * School Detail Page
 * View detailed information about a specific school
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
    PageHeader,
    Button,
    Badge,
    LoadingSpinner,
    EmptyState,
} from '../../components';
import { schoolService } from '../../services/modules/schoolService';
import { usePermissions } from '../../hooks/usePermissions';
import { ISchool } from '../../types/index';

const SchoolDetail: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { isSuperAdmin } = usePermissions();

    const [selectedSchool, setSelectedSchool] = useState<ISchool | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch school data on mount
    useEffect(() => {
        if (id) {
            const fetchSchool = async () => {
                setLoading(true);
                try {
                    const school = await schoolService.getById(id);
                    setSelectedSchool(school);
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch school');
                } finally {
                    setLoading(false);
                }
            };
            fetchSchool();
        }
    }, [id]);

    // Handle delete
    const handleDelete = async () => {
        if (!selectedSchool) return;

        const confirmed = window.confirm(
            'Are you sure you want to delete this school? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                await schoolService.delete(selectedSchool.id);
                toast.success('School deleted successfully');
                setTimeout(() => navigate('/schools'), 1500);
            } catch (err: any) {
                toast.error(err.message || 'Failed to delete school');
            }
        }
    };

    // Show loading spinner
    if (loading && !selectedSchool) {
        return <LoadingSpinner fullHeight message="Loading school details..." />;
    }

    // Show error message
    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="School Details"
                    subtitle="View school information"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Schools', href: '/schools' },
                        { label: 'Details', href: '#' },
                    ]}
                />
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button variant="secondary" onClick={() => navigate('/schools')}>
                        Back to Schools
                    </Button>
                </div>
            </div>
        );
    }

    // Show empty state if no school found
    if (!selectedSchool) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="School Details"
                    subtitle="View school information"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Schools', href: '/schools' },
                        { label: 'Details', href: '#' },
                    ]}
                />
                <EmptyState
                    icon="🏫"
                    title="School Not Found"
                    description="The school you're looking for doesn't exist or has been deleted."
                    action={
                        <Button variant="secondary" onClick={() => navigate('/schools')}>
                            Back to Schools
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={selectedSchool.name}
                subtitle="View and manage school information"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Schools', href: '/schools' },
                    { label: selectedSchool.name, href: '#' },
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        {isSuperAdmin && (
                            <Button
                                variant="secondary"
                                onClick={() => navigate(`/schools/${selectedSchool.id}/edit`)}
                            >
                                Edit School
                            </Button>
                        )}
                        {isSuperAdmin && (
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                            >
                                Delete School
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Basic Information
                        </h3>
                        <div className="space-y-4">
                            {/* School Name and Status */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">School Name</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedSchool.name}
                                    </p>
                                </div>
                                <Badge
                                    variant={selectedSchool.status === 'active' ? 'success' : 'warning'}
                                    text={selectedSchool.status.charAt(0).toUpperCase() + selectedSchool.status.slice(1)}
                                />
                            </div>

                            {/* Email and Phone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{selectedSchool.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{selectedSchool.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address Information Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Address Information
                        </h3>
                        <div className="space-y-4">
                            {/* Full Address */}
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Street Address</p>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedSchool.address}</p>
                            </div>

                            {/* City, State, Postal Code */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">City</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{selectedSchool.city}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">State</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{selectedSchool.state}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Postal Code</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{selectedSchool.postal_code}</p>
                                </div>
                            </div>

                            {/* Country */}
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Country</p>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedSchool.country}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <button className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                <div className="text-2xl mb-2">👥</div>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Manage Users</span>
                            </button>
                            <button className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                                <div className="text-2xl mb-2">📚</div>
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">Manage Classes</span>
                            </button>
                            <button className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                                <div className="text-2xl mb-2">📊</div>
                                <span className="text-sm font-medium text-purple-700 dark:text-purple-400">View Reports</span>
                            </button>
                            <button className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
                                <div className="text-2xl mb-2">💰</div>
                                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Finance</span>
                            </button>
                            <button className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                <div className="text-2xl mb-2">📅</div>
                                <span className="text-sm font-medium text-red-700 dark:text-red-400">Timetable</span>
                            </button>
                            <button className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                                <div className="text-2xl mb-2">⚙️</div>
                                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Settings</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Metadata Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Information
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">School ID</p>
                                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{selectedSchool.id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Created At</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {selectedSchool.created_at
                                        ? new Date(selectedSchool.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })
                                        : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Last Updated</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {selectedSchool.updated_at
                                        ? new Date(selectedSchool.updated_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className={`p-6 rounded-lg border ${selectedSchool.status === 'active'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}>
                        <p className={`text-sm font-medium ${selectedSchool.status === 'active'
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-yellow-700 dark:text-yellow-400'
                            }`}>
                            {selectedSchool.status === 'active'
                                ? '✅ School is active and operational'
                                : '⚠️ School is inactive'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolDetail;
