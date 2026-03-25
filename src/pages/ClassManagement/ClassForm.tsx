import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import {
    Button,
    EmptyState,
    FormField,
    FormInput,
    LoadingSpinner,
    PageHeader
} from '../../components';
import { classService } from '../../services/modules/classService';
import { IClass } from '../../types';

type ClassFormData = Pick<IClass, 'class_name'>;

const ClassForm: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    // State
    const [formData, setFormData] = useState<ClassFormData>({
        class_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch class data on mount in edit mode
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            classService.getById(id)
                .then(classData => {
                    setFormData({ class_name: classData.class_name });
                })
                .catch(err => {
                    setError(err.message || 'Failed to load class data');
                    toast.error(err.message || 'Failed to load class data');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [id, isEditMode]);


    // Handle form input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditMode) {
                await classService.update(id, formData);
                toast.success('Class updated successfully');
            } else {
                await classService.create(formData as Omit<IClass, 'id' | 'createdAt'>);
                toast.success('Class created successfully');
            }
            navigate('/classes');
        } catch (err: any) {
            toast.error(err.message || 'Failed to save class');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullHeight message={isEditMode ? 'Loading class data...' : 'Loading...'} />;
    }

    if (error) {
        return <EmptyState title="Error" description={error} />;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PageHeader
                title={isEditMode ? 'Edit Class' : 'Create New Class'}
                subtitle="Fill in the details below"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Classes', href: '/classes' },
                    { label: isEditMode ? 'Edit' : 'New', href: '#' },
                ]}
            />

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Class Name" required>
                        <FormInput
                            name="class_name"
                            value={formData.class_name}
                            onChange={handleChange}
                            placeholder="e.g., Grade 10"
                            required
                        />
                    </FormField>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/classes')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Class')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default ClassForm;