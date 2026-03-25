/**
 * Timetable Report PDF Generator
 * Generates class timetable PDF in landscape A4 using pdfmake.
 * Reuses shared header, footer, signature, and styles from HeaderAndFooterComponent.
 */

import pdfMake from 'pdfmake/build/pdfmake';
import {
    getReportHeader,
    getReportFooter,
    commonPdfStyles,
    loadPdfFonts,
} from './HeaderAndFooterComponent';
import type { SchoolData, PdfAction, TimetableReportData } from './printTypes';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Get teacher display name from various possible field shapes
 */
const getTeacherName = (teacher: any): string => {
    if (!teacher) return '';
    if (teacher.full_name) return teacher.full_name;
    if (teacher.name) return teacher.name;
    if (teacher.first_name) {
        return `${teacher.first_name}${teacher.last_name ? ' ' + teacher.last_name : ''}`;
    }
    return '';
};

/**
 * Generate Timetable PDF
 */
export const generateTimetablePdf = async (
    data: TimetableReportData,
    schoolData: SchoolData,
    action: PdfAction = 'download'
): Promise<void> => {
    await loadPdfFonts();

    const {
        className,
        sectionName,
        academicYear,
        semester,
        configuration,
        timeSlots,
        entries,
        isDraft,
    } = data;

    const title = isDraft ? 'CLASS TIMETABLE (DRAFT)' : 'CLASS TIMETABLE';
    const subtitle = `Class: ${className} - ${sectionName} | Academic Year: ${academicYear} | Semester: ${semester}`;

    // ─── Timetable Grid ───

    // Header row: Time/Day + days of week
    const tableHeader: any[] = [
        {
            text: 'Time / Day',
            style: 'tableHeader',
            alignment: 'center',
            fillColor: '#667eea',
            color: '#ffffff',
            bold: true,
        },
    ];

    DAYS_OF_WEEK.forEach((day) => {
        tableHeader.push({
            text: day,
            style: 'tableHeader',
            alignment: 'center',
            fillColor: '#667eea',
            color: '#ffffff',
            bold: true,
        });
    });

    const tableBody: any[][] = [tableHeader];

    // Data rows: one row per time slot
    timeSlots.forEach((slot) => {
        const row: any[] = [
            {
                stack: [
                    { text: slot.label, fontSize: 9, bold: true },
                    { text: slot.time_display, fontSize: 7, color: '#666666', margin: [0, 2, 0, 0] },
                ],
                fillColor: '#f5f5f5',
                margin: [4, 4, 4, 4],
            },
        ];

        DAYS_OF_WEEK.forEach((day) => {
            if (slot.is_lunch) {
                row.push({
                    text: 'LUNCH BREAK',
                    alignment: 'center',
                    fontSize: 9,
                    bold: true,
                    color: '#1976d2',
                    fillColor: '#e3f2fd',
                    margin: [4, 12, 4, 12],
                });
            } else {
                const key = `${day}-${slot.time_display}`;
                const entry = entries[key];

                if (entry) {
                    const teacherName = getTeacherName(entry.teacher);
                    const subjectLine: any[] = [
                        { text: entry.subject.subject_name, fontSize: 9, bold: true, color: '#667eea' },
                    ];
                    if (entry.subject.subject_code) {
                        subjectLine.push({ text: ` (${entry.subject.subject_code})`, fontSize: 7, color: '#666666' });
                    }

                    const teacherLine: any[] = [];
                    if (teacherName) {
                        teacherLine.push({ text: teacherName, fontSize: 8 });
                    }
                    if (entry.room) {
                        teacherLine.push({ text: teacherName ? ` \u2022 ${entry.room}` : entry.room, fontSize: 7, color: '#666666', italics: true });
                    }

                    row.push({
                        stack: [
                            { text: subjectLine, margin: [0, 0, 0, 2] },
                            ...(teacherLine.length > 0 ? [{ text: teacherLine }] : []),
                        ],
                        margin: [3, 3, 3, 3],
                    });
                } else {
                    row.push({
                        text: '-',
                        alignment: 'center',
                        color: '#cccccc',
                        fontSize: 10,
                        margin: [4, 12, 4, 12],
                    });
                }
            }
        });

        tableBody.push(row);
    });

    const timetableTable: any = {
        style: 'section',
        table: {
            headerRows: 1,
            widths: [70, ...Array(DAYS_OF_WEEK.length).fill('*')],
            body: tableBody,
        },
        layout: {
            hLineWidth: (i: number, node: any) =>
                i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: (i: number) => (i === 0 || i === 1 ? '#667eea' : '#e0e0e0'),
            vLineColor: () => '#e0e0e0',
        },
        margin: [0, 0, 0, 15],
    };

    // ─── Notes ───
    const notesSection = {
        text: [
            { text: 'Note: ', bold: true, fontSize: 9 },
            {
                text: 'This timetable is subject to change. Students are requested to check for updates regularly.',
                fontSize: 8,
                italics: true,
                color: '#666666',
            },
        ],
        margin: [0, 10, 0, 0],
    };

    // ─── Content ───
    const content: any[] = [
        getReportHeader(schoolData, title, subtitle, 'landscape', true),
        timetableTable,
        notesSection,
    ];

    // ─── Document Definition ───
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [30, 20, 30, 50],
        header: (currentPage: number, _pageCount: number) => {
            if (currentPage === 1) return null;
            return {
                stack: [
                    {
                        text: title,
                        alignment: 'center',
                        fontSize: 10,
                        bold: true,
                        color: '#667eea',
                        margin: [30, 0, 30, 1],
                    },
                    {
                        text: subtitle,
                        alignment: 'center',
                        fontSize: 8,
                        color: '#666666',
                        margin: [30, 0, 30, 0],
                    },
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

    // ─── Output ───
    if (action === 'print') {
        pdfMake.createPdf(docDefinition).print();
    } else if (action === 'download') {
        const filename = `Timetable_${className}_${sectionName}_${academicYear}_Sem${semester}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
