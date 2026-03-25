import { FC, useState } from 'react';
import { IDataTableProps } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Button from '../ui/Button';

/**
 * DataTable Component
 * Reusable table with pagination, selection, and custom rendering
 * @component
 */
const DataTable: FC<IDataTableProps<any>> = ({
    columns,
    data,
    loading = false,
    error,
    selectable = false,
    selectedRows = [],
    onSelectionChange,
    pagination,
    actions,
    onRowClick,
    emptyMessage = 'No data available',
    className = '',
    striped = true,
    hover = true,
}) => {
    const [allSelected, setAllSelected] = useState(false);

    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange?.([]);
            setAllSelected(false);
        } else {
            onSelectionChange?.(data);
            setAllSelected(true);
        }
    };

    const handleSelectRow = (row: any) => {
        const newSelected = selectedRows.includes(row.id)
            ? selectedRows.filter(id => id !== row.id)
            : [...selectedRows, row.id];
        onSelectionChange?.(newSelected.map(id => data.find(r => r.id === id)));
        setAllSelected(newSelected.length === data.length);
    };

    if (loading) {
        return <LoadingSpinner message="Loading table data..." />;
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return <EmptyState title={emptyMessage} />;
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            {/* Checkbox Column */}
                            {selectable && (
                                <th className="px-6 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </th>
                            )}

                            {/* Data Columns */}
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className={`px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300 ${column.className || ''}`}
                                    style={column.width ? { width: column.width } : {}}
                                >
                                    {column.label}
                                </th>
                            ))}

                            {/* Actions Column */}
                            {actions && (
                                <th className="px-6 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr
                                key={row.id || rowIndex}
                                className={`border-b border-gray-200 dark:border-gray-700 ${striped && rowIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} ${hover ? 'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {/* Checkbox Column */}
                                {selectable && (
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(row.id)}
                                            onChange={() => handleSelectRow(row)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </td>
                                )}

                                {/* Data Columns */}
                                {columns.map((column) => {
                                    const value = row[column.key as keyof typeof row];
                                    return (
                                        <td
                                            key={String(column.key)}
                                            className={`px-4 py-3 text-gray-900 dark:text-gray-100 ${column.className || ''}`}
                                            style={column.width ? { width: column.width, minWidth: column.width } : {}}
                                        >
                                            {column.render ? column.render(value, row, rowIndex) : (value ? String(value) : '-')}
                                        </td>
                                    );
                                })}

                                {/* Actions Column */}
                                {actions && (
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center">
                                            {actions(row)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                        {pagination.total} results
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({
                                length: Math.ceil(pagination.total / pagination.pageSize),
                            }).map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => pagination.onPageChange(i + 1)}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${pagination.page === i + 1
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page === Math.ceil(pagination.total / pagination.pageSize)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
