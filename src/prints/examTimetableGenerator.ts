/**
 * Exam Timetable Report PDF Generator
 * Generates exam schedule PDF in portrait A4 using pdfmake.
 * Reuses shared header, footer, and styles from HeaderAndFooterComponent.
 */

import pdfMake from 'pdfmake/build/pdfmake';
import {
    getReportHeader,
    getReportFooter,
    getSignatureSection,
    commonPdfStyles,
    loadPdfFonts,
} from './HeaderAndFooterComponent';
import type { SchoolData, PdfAction } from './printTypes';

export interface ExamTimetableEntry {
    subject_name: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    duration_minutes?: number;
    room?: string;
    seat_label?: string;
    invigilator_name?: string | null;
    section_name?: string | null;
    notes?: string;
}

export interface ExamTimetableReportData {
    examName: string;
    className: string;
    sectionName?: string;
    studentName?: string;
    entries: ExamTimetableEntry[];
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

/**
 * Generate Exam Timetable PDF
 */
export const generateExamTimetablePdf = async (
    data: ExamTimetableReportData,
    schoolData: SchoolData,
    action: PdfAction = 'download'
): Promise<void> => {
    await loadPdfFonts();

    const { examName, className, sectionName, studentName, entries } = data;
    const isStudentTimetable = !!studentName;

    const title = 'EXAMINATION TIMETABLE';
    const subtitleParts = [examName, `Class: ${className}${sectionName ? ` - ${sectionName}` : ''}`];
    if (studentName) subtitleParts.push(`Student: ${studentName}`);
    const subtitle = subtitleParts.join(' | ');

    // Sort entries by date, then start_time
    const sorted = [...entries].sort((a, b) => {
        if (a.exam_date !== b.exam_date) return a.exam_date.localeCompare(b.exam_date);
        return a.start_time.localeCompare(b.start_time);
    });

    // --- Table ---
    const headerStyle = { style: 'tableHeader', fillColor: '#667eea', color: '#ffffff' };
    const tableHeader: any[] = [
        { text: 'Date', ...headerStyle, alignment: 'center' },
        { text: 'Subject', ...headerStyle, alignment: 'left' },
        { text: 'Time', ...headerStyle, alignment: 'center' },
        { text: 'Room', ...headerStyle, alignment: 'center' },
        ...(isStudentTimetable ? [{ text: 'Seat', ...headerStyle, alignment: 'center' }] : []),
        { text: 'Invigilator', ...headerStyle, alignment: 'left' },
        { text: 'Invigilator\nSignature', ...headerStyle, alignment: 'center' },
    ];

    const tableBody: any[][] = [tableHeader];

    sorted.forEach((entry, index) => {
        const rowFill = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        tableBody.push([
            {
                stack: [
                    { text: formatDate(entry.exam_date), fontSize: 9, bold: true },
                    {
                        text: new Date(entry.exam_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }),
                        fontSize: 7, color: '#666666',
                    },
                ],
                alignment: 'center',
                fillColor: rowFill,
                margin: [2, 3, 2, 3],
            },
            {
                stack: [
                    { text: entry.subject_name, fontSize: 10, bold: true, color: '#333333' },
                    ...(entry.section_name ? [{ text: `Section: ${entry.section_name}`, fontSize: 7, color: '#888888', margin: [0, 1, 0, 0] }] : []),
                    ...(entry.notes ? [{ text: entry.notes, fontSize: 7, color: '#888888', italics: true, margin: [0, 1, 0, 0] }] : []),
                ],
                fillColor: rowFill,
                margin: [2, 3, 2, 3],
            },
            {
                text: `${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}`,
                alignment: 'center', fontSize: 9, fillColor: rowFill,
            },
            {
                text: entry.room || '-',
                alignment: 'center', fontSize: 9, fillColor: rowFill,
            },
            ...(isStudentTimetable ? [{
                text: entry.seat_label || '-',
                alignment: 'center', fontSize: 9, fillColor: rowFill,
            }] : []),
            {
                text: entry.invigilator_name || '-',
                fontSize: 9, fillColor: rowFill,
            },
            {
                text: '',
                fillColor: rowFill,
            },
        ]);
    });

    const examTable: any = {
        style: 'section',
        table: {
            headerRows: 1,
            widths: isStudentTimetable ? [65, '*', 85, 50, 40, 75, 65] : [70, '*', 95, 55, 80, 75],
            body: tableBody,
        },
        layout: {
            hLineWidth: (i: number, node: any) =>
                i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: (i: number) => (i === 0 || i === 1 ? '#667eea' : '#e0e0e0'),
            vLineColor: () => '#e0e0e0',
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 4,
            paddingBottom: () => 4,
        },
        margin: [0, 0, 0, 15],
    };

    // --- Summary ---
    const totalSubjects = sorted.length;
    const dates = [...new Set(sorted.map(e => e.exam_date))];
    const firstDate = dates.length > 0 ? formatDate(dates[0]) : '-';
    const lastDate = dates.length > 0 ? formatDate(dates[dates.length - 1]) : '-';

    const summarySection = {
        columns: [
            {
                width: '*',
                text: [
                    { text: 'Total Subjects: ', bold: true, fontSize: 9 },
                    { text: String(totalSubjects), fontSize: 9 },
                ],
            },
            {
                width: '*',
                text: [
                    { text: 'Exam Period: ', bold: true, fontSize: 9 },
                    { text: `${firstDate} to ${lastDate}`, fontSize: 9 },
                ],
                alignment: 'center',
            },
            {
                width: '*',
                text: [
                    { text: 'Total Days: ', bold: true, fontSize: 9 },
                    { text: String(dates.length), fontSize: 9 },
                ],
                alignment: 'right',
            },
        ],
        margin: [0, 15, 0, 10],
    };

    // --- Notes ---
    const notesSection = {
        text: [
            { text: 'Instructions: ', bold: true, fontSize: 9 },
            {
                text: 'Students must carry their hall ticket and ID card. Reach the exam hall 15 minutes before the scheduled time. Use of mobile phones or electronic devices is strictly prohibited.',
                fontSize: 8,
                italics: true,
                color: '#666666',
            },
        ],
        margin: [0, 5, 0, 0],
    };

    // --- Content ---
    const content: any[] = [
        getReportHeader(schoolData, title, subtitle, 'portrait', true),
        summarySection,
        examTable,
        notesSection,
        getSignatureSection([
            { label: 'Exam Coordinator', position: 'left' },
            { label: 'Principal', position: 'right' },
        ]),
    ];

    // --- Document Definition ---
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [30, 20, 30, 50],
        header: (currentPage: number) => {
            if (currentPage === 1) return null;
            return {
                stack: [
                    {
                        text: title,
                        alignment: 'center',
                        fontSize: 10,
                        bold: true,
                        color: '#667eea',
                        margin: [30, 10, 30, 1],
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

    // --- Output ---
    const studentSuffix = studentName ? `_${studentName.replace(/\s+/g, '_')}` : '';
    const filename = `Exam_Timetable_${examName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}${studentSuffix}.pdf`;

    if (action === 'print') {
        pdfMake.createPdf(docDefinition).print();
    } else if (action === 'download') {
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
