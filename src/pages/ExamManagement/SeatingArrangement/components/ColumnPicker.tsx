/**
 * ColumnPicker
 * Visual mini-grid for selecting which columns a class occupies in a room.
 * - Shows each side of the room as a section
 * - Column headers are clickable to toggle
 * - Taken columns (by other classes) are shown in their color and are not selectable
 */

import { FC } from 'react';
import type { IRoomLayout } from '../types';
import { CLASS_COLORS } from '../types';

interface ColumnPickerProps {
    /** The room's seating layout (sides) */
    layout: IRoomLayout[];
    /** Currently selected columns for THIS assignment (absolute col numbers) */
    selectedColumns: number[];
    /** Map of absolute col number → class assignment index (for other classes' taken columns) */
    takenColumns: Record<number, number>;
    /** Index of the current class assignment (for color) */
    classIndex: number;
    onChange: (columns: number[]) => void;
}

const ColumnPicker: FC<ColumnPickerProps> = ({
    layout,
    selectedColumns,
    takenColumns,
    classIndex,
    onChange,
}) => {
    const myColor = CLASS_COLORS[classIndex % CLASS_COLORS.length];

    const toggleColumn = (absCol: number) => {
        if (takenColumns[absCol] !== undefined && takenColumns[absCol] !== classIndex) return; // taken by other
        if (selectedColumns.includes(absCol)) {
            onChange(selectedColumns.filter(c => c !== absCol));
        } else {
            onChange([...selectedColumns, absCol]);
        }
    };

    let colOffset = 0;

    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {layout.map((side, sideIdx) => {
                const sideCols = Array.from({ length: side.columns }, (_, i) => colOffset + i + 1);
                colOffset += side.columns;

                return (
                    <div key={sideIdx} className="min-w-0 shrink-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {side.name || `Side ${sideIdx + 1}`} — {side.rows} rows × {side.columns} cols
                        </p>
                        <div className="border border-black dark:border-gray-400 rounded-lg overflow-hidden inline-block">
                            {/* Column headers — clickable */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <div className="w-8 shrink-0" /> {/* row label spacer */}
                                {sideCols.map((absCol) => {
                                    const isSelected = selectedColumns.includes(absCol);
                                    const takerIdx = takenColumns[absCol];
                                    const isTakenByOther = takerIdx !== undefined && takerIdx !== classIndex;
                                    const takerColor = isTakenByOther ? CLASS_COLORS[takerIdx % CLASS_COLORS.length] : null;

                                    return (
                                        <button
                                            key={absCol}
                                            type="button"
                                            onClick={() => toggleColumn(absCol)}
                                            disabled={isTakenByOther}
                                            title={
                                                isTakenByOther
                                                    ? `Column taken by another class`
                                                    : isSelected
                                                    ? `Deselect column ${absCol}`
                                                    : `Select column ${absCol}`
                                            }
                                            className={`
                                                w-8 h-7 text-[10px] font-semibold border-r last:border-r-0
                                                border-gray-200 dark:border-gray-700 transition-colors
                                                ${isTakenByOther
                                                    ? `${takerColor?.bg} ${takerColor?.text} cursor-not-allowed opacity-70`
                                                    : isSelected
                                                    ? `${myColor.bg} ${myColor.text} cursor-pointer`
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-600 dark:text-gray-400'
                                                }
                                            `}
                                        >
                                            C{absCol}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Rows */}
                            {Array.from({ length: side.rows }, (_, rIdx) => (
                                <div
                                    key={rIdx}
                                    className="flex border-b last:border-b-0 border-gray-200 dark:border-gray-700"
                                >
                                    {/* Row label */}
                                    <div className="w-8 shrink-0 flex items-center justify-center text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700">
                                        R{rIdx + 1}
                                    </div>
                                    {sideCols.map((absCol) => {
                                        const isSelected = selectedColumns.includes(absCol);
                                        const takerIdx = takenColumns[absCol];
                                        const isTakenByOther = takerIdx !== undefined && takerIdx !== classIndex;
                                        const takerColor = isTakenByOther ? CLASS_COLORS[takerIdx % CLASS_COLORS.length] : null;

                                        return (
                                            <div
                                                key={absCol}
                                                onClick={() => toggleColumn(absCol)}
                                                className={`
                                                    w-8 h-6 border-r last:border-r-0 border-gray-200 dark:border-gray-700
                                                    ${isTakenByOther
                                                        ? `${takerColor?.bg} cursor-not-allowed`
                                                        : isSelected
                                                        ? `${myColor.bg} cursor-pointer`
                                                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                                                    }
                                                `}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Selection summary for this side */}
                        {sideCols.some(c => selectedColumns.includes(c)) && (
                            <p className={`text-xs mt-1 ${myColor.text}`}>
                                Selected: {sideCols.filter(c => selectedColumns.includes(c)).map(c => `C${c}`).join(', ')}
                                {' '}({side.rows * sideCols.filter(c => selectedColumns.includes(c)).length} seats)
                            </p>
                        )}
                    </div>
                );
            })}

            <p className="text-xs text-yellow-600 dark:text-yellow-400 w-full text-center">
                Click column headers above to select which columns this class will occupy.
            </p>
        </div>
    );
};

export default ColumnPicker;
