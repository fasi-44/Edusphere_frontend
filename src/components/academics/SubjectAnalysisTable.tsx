/**
 * Subject Analysis Table Component
 * Displays subject-wise performance analysis using reusable DataTable and Badge
 */

import { FC } from 'react';
import { ISubjectAnalysis } from '../../types/index';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';

interface SubjectAnalysisTableProps {
    data: ISubjectAnalysis[];
    loading?: boolean;
}

const SubjectAnalysisTable: FC<SubjectAnalysisTableProps> = ({ data, loading = false }) => {
    const columns = [
        {
            key: 'subject_name',
            label: 'Subject',
            render: (_: any, row: ISubjectAnalysis) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {row.subject_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {row.subject_code}
                    </span>
                </div>
            ),
        },
        {
            key: 'max_marks',
            label: 'Max Marks',
            className: 'text-center',
            width: '7rem',
            render: (value: number) => (
                <span className="font-medium">{value}</span>
            ),
        },
        {
            key: 'average_marks',
            label: 'Class Average',
            className: 'text-center',
            width: '8rem',
            render: (_: any, row: ISubjectAnalysis) => {
                const avgPercentage = (row.average_marks / row.max_marks) * 100;
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {row.average_marks.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({avgPercentage.toFixed(1)}%)
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'highest_marks',
            label: 'Highest',
            className: 'text-center',
            width: '6rem',
            render: (value: number) => (
                <Badge variant="success" size="sm">{value}</Badge>
            ),
        },
        {
            key: 'lowest_marks',
            label: 'Lowest',
            className: 'text-center',
            width: '6rem',
            render: (value: number) => (
                <Badge variant="danger" size="sm">{value}</Badge>
            ),
        },
        {
            key: 'pass_percentage',
            label: 'Pass %',
            className: 'text-center',
            width: '8rem',
            render: (value: number) => {
                const pct = value || 0;
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {pct.toFixed(1)}%
                        </span>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage="No subject analysis data available"
            striped={false}
        />
    );
};

export default SubjectAnalysisTable;
