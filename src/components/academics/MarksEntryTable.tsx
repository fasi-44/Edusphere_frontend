/**
 * Marks Entry Table Component
 * Renders a table for entering student marks with validation and real-time calculation
 */

import { FC, useCallback } from 'react';
import { IExamConfig, IStudentWithMarks, IStudentMarkEntry } from '../../types/index';
import Badge from '../ui/Badge';

interface MarksEntryTableProps {
    examConfig: IExamConfig | null;
    students: IStudentWithMarks[];
    marksData: Record<string, IStudentMarkEntry>;
    onMarksChange: (studentId: string, field: string, value: any) => void;
    loading: boolean;
}

const MarksEntryTable: FC<MarksEntryTableProps> = ({
    examConfig,
    students,
    marksData,
    onMarksChange,
    loading,
}) => {
    const getPassFailStatus = useCallback((total: number, isAbsent: boolean) => {
        if (isAbsent) return { label: 'Absent', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' };
        if (examConfig && total >= examConfig.min_passing_marks) {
            return { label: 'Pass', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' };
        }
        return { label: 'Fail', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' };
    }, [examConfig]);

    if (!examConfig) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table Wrapper */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    {/* Table Header */}
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-12">
                                #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">
                                Roll No
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Student Name
                            </th>

                            {/* Internal Marks Column */}
                            {examConfig.has_internal_external && (
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                                    <div>Internal</div>
                                    <div className="text-gray-600 dark:text-gray-400 text-xs font-normal">
                                        ({examConfig.internal_max_marks})
                                    </div>
                                </th>
                            )}

                            {/* External Marks Column */}
                            {examConfig.has_internal_external && (
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                                    <div>External</div>
                                    <div className="text-gray-600 dark:text-gray-400 text-xs font-normal">
                                        ({examConfig.external_max_marks})
                                    </div>
                                </th>
                            )}

                            {/* Total Marks Column */}
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                                <div>Total</div>
                                <div className="text-gray-600 dark:text-gray-400 text-xs font-normal">
                                    ({examConfig.total_max_marks})
                                </div>
                            </th>

                            {/* Absent Checkbox Column */}
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">
                                Absent
                            </th>

                            {/* Status Column */}
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                                Status
                            </th>

                            {/* Remarks Column */}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Remarks
                            </th>
                        </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {students.map((student, index) => {
                            const marks = marksData[student.student_id] || {};
                            const status = getPassFailStatus(marks.total_marks || 0, marks.is_absent || false);

                            return (
                                <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    {/* Index Column */}
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
                                        {index + 1}
                                    </td>

                                    {/* Roll No Column */}
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                        {student.student_id}
                                    </td>

                                    {/* Student Name Column */}
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        {student.student_name}
                                    </td>

                                    {/* Internal Marks Input */}
                                    {examConfig.has_internal_external && (
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                value={marks.internal_marks || ''}
                                                onChange={(e) =>
                                                    onMarksChange(student.student_id, 'internal_marks', e.target.value)
                                                }
                                                disabled={marks.is_absent || loading}
                                                min="0"
                                                max={examConfig.internal_max_marks}
                                                className={`w-full px-2 py-1 text-sm text-center rounded border bg-white dark:bg-gray-700 dark:text-white transition-colors ${
                                                    marks.internal_marks > (examConfig.internal_max_marks || 0)
                                                        ? 'border-red-500 dark:border-red-400'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } ${marks.is_absent ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            />
                                        </td>
                                    )}

                                    {/* External Marks Input */}
                                    {examConfig.has_internal_external && (
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                value={marks.external_marks || ''}
                                                onChange={(e) =>
                                                    onMarksChange(student.student_id, 'external_marks', e.target.value)
                                                }
                                                disabled={marks.is_absent || loading}
                                                min="0"
                                                max={examConfig.external_max_marks}
                                                className={`w-full px-2 py-1 text-sm text-center rounded border bg-white dark:bg-gray-700 dark:text-white transition-colors ${
                                                    marks.external_marks > (examConfig.external_max_marks || 0)
                                                        ? 'border-red-500 dark:border-red-400'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                } ${marks.is_absent ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            />
                                        </td>
                                    )}

                                    {/* Total Marks Input */}
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="number"
                                            value={marks.total_marks || ''}
                                            onChange={(e) =>
                                                onMarksChange(student.student_id, 'total_marks', e.target.value)
                                            }
                                            disabled={marks.is_absent || examConfig.has_internal_external || loading}
                                            min="0"
                                            max={examConfig.total_max_marks}
                                            className={`w-full px-2 py-1 text-sm text-center rounded border bg-white dark:bg-gray-700 dark:text-white transition-colors ${
                                                marks.total_marks > examConfig.total_max_marks
                                                    ? 'border-red-500 dark:border-red-400'
                                                    : 'border-gray-300 dark:border-gray-600'
                                            } ${marks.is_absent || examConfig.has_internal_external ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                    </td>

                                    {/* Absent Checkbox */}
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={marks.is_absent || false}
                                            onChange={(e) =>
                                                onMarksChange(student.student_id, 'is_absent', e.target.checked)
                                            }
                                            disabled={loading}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer accent-blue-600 dark:accent-blue-500"
                                        />
                                    </td>

                                    {/* Status Badge */}
                                    <td className="px-4 py-3 text-center">
                                        {!marks.is_absent && marks.total_marks > 0 && (
                                            <Badge
                                                variant={status.label === 'Pass' ? 'success' : status.label === 'Fail' ? 'danger' : 'secondary'}
                                                size="sm"
                                            >
                                                {status.label}
                                            </Badge>
                                        )}
                                    </td>

                                    {/* Remarks Input */}
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={marks.remarks || ''}
                                            onChange={(e) =>
                                                onMarksChange(student.student_id, 'remarks', e.target.value)
                                            }
                                            placeholder="Optional"
                                            disabled={loading}
                                            className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MarksEntryTable;
