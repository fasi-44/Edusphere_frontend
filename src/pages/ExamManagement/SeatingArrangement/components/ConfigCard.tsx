/**
 * ConfigCard
 * Displays a single seating configuration with its actions.
 */

import { FC } from 'react';
import { Button, Badge } from '@/components';
import type { ISeatingConfig } from '../types';
import { CLASS_COLORS } from '../types';
import { formatDate, formatTime } from '../utils';

interface ConfigCardProps {
    config: ISeatingConfig;
    onEdit: (config: ISeatingConfig) => void;
    onDelete: (id: number) => void;
    onGenerate: (id: number) => void;
    onClear: (id: number) => void;
    onViewGrid: (config: ISeatingConfig) => void;
    saving: boolean;
    conflicts: string[];
}

const ConfigCard: FC<ConfigCardProps> = ({
    config,
    onEdit,
    onDelete,
    onGenerate,
    onClear,
    onViewGrid,
    saving,
    conflicts,
}) => {
    const hasConflicts = conflicts.length > 0;

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 transition-colors ${
            hasConflicts
                ? 'border-red-300 dark:border-red-700'
                : 'border-gray-200 dark:border-gray-700'
        }`}>
            {/* Conflict errors */}
            {hasConflicts && (
                <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    {conflicts.map((e, i) => (
                        <p key={i} className="text-xs text-red-600 dark:text-red-400">⚠ {e}</p>
                    ))}
                </div>
            )}

            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {config.room?.room_name || 'Unknown Room'}
                        </h3>
                        <Badge variant={config.is_generated ? 'success' : 'warning'}>
                            {config.is_generated ? 'Generated' : 'Not Generated'}
                        </Badge>
                        {hasConflicts && <Badge variant="danger">Conflict</Badge>}
                        {config.student_count !== undefined && config.student_count > 0 && (
                            <Badge variant="info">{config.student_count} students</Badge>
                        )}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div><span className="font-medium">Exam:</span> {config.exam_type_name || '—'}</div>
                        <div><span className="font-medium">Date:</span> {formatDate(config.exam_date)}</div>
                        <div><span className="font-medium">Time:</span> {formatTime(config.start_time)} – {formatTime(config.end_time)}</div>
                        <div>
                            <span className="font-medium">Layout:</span>{' '}
                            {config.room?.seating_layout?.map(s => `${s.rows}×${s.columns}`).join(' + ') || '—'}
                            {config.room?.capacity ? ` (${config.room.capacity} seats)` : ''}
                        </div>
                        <div><span className="font-medium">Invigilator:</span> {config.invigilator_name || '—'}</div>
                    </div>

                    {/* Class assignments with column info */}
                    {config.class_assignment_details && config.class_assignment_details.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {config.class_assignment_details.map((a, i) => {
                                const color = CLASS_COLORS[i % CLASS_COLORS.length];
                                return (
                                    <span
                                        key={i}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${color.bg} ${color.text}`}
                                    >
                                        <span className="font-medium">
                                            {a.class_name}
                                            {a.section_name !== 'All Sections' ? ` – ${a.section_name}` : ''}
                                        </span>
                                        {a.columns && a.columns.length > 0 && (
                                            <span className="opacity-75">
                                                → Col {a.columns.join(', ')}
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    {config.is_generated ? (
                        <>
                            <Button size="sm" variant="outline" onClick={() => onViewGrid(config)}>
                                View Plan
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onClear(config.id)} disabled={saving}>
                                Clear
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                onClick={() => onGenerate(config.id)}
                                disabled={saving || hasConflicts}
                                title={hasConflicts ? 'Resolve conflicts before generating' : undefined}
                            >
                                Generate
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onEdit(config)}>
                                Edit
                            </Button>
                        </>
                    )}
                    {/* Allow edit of class assignments even after generation */}
                    {config.is_generated && (
                        <Button size="sm" variant="outline" onClick={() => onEdit(config)}>
                            + Add Class
                        </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => onDelete(config.id)}>
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfigCard;
