/**
 * Parent Detail Dialog Component
 * Reusable modal dialog for displaying parent information
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, LoadingSpinner, EmptyState } from '../../../components';
import { parentService } from '../../../services/modules/parentService';

interface IParentDetailDialogProps {
    isOpen: boolean;
    parentId: string;
    onClose: () => void;
    onEdit?: (parent: any) => void;
}

const ParentDetailDialog: FC<IParentDetailDialogProps> = ({
    isOpen,
    parentId,
    onClose,
    onEdit,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parentData, setParentData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && parentId) {
            fetchParentDetails();
        }
    }, [isOpen, parentId]);

    const fetchParentDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await parentService.getById(parentId);
            setParentData(response.data || response);
        } catch (err: any) {
            console.error('Error fetching parent details:', err);
            setError(err.message || 'Failed to fetch parent details');
            toast.error('Failed to load parent information');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Parent Details"
            size="xl"
            footer={
                <div className="flex gap-3 justify-end">
                    {onEdit && (
                        <button
                            onClick={() => {
                                onEdit(parentData);
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
                    <LoadingSpinner message="Loading parent details..." />
                </div>
            ) : error ? (
                <EmptyState
                    title="Error Loading Parent"
                    description={error}
                    icon="error"
                />
            ) : !parentData ? (
                <EmptyState
                    title="No Data"
                    description="No parent information available"
                />
            ) : (
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Login Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Relation Type
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.relation_type || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Status
                                </label>
                                <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${parentData.is_active
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }`}>
                                    {parentData.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Father's Information */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Father's Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Full Name
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.father_full_name || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Occupation
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.father_occupation || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Phone
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.father_phone || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Qualification
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.father_qualification || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mother's Information */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Mother's Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Full Name
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.mother_full_name || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Occupation
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.mother_occupation || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Phone
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.mother_phone || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Qualification
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.mother_qualification || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Address Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Address
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.address || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    City
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.city || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    State
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.state || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Postal Code
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {parentData.postal_code || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ParentDetailDialog;
