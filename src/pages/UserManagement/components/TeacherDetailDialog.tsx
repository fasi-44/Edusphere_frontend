/**
 * Teacher Detail Dialog Component
 * Reusable modal dialog for displaying teacher information
 * Can be used in UserList, TeacherList pages
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, LoadingSpinner, EmptyState } from '../../../components';
import { teacherService } from '../../../services/modules/teacherService';

interface ITeacherDetailDialogProps {
    isOpen: boolean;
    teacherId: string;
    onClose: () => void;
    onEdit?: (teacher: any) => void;
}

const TeacherDetailDialog: FC<ITeacherDetailDialogProps> = ({
    isOpen,
    teacherId,
    onClose,
    onEdit,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [teacherData, setTeacherData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && teacherId) {
            fetchTeacherDetails();
        }
    }, [isOpen, teacherId]);

    const fetchTeacherDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await teacherService.getById(teacherId);
            setTeacherData(response.teacher_data || response);
        } catch (err: any) {
            console.error('Error fetching teacher details:', err);
            setError(err.message || 'Failed to fetch teacher details');
            toast.error('Failed to load teacher information');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string | null | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Teacher Details"
            size="xl"
            footer={
                <div className="flex gap-3 justify-end">
                    {onEdit && (
                        <button
                            onClick={() => {
                                onEdit(teacherData);
                                onClose();
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Edit
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            }
        >
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <LoadingSpinner message="Loading teacher details..." />
                </div>
            ) : error ? (
                <EmptyState
                    title="Error Loading Teacher"
                    description={error}
                    icon="error"
                />
            ) : !teacherData ? (
                <EmptyState
                    title="No Data"
                    description="No teacher information available"
                />
            ) : (
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Full Name
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.full_name || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Email
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.email || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Phone
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.phone || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Gender
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.gender || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Date of Birth
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {formatDate(teacherData.date_of_birth)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Address
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.address || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Professional Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Employee ID
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.profile?.employee_id || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Designation
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.profile?.designation || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Date of Joining
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {formatDate(teacherData.profile?.date_of_joining)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Qualifications
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.profile?.qualifications || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Salary
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {teacherData.profile?.salary ? `₹${teacherData.profile?.salary.toLocaleString()}` : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Status
                                </label>
                                <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${teacherData.is_active
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }`}>
                                    {teacherData.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default TeacherDetailDialog;
