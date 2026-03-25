/**
 * SeatingArrangement — utility helpers
 */

import type { IRoomLayout } from './types';

export const formatTime = (t: string): string => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

export const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateShort = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Returns the total number of columns in a room layout.
 */
export const getTotalColumns = (layout: IRoomLayout[]): number =>
    layout.reduce((sum, side) => sum + side.columns, 0);

/**
 * Given an absolute column number (1-based), returns which side it belongs to
 * and its relative column index within that side.
 */
export const absColToSide = (
    absCol: number,
    layout: IRoomLayout[]
): { sideIndex: number; relCol: number; side: IRoomLayout } | null => {
    let offset = 0;
    for (let i = 0; i < layout.length; i++) {
        const side = layout[i];
        if (absCol > offset && absCol <= offset + side.columns) {
            return { sideIndex: i, relCol: absCol - offset, side };
        }
        offset += side.columns;
    }
    return null;
};

/**
 * Groups absolute column numbers by side index.
 */
export const groupColumnsBySide = (
    columns: number[],
    layout: IRoomLayout[]
): Record<number, number[]> => {
    const result: Record<number, number[]> = {};
    for (const col of columns) {
        const info = absColToSide(col, layout);
        if (info) {
            if (!result[info.sideIndex]) result[info.sideIndex] = [];
            result[info.sideIndex].push(col);
        }
    }
    return result;
};
