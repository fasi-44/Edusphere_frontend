/**
 * Subject List Page
 * Display and manage subjects across classes
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import {
    Button,
    ConfirmDialog,
    EmptyState,
    FormField,
    FormSelect,
    LoadingSpinner,
    PageHeader
} from '../../components';
import { academicsService } from '../../services/modules/academicsService';
import { classService } from '../../services/modules/classService';
import { ISubject } from '../../types/index';

interface IFilterParams {
    classId: number;
}

const SubjectList: FC = () => {
    const navigate = useNavigate();

    // State
    const [subjects, setSubjects] = useState<ISubject[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Filter state
    const [filters, setFilters] = useState<IFilterParams>({ classId: 0 });

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{
        open: boolean;
        id: string | null;
        name: string;
    }>({
        open: false,
        id: null,
        name: '',
    });

    // Fetch classes on mount and set initial filter
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const classesRes = await classService.list();
                setClasses(classesRes);
                console.log(classesRes)
                if (classesRes?.length > 0) {
                    setFilters((prev) => ({ ...prev, classId: Number(classesRes[0].id) }));
                }
            } catch (err: any) {
                toast.error('Failed to load classes');
                console.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch subjects when classId filter changes
    useEffect(() => {
        if (filters.classId) {
            fetchSubjects(filters.classId);
        }
    }, [filters.classId]);

    // Fetch subjects for a given class
    const fetchSubjects = async (classId: number) => {
        setLoadingSubjects(true);
        try {
            const response = await academicsService.listSubjects(String(classId));
            setSubjects(response.data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch subjects');
            setSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    // Handle filter change
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteConfirm.id) return;

        try {
            await academicsService.deleteSubject(deleteConfirm.id);
            toast.success('Subject deleted successfully');
            setDeleteConfirm({ open: false, id: null, name: '' });
            if (filters.classId) {
                fetchSubjects(filters.classId);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete subject');
        }
    };


    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Subjects"
                subtitle="Manage course subjects and assignments"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Subjects', href: '#' },
                ]}
                actions={
                    <Button
                        variant="primary"
                        onClick={() => navigate('/academics/subjects/new')}
                    >
                        + New Subject
                    </Button>
                }
            />

            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Class Filter */}
                    <FormField label="Class">
                        <FormSelect
                            name="classId"
                            value={filters.classId}
                            onChange={handleFilterChange}
                            options={classes.map((cls) => ({
                                label: `${cls.class_name}`,
                                value: cls.id,
                            }))}
                            placeholder="Select a Class"
                        />
                    </FormField>
                </div>
            </div>

            {/* Results Section */}
            {loading ? (
                <LoadingSpinner fullHeight message="Loading classes..." />
            ) : loadingSubjects ? (
                <LoadingSpinner fullHeight message="Loading subjects..." />
            ) : subjects.length > 0 ? (
                <div className="space-y-4">
                    {/* Subjects Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Subject Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Class
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {subjects.map((subject) => (
                                        <tr
                                            key={subject.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {subject.subject_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                                                {subject.subject_code}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {subject.grade_level}
                                            </td>
                                            <td className="px-6 py-4 text-sm flex items-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        navigate(`/academics/subjects/${subject.id}`)
                                                    }
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() =>
                                                        navigate(`/academics/subjects/${subject.id}/edit`)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDeleteConfirm({
                                                            open: true,
                                                            id: subject.id,
                                                            name: subject.subject_name,
                                                        })
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon="📚"
                    title="No Subjects Found"
                    description="No subjects found for the selected class. Create one to get started."
                    action={
                        <Button
                            variant="primary"
                            onClick={() => navigate('/academics/subjects/new')}
                        >
                            Create Subject
                        </Button>
                    }
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                title="Delete Subject"
                message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type='danger'
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm({ open: false, id: null, name: '' })}
            />
        </div>
    );
};


export default SubjectList;