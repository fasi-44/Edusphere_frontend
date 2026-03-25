/**
 * Student Progress Table Component
 * Displays student-wise progress with ranking, marks, grades, and action buttons.
 * Uses reusable Badge and Button components for consistent styling.
 */

import { FC, useState, useMemo } from 'react';
import { IStudentProgress } from '../../types/index';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSpinner from '../common/LoadingSpinner';

interface StudentProgressTableProps {
    data: IStudentProgress[];
    loading?: boolean;
    onViewProgress?: (studentId: string) => void;
    onPageChange?: (page: number) => void;
    currentPage?: number;
    pageSize?: number;
    total?: number;
}

type GradeBadgeVariant = 'success' | 'primary' | 'warning' | 'danger' | 'secondary';

const getGradeBadgeVariant = (grade: string): GradeBadgeVariant => {
    switch (grade) {
        case 'A+':
        case 'A':
            return 'success';
        case 'B+':
        case 'B':
            return 'primary';
        case 'C':
        case 'D':
            return 'warning';
        case 'F':
            return 'danger';
        default:
            return 'secondary';
    }
};

const getProgressBarColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
};

const StudentProgressTable: FC<StudentProgressTableProps> = ({
    data,
    loading = false,
    onViewProgress,
    onPageChange,
    currentPage = 1,
    pageSize = 20,
}) => {
    const [sortConfig, setSortConfig] = useState<{ key: keyof IStudentProgress; direction: 'asc' | 'desc' }>({
        key: 'rank',
        direction: 'asc',
    });
    const [filterGrade, setFilterGrade] = useState<string>('');

    const uniqueGrades = useMemo(() => {
        return [...new Set(data.map((item) => item.grade))].filter((grade) => grade).sort().reverse();
    }, [data]);

    const sortedAndFilteredData = useMemo(() => {
        let filtered = [...data];

        if (filterGrade) {
            filtered = filtered.filter((item) => item.grade === filterGrade);
        }

        filtered.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;

            let comparison = 0;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else {
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [data, sortConfig, filterGrade]);

    const handleSort = (key: keyof IStudentProgress) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    if (loading) {
        return <LoadingSpinner message="Loading student progress..." />;
    }

    const totalPages = Math.ceil(sortedAndFilteredData.length / pageSize);

    const renderSortIndicator = (key: keyof IStudentProgress) => (
        sortConfig.key === key ? (
            <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
        ) : null
    );

    const sortableHeaderClass = 'px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Grade Filter Bar */}
            {uniqueGrades.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 flex-wrap">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Grade:</label>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            size="sm"
                            variant={!filterGrade ? 'primary' : 'secondary'}
                            onClick={() => setFilterGrade('')}
                        >
                            All
                        </Button>
                        {uniqueGrades.map((grade) => (
                            <button
                                key={grade}
                                onClick={() => setFilterGrade(grade)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    filterGrade === grade
                                        ? 'ring-2 ring-blue-400 ring-offset-1'
                                        : ''
                                }`}
                            >
                                <Badge variant={getGradeBadgeVariant(grade)} size="sm">{grade}</Badge>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className={`${sortableHeaderClass} w-16`}>
                                <div onClick={() => handleSort('rank')} className="flex items-center justify-center gap-1">
                                    Rank {renderSortIndicator('rank')}
                                </div>
                            </th>
                            <th className={`${sortableHeaderClass} w-24`}>
                                <div onClick={() => handleSort('roll_number')} className="flex items-center justify-center gap-1">
                                    Roll No {renderSortIndicator('roll_number')}
                                </div>
                            </th>
                            <th className={`${sortableHeaderClass} !text-left`}>
                                <div onClick={() => handleSort('student_name')} className="flex items-center gap-1">
                                    Student Name {renderSortIndicator('student_name')}
                                </div>
                            </th>
                            <th className={`${sortableHeaderClass} w-32`}>
                                <div onClick={() => handleSort('total_marks')} className="flex items-center justify-center gap-1">
                                    Marks {renderSortIndicator('total_marks')}
                                </div>
                            </th>
                            <th className={`${sortableHeaderClass} w-40`}>
                                <div onClick={() => handleSort('percentage')} className="flex items-center justify-center gap-1">
                                    Percentage {renderSortIndicator('percentage')}
                                </div>
                            </th>
                            <th className={`${sortableHeaderClass} w-20`}>
                                <div onClick={() => handleSort('grade')} className="flex items-center justify-center gap-1">
                                    Grade {renderSortIndicator('grade')}
                                </div>
                            </th>
                            <th className={`${sortableHeaderClass} w-24`}>
                                <div onClick={() => handleSort('status')} className="flex items-center justify-center gap-1">
                                    Status {renderSortIndicator('status')}
                                </div>
                            </th>
                            {onViewProgress && (
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAndFilteredData.map((student) => (
                            <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                {/* Rank */}
                                <td className="px-6 py-4 text-center">
                                    {student.rank === 1 ? (
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-lg">
                                            🏆
                                        </span>
                                    ) : (
                                        <Badge variant="secondary" size="sm">{student.rank}</Badge>
                                    )}
                                </td>

                                {/* Roll Number */}
                                <td className="px-6 py-4 text-center font-medium text-gray-900 dark:text-white">
                                    {student.roll_number}
                                </td>

                                {/* Student Name */}
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {student.student_name}
                                </td>

                                {/* Total Marks */}
                                <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                                    {student.total_marks} / {student.max_marks}
                                </td>

                                {/* Percentage with Progress Bar */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <Badge
                                            variant={student.percentage >= 75 ? 'success' : student.percentage >= 50 ? 'warning' : 'danger'}
                                            size="sm"
                                        >
                                            {student.percentage.toFixed(2)}%
                                        </Badge>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${getProgressBarColor(student.percentage)}`}
                                                style={{ width: `${Math.min(student.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* Grade */}
                                <td className="px-6 py-4 text-center">
                                    <Badge variant={getGradeBadgeVariant(student.grade)} size="sm">
                                        {student.grade}
                                    </Badge>
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4 text-center">
                                    <Badge
                                        variant={student.status === 'Pass' ? 'success' : 'danger'}
                                        size="sm"
                                    >
                                        {student.status}
                                    </Badge>
                                </td>

                                {/* Actions */}
                                {onViewProgress && (
                                    <td className="px-6 py-4 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewProgress(student.student_id)}
                                        >
                                            View
                                        </Button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && onPageChange && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {sortedAndFilteredData.length > 0 ? 1 : 0}-
                        {Math.min(pageSize, sortedAndFilteredData.length)} of{' '}
                        {sortedAndFilteredData.length} students
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProgressTable;
