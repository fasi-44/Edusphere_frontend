/**
 * Attendance Report PDF Generator
 * Generates single-day and monthly attendance reports using pdfmake.
 * Reuses shared header, footer, signature, and styles from HeaderAndFooterComponent.
 */

import pdfMake from 'pdfmake/build/pdfmake';
import {
    getReportHeader,
    getReportFooter,
    getSignatureSection,
    commonPdfStyles,
    formatDate,
    formatDateShort,
    loadPdfFonts,
} from './HeaderAndFooterComponent';
import type { SchoolData, PdfAction, AttendanceReportData } from './printTypes';

// A4 landscape width in points
const A4_WIDTH = 841.89;

/**
 * Generate Attendance Report PDF
 */
export const generateAttendanceReport = async (
    reportData: AttendanceReportData,
    schoolData: SchoolData,
    action: PdfAction = 'download'
): Promise<void> => {
    await loadPdfFonts();

    const content: any[] = [];
    let title = '';
    let subtitle = '';
    let pageOrientation: 'portrait' | 'landscape' = 'portrait';

    if (reportData.type === 'single') {
        // ─── Single Day Attendance Report ───
        const { className, sectionName, date, records, statistics } = reportData;

        title = 'DAILY ATTENDANCE REPORT';
        subtitle = `Class: ${className} - ${sectionName} | Date: ${formatDate(date)}`;

        // Statistics summary
        content.push({
            style: 'section',
            table: {
                widths: ['*', '*', '*', '*', '*'],
                body: [
                    [
                        { text: 'Total Students', style: 'tableHeader', alignment: 'center', fillColor: '#f5f5f5', color: '#333333' },
                        { text: 'Present', style: 'tableHeader', alignment: 'center', fillColor: '#e8f5e9', color: '#333333' },
                        { text: 'Absent', style: 'tableHeader', alignment: 'center', fillColor: '#ffebee', color: '#333333' },
                        { text: 'Late', style: 'tableHeader', alignment: 'center', fillColor: '#fff3e0', color: '#333333' },
                        { text: 'Attendance Rate', style: 'tableHeader', alignment: 'center', fillColor: '#e3f2fd', color: '#333333' },
                    ],
                    [
                        { text: statistics.total_students, alignment: 'center', fontSize: 14, bold: true },
                        { text: statistics.present, alignment: 'center', fontSize: 14, bold: true, color: '#4caf50' },
                        { text: statistics.absent, alignment: 'center', fontSize: 14, bold: true, color: '#f44336' },
                        { text: statistics.late, alignment: 'center', fontSize: 14, bold: true, color: '#ff9800' },
                        { text: `${statistics.attendance_rate}%`, alignment: 'center', fontSize: 14, bold: true, color: '#2196f3' },
                    ],
                ],
            },
            layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#667eea',
                vLineColor: () => '#e0e0e0',
            },
            margin: [0, 0, 0, 20],
        });

        // Student-wise attendance table
        const tableBody: any[][] = [
            [
                { text: '#', style: 'tableHeader', fillColor: '#667eea', color: '#ffffff' },
                { text: 'Roll No', style: 'tableHeader', fillColor: '#667eea', color: '#ffffff' },
                { text: 'Student Name', style: 'tableHeader', fillColor: '#667eea', color: '#ffffff' },
                { text: 'Status', style: 'tableHeader', fillColor: '#667eea', color: '#ffffff' },
                { text: 'Remarks', style: 'tableHeader', fillColor: '#667eea', color: '#ffffff' },
            ],
        ];

        records.forEach((record, index) => {
            const statusColor =
                record.status === 'Present' ? '#4caf50' :
                record.status === 'Absent' ? '#f44336' :
                record.status === 'Late' ? '#ff9800' : '#2196f3';

            tableBody.push([
                { text: index + 1, alignment: 'center' },
                { text: record.student.roll_no, alignment: 'center' },
                { text: record.student.name },
                { text: record.status, alignment: 'center', color: statusColor, bold: true },
                { text: record.remarks || '-', fontSize: 9 },
            ]);
        });

        content.push({
            style: 'section',
            table: {
                widths: [30, 60, '*', 80, '*'],
                body: tableBody,
            },
            layout: {
                hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0.5),
                vLineWidth: () => 0.5,
                hLineColor: (i: number) => (i === 0 || i === 1 ? '#667eea' : '#e0e0e0'),
                vLineColor: () => '#e0e0e0',
                fillColor: (i: number) => (i === 0 ? '#667eea' : null),
            },
        });
    } else {
        // ─── Monthly Attendance Report ───
        const { className, sectionName, startDate, endDate, records } = reportData;
        const { students, dates, summary } = records;

        pageOrientation = 'landscape';
        title = 'MONTHLY ATTENDANCE REPORT';
        subtitle = `Class: ${className} - ${sectionName} | Period: ${formatDate(startDate)} to ${formatDate(endDate)}`;

        // Available content width in landscape A4
        const marginLeft = 30;
        const marginRight = 30;
        const availableWidth = A4_WIDTH - marginLeft - marginRight; // ~782pt

        const numDates = dates.length;
        const totalColumns = 3 + numDates + 5; // fixed + dates + summary

        // Cell padding per column (pdfmake default is ~5 each side = 10 per cell)
        // We'll use tight padding: 2pt each side = 4pt per column
        const cellPadding = 4;
        const totalPaddingUsed = totalColumns * cellPadding;

        // Usable width for actual content (after padding)
        const usableWidth = availableWidth - totalPaddingUsed;

        // Fixed column widths
        const snoWidth = 14;
        const rollWidth = 22;
        const summaryColWidth = 18;
        const totalSummaryWidth = summaryColWidth * 5; // 90pt for 5 summary cols

        // Remaining width for name + date columns
        const remainingWidth = usableWidth - snoWidth - rollWidth - totalSummaryWidth;

        // Name column gets ~15% of remaining, dates get the rest
        const nameWidth = Math.max(50, Math.min(80, Math.floor(remainingWidth * 0.15)));
        const datesTotalWidth = remainingWidth - nameWidth;
        const dateColWidth = Math.max(10, Math.floor(datesTotalWidth / numDates));

        // Font sizes - scale down for dense tables
        const dateFontSize = numDates > 25 ? 5 : numDates > 20 ? 6 : 7;
        const cellFontSize = numDates > 25 ? 5 : numDates > 20 ? 6 : 7;
        const nameFontSize = numDates > 25 ? 6 : 7;
        const headerFontSize = numDates > 25 ? 5 : numDates > 20 ? 6 : 7;

        const columnWidths = [
            snoWidth,
            rollWidth,
            nameWidth,
            ...Array(numDates).fill(dateColWidth),
            ...Array(5).fill(summaryColWidth),
        ];

        // Overall summary at top
        content.push({
            style: 'section',
            table: {
                widths: ['*', '*', '*', '*'],
                body: [
                    [
                        { text: 'Total Students', style: 'tableHeader', alignment: 'center', fillColor: '#f5f5f5', color: '#333333' },
                        { text: 'Total Days', style: 'tableHeader', alignment: 'center', fillColor: '#f5f5f5', color: '#333333' },
                        { text: 'Total Present', style: 'tableHeader', alignment: 'center', fillColor: '#e8f5e9', color: '#333333' },
                        { text: 'Overall Rate', style: 'tableHeader', alignment: 'center', fillColor: '#e3f2fd', color: '#333333' },
                    ],
                    [
                        { text: summary.total_students, alignment: 'center', fontSize: 12, bold: true },
                        { text: summary.total_days, alignment: 'center', fontSize: 12, bold: true },
                        { text: summary.total_present, alignment: 'center', fontSize: 12, bold: true, color: '#4caf50' },
                        { text: `${summary.overall_attendance_rate}%`, alignment: 'center', fontSize: 12, bold: true, color: '#2196f3' },
                    ],
                ],
            },
            layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#667eea',
                vLineColor: () => '#e0e0e0',
            },
            margin: [0, 0, 0, 15],
        });

        // Legend
        content.push({
            columns: [
                { text: `(${formatDate(startDate)} - ${formatDate(endDate)})`, fontSize: 8, bold: true, width: 'auto' },
                { text: '', width: '*' },
                { text: 'P - Present', fontSize: 7, color: '#4caf50', width: 'auto', margin: [0, 0, 12, 0] },
                { text: 'A - Absent', fontSize: 7, color: '#f44336', width: 'auto', margin: [0, 0, 12, 0] },
                { text: 'L - Late', fontSize: 7, color: '#ff9800', width: 'auto', margin: [0, 0, 12, 0] },
                { text: 'Lv - Leave', fontSize: 7, color: '#2196f3', width: 'auto', margin: [0, 0, 12, 0] },
                { text: '— Not Marked', fontSize: 7, color: '#bdbdbd', width: 'auto' },
            ],
            margin: [0, 0, 0, 8],
        });

        // Header row
        const headerRow: any[] = [
            { text: '#', fontSize: headerFontSize, bold: true, fillColor: '#667eea', color: '#ffffff', alignment: 'center' },
            { text: 'Roll', fontSize: headerFontSize, bold: true, fillColor: '#667eea', color: '#ffffff', alignment: 'center' },
            { text: 'Name', fontSize: headerFontSize, bold: true, fillColor: '#667eea', color: '#ffffff' },
        ];

        dates.forEach((date) => {
            headerRow.push({
                text: formatDateShort(date),
                fontSize: dateFontSize,
                bold: true,
                fillColor: '#667eea',
                color: '#ffffff',
                alignment: 'center',
            });
        });

        headerRow.push(
            { text: 'Days', fontSize: headerFontSize, bold: true, fillColor: '#667eea', color: '#ffffff', alignment: 'center' },
            { text: 'P', fontSize: headerFontSize, bold: true, fillColor: '#667eea', color: '#ffffff', alignment: 'center' },
            { text: 'A', fontSize: headerFontSize, bold: true, fillColor: '#667eea', color: '#ffffff', alignment: 'center' },
            { text: 'L', fontSize: headerFontSize, bold: true, fillColor: '#667eea', color: '#ffffff', alignment: 'center' },
            { text: '%', fontSize: headerFontSize, bold: true, fillColor: '#667eea', color: '#ffffff', alignment: 'center' }
        );

        const tableBody: any[][] = [headerRow];

        // Student rows
        students.forEach((student, index) => {
            const row: any[] = [
                { text: index + 1, alignment: 'center', fontSize: cellFontSize },
                { text: student.student.roll_no || '-', alignment: 'center', fontSize: cellFontSize },
                { text: student.student.name, fontSize: nameFontSize, noWrap: false },
            ];

            student.daily_attendance.forEach((dayAtt) => {
                const statusMap: Record<string, { symbol: string; color: string; bg: string | null }> = {
                    'Present': { symbol: 'P', color: '#1565c0', bg: '#e8f5e9' },
                    'Absent': { symbol: 'A', color: '#c62828', bg: '#ffebee' },
                    'Late': { symbol: 'L', color: '#e65100', bg: '#fff3e0' },
                    'Leave': { symbol: 'Lv', color: '#1565c0', bg: '#e3f2fd' },
                    'Medical_Leave': { symbol: 'ML', color: '#1565c0', bg: '#e3f2fd' },
                    'Excused': { symbol: 'E', color: '#616161', bg: '#f5f5f5' },
                    'Not Marked': { symbol: '-', color: '#9e9e9e', bg: null },
                };

                const statusInfo = statusMap[dayAtt.status] || { symbol: '-', color: '#9e9e9e', bg: null };

                row.push({
                    text: statusInfo.symbol,
                    alignment: 'center',
                    fontSize: cellFontSize,
                    bold: true,
                    color: statusInfo.color,
                    fillColor: statusInfo.bg,
                });
            });

            const pctColor =
                student.summary.attendance_percentage >= 90 ? '#4caf50' :
                student.summary.attendance_percentage >= 75 ? '#ff9800' : '#f44336';

            row.push(
                { text: student.summary.total_days, alignment: 'center', fontSize: cellFontSize },
                { text: student.summary.present_count, alignment: 'center', fontSize: cellFontSize, color: '#4caf50' },
                { text: student.summary.absent_count, alignment: 'center', fontSize: cellFontSize, color: '#f44336' },
                { text: student.summary.late_count, alignment: 'center', fontSize: cellFontSize, color: '#ff9800' },
                { text: `${student.summary.attendance_percentage}%`, alignment: 'center', fontSize: cellFontSize, bold: true, color: pctColor }
            );

            tableBody.push(row);
        });

        content.push({
            style: 'section',
            table: {
                widths: columnWidths,
                body: tableBody,
                headerRows: 1,
                dontBreakRows: true,
            },
            layout: {
                hLineWidth: (i: number, node: any) =>
                    i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.3,
                vLineWidth: () => 0.3,
                hLineColor: (i: number) => (i === 0 || i === 1 ? '#667eea' : '#e0e0e0'),
                vLineColor: () => '#e0e0e0',
                paddingLeft: () => 2,
                paddingRight: () => 2,
                paddingTop: () => 3,
                paddingBottom: () => 3,
            },
        });

        // Attendance criteria
        content.push({
            text: 'Attendance Criteria: \u226590% - Excellent | 75-89% - Good | 60-74% - Warning | <60% - Critical',
            fontSize: 7,
            italics: true,
            color: '#666666',
            margin: [0, 8, 0, 0],
        });
    }

    // Signature section
    content.push(getSignatureSection());

    // Insert full school header as first content element (page 1 only)
    content.unshift(getReportHeader(schoolData, title, subtitle, pageOrientation, true));

    // Compact top margin: just enough for page 2+ continuation header
    const topMargin = 45;
    const sideMargins = pageOrientation === 'landscape' ? 30 : 40;

    // Build document definition
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation,
        pageMargins: [sideMargins, topMargin, sideMargins, pageOrientation === 'landscape' ? 50 : 60],
        header: (currentPage: number, _pageCount: number) => {
            if (currentPage === 1) return null;
            // Page 2+: simple title + subtitle
            return {
                stack: [
                    {
                        text: title,
                        alignment: 'center',
                        fontSize: 10,
                        bold: true,
                        color: '#667eea',
                        margin: [sideMargins, 10, sideMargins, 1],
                    },
                    {
                        text: subtitle,
                        alignment: 'center',
                        fontSize: 8,
                        color: '#666666',
                        margin: [sideMargins, 0, sideMargins, 0],
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

    // Output the PDF
    if (action === 'print') {
        pdfMake.createPdf(docDefinition).print();
    } else if (action === 'download') {
        const filename =
            reportData.type === 'single'
                ? `Attendance_${reportData.className}_${reportData.sectionName}_${reportData.date}.pdf`
                : `Attendance_Register_${reportData.className}_${reportData.sectionName}_${reportData.startDate}_to_${reportData.endDate}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
