/**
 * Seating Arrangement PDF Generator
 * Generates exam seating plan PDF in landscape A4 using pdfmake.
 * Renders per-side grids with student names, roll numbers, and seat labels.
 */

import pdfMake from 'pdfmake/build/pdfmake';
import {
    getReportHeader,
    getReportFooter,
    commonPdfStyles,
    loadPdfFonts,
} from './HeaderAndFooterComponent';
import type { SchoolData, PdfAction } from './printTypes';

export interface SeatingPlanStudent {
    student_name: string;
    roll_no?: string | null;
    seat_label?: string;
    seat_row: number;
    seat_column: number;
    class_id?: number | null;
    class_name?: string | null;
    section_name?: string | null;
}

export interface SeatingArrangementRoom {
    room_name: string;
    capacity: number;
    seating_layout: { name: string; rows: number; columns: number }[];
}

export interface SeatingArrangementReportData {
    examTypeName: string;
    examDate: string;
    startTime: string;
    endTime: string;
    room: SeatingArrangementRoom;
    studentCount: number;
    seatingGrid: SeatingPlanStudent[];
    classAssignmentDetails?: { class_name: string; section_name?: string }[];
}

const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

const formatTime = (t: string): string => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

// Color palette for class differentiation
const CLASS_FILL_COLORS = ['#DBEAFE', '#DCFCE7', '#FEF9C3', '#F3E8FF', '#FCE7F3', '#FFEDD5'];
const CLASS_BORDER_COLORS = ['#93C5FD', '#86EFAC', '#FDE047', '#C4B5FD', '#F9A8D4', '#FDBA74'];

/**
 * Generate Seating Arrangement PDF
 */
export const generateSeatingArrangementPdf = async (
    data: SeatingArrangementReportData,
    schoolData: SchoolData,
    action: PdfAction = 'download'
): Promise<void> => {
    await loadPdfFonts();

    const { examTypeName, examDate, startTime, endTime, room, studentCount, seatingGrid, classAssignmentDetails } = data;
    const sides = room.seating_layout || [];
    const layoutLabel = sides.map(s => `${s.rows}x${s.columns}`).join(' + ');

    const title = 'SEATING ARRANGEMENT';
    const subtitle = `${examTypeName} | ${room.room_name} (${layoutLabel}) | Date: ${formatDate(examDate)} | Time: ${formatTime(startTime)} - ${formatTime(endTime)}`;

    // Build class color map
    const classIds = Array.from(new Set(seatingGrid.filter(p => p.class_id).map(p => p.class_id!)));
    const classColorMap: Record<number, string> = {};
    const classBorderMap: Record<number, string> = {};
    classIds.forEach((id, idx) => {
        classColorMap[id] = CLASS_FILL_COLORS[idx % CLASS_FILL_COLORS.length];
        classBorderMap[id] = CLASS_BORDER_COLORS[idx % CLASS_BORDER_COLORS.length];
    });

    // Legend
    const legendItems: any[] = [];
    const classInfo = classAssignmentDetails || [];
    classIds.forEach((id, idx) => {
        const info = classInfo[idx];
        const label = info
            ? `${info.class_name}${info.section_name && info.section_name !== 'All Sections' ? ' - ' + info.section_name : ''}`
            : `Class ${id}`;
        legendItems.push({
            columns: [
                {
                    canvas: [{
                        type: 'rect', x: 0, y: 0, w: 12, h: 12, r: 2,
                        color: classColorMap[id], lineColor: classBorderMap[id], lineWidth: 1,
                    }],
                    width: 16,
                },
                { text: label, fontSize: 8, margin: [0, 1, 12, 0] },
            ],
            columnGap: 2,
            width: 'auto',
        });
    });
    legendItems.push({
        columns: [
            {
                canvas: [{
                    type: 'rect', x: 0, y: 0, w: 12, h: 12, r: 2,
                    color: '#f9fafb', lineColor: '#d1d5db', lineWidth: 1,
                }],
                width: 16,
            },
            { text: 'Empty seat', fontSize: 8, color: '#888888', margin: [0, 1, 0, 0] },
        ],
        columnGap: 2,
        width: 'auto',
    });

    const legendSection = {
        columns: legendItems,
        columnGap: 8,
        margin: [0, 5, 0, 10],
    };

    // Summary
    const summarySection = {
        columns: [
            { text: [{ text: 'Room: ', bold: true }, `${room.room_name} (${room.capacity} seats)`], fontSize: 9, width: '*' },
            { text: [{ text: 'Students Seated: ', bold: true }, String(studentCount)], fontSize: 9, width: '*', alignment: 'center' },
            { text: [{ text: 'Layout: ', bold: true }, layoutLabel], fontSize: 9, width: '*', alignment: 'right' },
        ],
        margin: [0, 8, 0, 8],
    };

    // Build side-by-side seating tables
    // Each side becomes a pdfmake table
    const buildSideTable = (side: { name: string; rows: number; columns: number }, colOffset: number) => {
        const sideRows = side.rows;
        const sideCols = side.columns;

        // Header row: empty corner + column headers
        const headerRow: any[] = [
            { text: '', fillColor: '#f3f4f6', border: [false, false, false, false] },
        ];
        for (let c = 1; c <= sideCols; c++) {
            headerRow.push({
                text: `C${c}`,
                fontSize: 7,
                bold: true,
                alignment: 'center',
                color: '#888888',
                fillColor: '#f3f4f6',
                border: [false, false, false, true],
                borderColor: ['#e5e7eb', '#e5e7eb', '#e5e7eb', '#e5e7eb'],
            });
        }

        const body: any[][] = [headerRow];

        for (let r = 1; r <= sideRows; r++) {
            const row: any[] = [
                {
                    text: `R${r}`,
                    fontSize: 7,
                    bold: true,
                    color: '#888888',
                    alignment: 'center',
                    fillColor: '#f3f4f6',
                    border: [false, false, true, false],
                    borderColor: ['#e5e7eb', '#e5e7eb', '#e5e7eb', '#e5e7eb'],
                    margin: [0, 6, 0, 6],
                },
            ];

            for (let c = 1; c <= sideCols; c++) {
                const absCol = colOffset + c;
                const plan = seatingGrid.find(p => p.seat_row === r && p.seat_column === absCol);

                if (plan) {
                    const fillColor = classColorMap[plan.class_id || 0] || '#f3f4f6';
                    row.push({
                        stack: [
                            { text: plan.student_name || '', fontSize: 7, bold: true, color: '#111827', alignment: 'center' },
                            ...(plan.roll_no ? [{ text: `Roll: ${plan.roll_no}`, fontSize: 6, color: '#6b7280', alignment: 'center' }] : []),
                            ...(plan.seat_label ? [{ text: plan.seat_label, fontSize: 5, color: '#9ca3af', alignment: 'center' }] : []),
                        ],
                        fillColor,
                        margin: [1, 2, 1, 2],
                    });
                } else {
                    row.push({
                        text: 'Empty',
                        fontSize: 6,
                        color: '#d1d5db',
                        alignment: 'center',
                        fillColor: '#f9fafb',
                        margin: [1, 6, 1, 6],
                    });
                }
            }
            body.push(row);
        }

        // Column widths: row label + equal seat columns
        const colWidth = Math.min(80, Math.floor(700 / (sides.reduce((sum, s) => sum + s.columns, 0) + sides.length)));
        const widths = [18, ...Array(sideCols).fill(colWidth)];

        return {
            stack: [
                { text: side.name || 'Side', fontSize: 8, bold: true, alignment: 'center', color: '#374151', margin: [0, 0, 0, 4] },
                {
                    table: {
                        headerRows: 1,
                        widths,
                        body,
                    },
                    layout: {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#e5e7eb',
                        vLineColor: () => '#e5e7eb',
                        paddingLeft: () => 2,
                        paddingRight: () => 2,
                        paddingTop: () => 1,
                        paddingBottom: () => 1,
                    },
                },
            ],
        };
    };

    // Build all side tables
    const sideTables: any[] = [];
    let colOffset = 0;
    sides.forEach((side, idx) => {
        if (idx > 0) {
            // Aisle separator
            sideTables.push({
                width: 15,
                stack: [
                    { text: '', margin: [0, 15, 0, 0] },
                    {
                        canvas: [{
                            type: 'line', x1: 7, y1: 0, x2: 7, y2: 200,
                            lineWidth: 1, lineColor: '#d1d5db', dash: { length: 3, space: 3 },
                        }],
                    },
                ],
            });
        }
        sideTables.push({
            width: 'auto',
            ...buildSideTable(side, colOffset),
        });
        colOffset += side.columns;
    });

    const seatingSection = {
        columns: [
            { width: '*', text: '' },
            ...sideTables,
            { width: '*', text: '' },
        ],
        columnGap: 0,
        margin: [0, 0, 0, 10],
    };

    // Content
    const content: any[] = [
        getReportHeader(schoolData, title, subtitle, 'landscape', true),
        summarySection,
        legendSection,
        seatingSection,
    ];

    // Document definition
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [25, 20, 25, 50],
        header: (currentPage: number) => {
            if (currentPage === 1) return null;
            return {
                stack: [
                    { text: title, alignment: 'center', fontSize: 10, bold: true, color: '#667eea', margin: [30, 10, 30, 1] },
                    { text: `${room.room_name} | ${formatDate(examDate)}`, alignment: 'center', fontSize: 8, color: '#666666', margin: [30, 0, 30, 0] },
                ],
            };
        },
        footer: (currentPage: number, pageCount: number) => {
            return getReportFooter(currentPage, pageCount, schoolData?.generatedBy);
        },
        content,
        styles: commonPdfStyles,
        defaultStyle: {
            fontSize: 10,
            color: '#333333',
        },
    };

    // Output
    const filename = `Seating_Plan_${room.room_name.replace(/\s+/g, '_')}_${examDate}.pdf`;

    if (action === 'print') {
        pdfMake.createPdf(docDefinition).print();
    } else if (action === 'download') {
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
