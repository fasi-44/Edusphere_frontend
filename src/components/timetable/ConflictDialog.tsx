/**
 * Conflict Dialog Component
 * Displays teacher scheduling conflicts when attempting to assign a teacher
 */

import { FC } from 'react';
import { Button } from '../index';
import { ITeacherConflictDetail } from '../../types/index';

export interface IConflictDialogProps {
    open: boolean;
    conflicts: ITeacherConflictDetail[];
    onClose: () => void;
}

const ConflictDialog: FC<IConflictDialogProps> = ({ open, conflicts, onClose }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-red-600 dark:bg-red-700 text-white p-4 border-b">
                    <h3 className="text-lg font-semibold">Teacher Scheduling Conflict Detected</h3>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Alert */}
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found!
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            The selected teacher is already scheduled during this time slot.
                        </p>
                    </div>

                    {/* Conflict List */}
                    <div className="space-y-3">
                        {conflicts.map((conflict, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-2 border-red-200 dark:border-red-800"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                                        Conflict #{index + 1}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {/* Teacher Name */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            Teacher
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {conflict.teacher_name}
                                        </p>
                                    </div>

                                    {/* Time */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            Time
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {conflict.day} {conflict.start_time} - {conflict.end_time}
                                        </p>
                                    </div>

                                    {/* Class */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            Class
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {conflict.class_name} - {conflict.section_name}
                                        </p>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            Subject
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {conflict.subject_name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 p-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={onClose}
                    >
                        Choose Different Teacher
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConflictDialog;
