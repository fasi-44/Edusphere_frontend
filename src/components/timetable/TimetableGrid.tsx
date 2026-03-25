/**
 * Timetable Grid Component
 * Interactive grid display for timetable showing days × periods
 */

import { FC } from 'react';
import { ITimeSlotGenerated, ITimetableEntry } from '../../types/index';

export interface ITimetableGridProps {
    timeSlots: ITimeSlotGenerated[];
    entries: Record<string, ITimetableEntry>;
    onCellClick: (day: string, timeSlot: string) => void;
    readOnly?: boolean;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableGrid: FC<ITimetableGridProps> = ({
    timeSlots,
    entries,
    onCellClick,
    readOnly = false,
}) => {
    const handleCellClick = (day: string, slot: ITimeSlotGenerated) => {
        if (!readOnly && !slot.is_lunch) {
            onCellClick(day, slot.time_display);
        }
    };

    const getCellContent = (day: string, slot: ITimeSlotGenerated) => {
        if (slot.is_lunch) {
            return (
                <div className="flex items-center justify-center h-24 bg-blue-50 dark:bg-blue-900/20">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">LUNCH BREAK</span>
                </div>
            );
        }

        const key = `${day}-${slot.time_display}`;
        const entry = entries[key];

        if (!entry) {
            return (
                <div
                    className={`
                        flex flex-col items-center justify-center h-24 border-2 border-dashed
                        border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900
                        ${!readOnly ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer' : ''}
                        transition-colors
                    `}
                >
                    {!readOnly && (
                        <>
                            <span className="text-2xl text-gray-400 dark:text-gray-600">+</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add</span>
                        </>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 gap-1">
                {/* Subject Name & Code */}
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 text-center truncate">
                    {entry.subject.subject_name}
                </p>

                <p className="text-xs text-gray-600 dark:text-gray-400 text-center truncate">
                    ({entry.subject.subject_code})
                </p>

                {/* Teacher Name */}
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate">
                    {entry.teacher.full_name || entry.teacher.name}
                </p>

                {/* Room Number */}
                {entry.room && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded px-1.5 py-0.5 mt-0.5">
                        Room: {entry.room}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full border-collapse">
                {/* Header */}
                <thead>
                    <tr>
                        <th className="bg-blue-600 dark:bg-blue-700 text-white p-3 text-left font-semibold text-sm border border-blue-700 dark:border-blue-800 min-w-32">
                            Time / Day
                        </th>
                        {DAYS_OF_WEEK.map((day) => (
                            <th
                                key={day}
                                className="bg-blue-600 dark:bg-blue-700 text-white p-3 text-center font-semibold text-sm border border-blue-700 dark:border-blue-800 min-w-40"
                            >
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody>
                    {timeSlots.map((slot, slotIndex) => (
                        <tr key={slotIndex} className="border-t border-gray-200 dark:border-gray-700">
                            {/* Time Column */}
                            <td className="bg-gray-50 dark:bg-gray-800 p-2 text-sm font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                                <div className="text-sm font-bold">{slot.label}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">{slot.time_display}</div>
                            </td>

                            {/* Day Cells */}
                            {DAYS_OF_WEEK.map((day) => (
                                <td
                                    key={`${day}-${slot.time_display}`}
                                    onClick={() => handleCellClick(day, slot)}
                                    className={`border border-gray-200 dark:border-gray-700 p-0 ${
                                        !readOnly && !slot.is_lunch ? 'hover:shadow-md' : ''
                                    } transition-shadow`}
                                >
                                    {getCellContent(day, slot)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimetableGrid;
