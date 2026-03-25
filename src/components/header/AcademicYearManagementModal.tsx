import { FC, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal, Button, Badge } from '../../components';
import { useAuthStore } from '../../stores/authStore';
import { AcademicYear } from '../../types/auth';
import { academicYearService, AcademicYearFormData } from '../../services/modules/academicYearService';

// Icons
const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface AcademicYearManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AcademicYearManagementModal: FC<AcademicYearManagementModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { user, updateAcademicYears } = useAuthStore();
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addingNew, setAddingNew] = useState(false);

    const [formData, setFormData] = useState<AcademicYearFormData>({
        year_name: '',
        start_date: '',
        end_date: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen && user?.academic_years) {
            setAcademicYears([...user.academic_years]);
        }
    }, [isOpen, user?.academic_years]);

    const resetForm = () => {
        setFormData({ year_name: '', start_date: '', end_date: '' });
        setErrors({});
        setEditingId(null);
        setAddingNew(false);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.year_name?.trim()) {
            newErrors.year_name = 'Year name is required';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date) {
            if (new Date(formData.start_date) >= new Date(formData.end_date)) {
                newErrors.end_date = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleStartEdit = (year: AcademicYear) => {
        setEditingId(year.id);
        setFormData({
            year_name: year.year_name,
            start_date: year.start_date,
            end_date: year.end_date,
        });
        setAddingNew(false);
        setErrors({});
    };

    const handleStartAdd = () => {
        setAddingNew(true);
        setEditingId(null);
        setFormData({ year_name: '', start_date: '', end_date: '' });
        setErrors({});
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleSaveEdit = async (yearId: number) => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            await academicYearService.updateAcademicYear(yearId.toString(), formData);
            toast.success('Academic year updated successfully');

            const updatedYears = academicYears.map((year) =>
                year.id === yearId ? { ...year, ...formData } : year
            );
            setAcademicYears(updatedYears);
            updateAcademicYears(updatedYears);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update academic year');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const newYear = await academicYearService.createAcademicYear(formData);
            toast.success('Academic year added successfully');

            const updatedYears = [...academicYears, newYear];
            setAcademicYears(updatedYears);
            updateAcademicYears(updatedYears);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add academic year');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsCurrent = async (yearId: number) => {
        try {
            setLoading(true);
            await academicYearService.setCurrentAcademicYear(yearId.toString());
            toast.success('Current academic year updated successfully');

            const updatedYears = academicYears.map((year) => ({
                ...year,
                is_current: year.id === yearId,
            }));
            setAcademicYears(updatedYears);
            updateAcademicYears(updatedYears);
        } catch (error: any) {
            toast.error(error.message || 'Failed to set current academic year');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const sortedYears = [...academicYears].sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <CalendarIcon />
                    <span>Academic Year Management</span>
                </div>
            }
            size="4xl"
        >
            <div className="space-y-4">
                {/* Add New Button */}
                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<PlusIcon />}
                        onClick={handleStartAdd}
                        disabled={addingNew || editingId !== null}
                    >
                        Add New
                    </Button>
                </div>

                {/* Table */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Academic Year
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Start Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    End Date
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Add New Row */}
                            {addingNew && (
                                <tr className="bg-blue-50 dark:bg-blue-900/10">
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={formData.year_name}
                                            onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                                            placeholder="e.g., 2025-2026"
                                            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                                errors.year_name
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                                        />
                                        {errors.year_name && (
                                            <p className="mt-1 text-xs text-red-500">{errors.year_name}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                                errors.start_date
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                                        />
                                        {errors.start_date && (
                                            <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            min={formData.start_date || undefined}
                                            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                                errors.end_date
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                                        />
                                        {errors.end_date && (
                                            <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {/* Empty for new row */}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                leftIcon={<CheckIcon />}
                                                onClick={handleAddNew}
                                                disabled={loading}
                                                isLoading={loading}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<XIcon />}
                                                onClick={handleCancelEdit}
                                                disabled={loading}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Existing Rows */}
                            {sortedYears.map((year) => (
                                <tr
                                    key={year.id}
                                    className={editingId === year.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                                >
                                    {editingId === year.id ? (
                                        <>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={formData.year_name}
                                                    onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                                                    className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                                        errors.year_name
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                                                />
                                                {errors.year_name && (
                                                    <p className="mt-1 text-xs text-red-500">{errors.year_name}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="date"
                                                    value={formData.start_date}
                                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                    className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                                        errors.start_date
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                                                />
                                                {errors.start_date && (
                                                    <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="date"
                                                    value={formData.end_date}
                                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                    min={formData.start_date || undefined}
                                                    className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                                        errors.end_date
                                                            ? 'border-red-500 focus:ring-red-500'
                                                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                                                />
                                                {errors.end_date && (
                                                    <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {year.is_current && (
                                                    <Badge variant="success" size="sm">Current</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        leftIcon={<CheckIcon />}
                                                        onClick={() => handleSaveEdit(year.id)}
                                                        disabled={loading}
                                                        isLoading={loading}
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        leftIcon={<XIcon />}
                                                        onClick={handleCancelEdit}
                                                        disabled={loading}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-3">
                                                <span className={`text-sm ${year.is_current ? 'font-semibold' : ''} text-gray-900 dark:text-white`}>
                                                    {year.year_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {formatDate(year.start_date)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {formatDate(year.end_date)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {year.is_current && (
                                                    <Badge variant="success" size="sm">Current</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        leftIcon={<EditIcon />}
                                                        onClick={() => handleStartEdit(year)}
                                                        disabled={editingId !== null || addingNew || loading}
                                                    >
                                                        Edit
                                                    </Button>
                                                    {!year.is_current && (
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            leftIcon={<CheckIcon />}
                                                            onClick={() => handleMarkAsCurrent(year.id)}
                                                            disabled={editingId !== null || addingNew || loading}
                                                        >
                                                            Set Current
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}

                            {/* Empty State */}
                            {sortedYears.length === 0 && !addingNew && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No academic years found. Click "Add New" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AcademicYearManagementModal;
