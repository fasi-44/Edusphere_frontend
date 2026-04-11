/**
 * Annual Progress Report PDF Generator
 * Generates comprehensive annual report showing all exams for a student
 * Portrait A4 format
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

export interface ExamResult {
    exam_id: string;
    exam_name: string;
    total_marks: number;
    obtained_marks: number;
    percentage: number;
    grade: string;
    rank: number;
    subjects: Array<{
        subject_name: string;
        max_marks: number;
        obtained_marks: number;
        grade: string;
    }>;
}

export interface AnnualReportData {
    student_name: string;
    roll_number: string;
    class_name: string;
    section_name: string;
    academic_year: string;
    exam_results: ExamResult[];
}

/**
 * Generate Annual Progress Report PDF
 */
export const generateAnnualProgressReportPdf = async (
    data: AnnualReportData,
    schoolData: SchoolData,
    action: PdfAction = 'print'
): Promise<void> => {
    await loadPdfFonts();

    const {
        student_name,
        roll_number,
        class_name,
        section_name,
        academic_year,
        exam_results,
    } = data;

    // Check if this is a single exam view or multiple exams
    const isSingleExam = exam_results.length === 1;

    // ─── Student Info Section ───
    const studentInfoTable: any = {
        table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
                [
                    { text: 'Student Name:', bold: true, fontSize: 9 },
                    { text: student_name, fontSize: 9 },
                    { text: 'Roll Number:', bold: true, fontSize: 9 },
                    { text: roll_number, fontSize: 9 }
                ],
                [
                    { text: 'Class:', bold: true, fontSize: 9 },
                    { text: `${class_name} - ${section_name}`, fontSize: 9 },
                    { text: 'Academic Year:', bold: true, fontSize: 9 },
                    { text: academic_year, fontSize: 9 }
                ]
            ]
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e0e0e0',
            vLineColor: () => '#e0e0e0',
        },
        margin: [0, 0, 0, 20]
    };

    // ─── Build Exam Results Table (Single or Multiple) ───
    let examTable: any;

    if (isSingleExam) {
        // ─── Single Exam Detailed View ───
        const exam = exam_results[0];

        const singleExamTableBody: any[][] = [
            [
                { text: 'Subject', fontSize: 10, bold: true, fillColor: '#667eea', color: '#ffffff' },
                { text: 'Max Marks', fontSize: 10, bold: true, alignment: 'center', fillColor: '#667eea', color: '#ffffff' },
                { text: 'Obtained Marks', fontSize: 10, bold: true, alignment: 'center', fillColor: '#667eea', color: '#ffffff' },
                { text: 'Percentage', fontSize: 10, bold: true, alignment: 'center', fillColor: '#667eea', color: '#ffffff' },
                { text: 'Grade', fontSize: 10, bold: true, alignment: 'center', fillColor: '#667eea', color: '#ffffff' }
            ],
            ...exam.subjects.map(subject => {
                const percentage = (subject.obtained_marks / subject.max_marks) * 100;
                return [
                    { text: subject.subject_name, fontSize: 9 },
                    { text: subject.max_marks, fontSize: 9, alignment: 'center' },
                    { text: subject.obtained_marks, fontSize: 9, alignment: 'center', bold: true },
                    { text: percentage.toFixed(2) + '%', fontSize: 9, alignment: 'center' },
                    { text: subject.grade, fontSize: 9, alignment: 'center', bold: true }
                ];
            }),
            // Total row
            [
                { text: 'Total', fontSize: 10, bold: true, fillColor: '#f8f9ff' },
                { text: exam.total_marks, fontSize: 10, bold: true, alignment: 'center', fillColor: '#f8f9ff' },
                { text: exam.obtained_marks, fontSize: 10, bold: true, alignment: 'center', fillColor: '#f8f9ff' },
                { text: exam.percentage.toFixed(2) + '%', fontSize: 10, bold: true, alignment: 'center', fillColor: '#f8f9ff' },
                { text: exam.grade, fontSize: 10, bold: true, alignment: 'center', fillColor: '#f8f9ff' }
            ],
            // Rank row
            [
                { text: 'Class Rank', fontSize: 9, bold: true, fillColor: '#fffbeb' },
                { text: `${exam.rank}`, fontSize: 9, bold: true, alignment: 'center', fillColor: '#fffbeb', colSpan: 4 },
                {}, {}, {}
            ]
        ];

        examTable = {
            table: {
                headerRows: 1,
                widths: ['*', 80, 100, 80, 60],
                body: singleExamTableBody
            },
            layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#e0e0e0',
                vLineColor: () => '#e0e0e0',
            },
            margin: [0, 0, 0, 20]
        };
    } else {
        // ─── Multiple Exams Comparison View ───
    // Collect all unique subjects across all exams
    const allSubjects = new Set<string>();
    exam_results.forEach(exam => {
        exam.subjects.forEach(subject => {
            allSubjects.add(subject.subject_name);
        });
    });
    const subjectNames = Array.from(allSubjects);

    // Build header row with exam columns
    const headerRow: any[] = [
        { text: 'Subject', fontSize: 7, bold: true, fillColor: '#667eea', color: '#ffffff', rowSpan: 2, alignment: 'center' }
    ];

    // Add exam name headers (each spans 4 sub-columns)
    exam_results.forEach(exam => {
        headerRow.push({
            text: exam.exam_name,
            fontSize: 7,
            bold: true,
            fillColor: '#667eea',
            color: '#ffffff',
            colSpan: 4,
            alignment: 'center'
        });
        headerRow.push({}, {}, {}); // Empty cells for colSpan
    });

    // Build sub-header row with column labels (abbreviated)
    const subHeaderRow: any[] = [{}]; // Empty for subject column (rowSpan from above)

    exam_results.forEach(() => {
        subHeaderRow.push(
            { text: 'Max', fontSize: 6, bold: true, fillColor: '#8b9fe8', color: '#ffffff', alignment: 'center' },
            { text: 'Obt', fontSize: 6, bold: true, fillColor: '#8b9fe8', color: '#ffffff', alignment: 'center' },
            { text: '%', fontSize: 6, bold: true, fillColor: '#8b9fe8', color: '#ffffff', alignment: 'center' },
            { text: 'Grd', fontSize: 6, bold: true, fillColor: '#8b9fe8', color: '#ffffff', alignment: 'center' }
        );
    });

    // Build data rows for each subject
    const dataRows: any[][] = [];
    subjectNames.forEach(subjectName => {
        const row: any[] = [
            { text: subjectName, fontSize: 7, bold: true }
        ];

        exam_results.forEach(exam => {
            const subject = exam.subjects.find(s => s.subject_name === subjectName);
            if (subject) {
                const percentage = (subject.obtained_marks / subject.max_marks) * 100;
                row.push(
                    { text: subject.max_marks, fontSize: 6, alignment: 'center' },
                    { text: subject.obtained_marks, fontSize: 6, alignment: 'center', bold: true },
                    { text: percentage.toFixed(1), fontSize: 6, alignment: 'center' },
                    { text: subject.grade, fontSize: 6, alignment: 'center', bold: true }
                );
            } else {
                // Subject not present in this exam
                row.push(
                    { text: '-', fontSize: 6, alignment: 'center', color: '#999999' },
                    { text: '-', fontSize: 6, alignment: 'center', color: '#999999' },
                    { text: '-', fontSize: 6, alignment: 'center', color: '#999999' },
                    { text: '-', fontSize: 6, alignment: 'center', color: '#999999' }
                );
            }
        });

        dataRows.push(row);
    });

    // Build total row
    const totalRow: any[] = [
        { text: 'Total', fontSize: 7, bold: true, fillColor: '#f8f9ff' }
    ];

    exam_results.forEach(exam => {
        totalRow.push(
            { text: exam.total_marks, fontSize: 7, bold: true, alignment: 'center', fillColor: '#f8f9ff' },
            { text: exam.obtained_marks, fontSize: 7, bold: true, alignment: 'center', fillColor: '#f8f9ff' },
            { text: exam.percentage.toFixed(1), fontSize: 7, bold: true, alignment: 'center', fillColor: '#f8f9ff' },
            { text: exam.grade, fontSize: 7, bold: true, alignment: 'center', fillColor: '#f8f9ff' }
        );
    });

    // Build rank row
    const rankRow: any[] = [
        { text: 'Rank', fontSize: 7, bold: true, fillColor: '#f8f9ff' }
    ];

    exam_results.forEach(exam => {
        rankRow.push(
            { text: exam.rank, fontSize: 7, bold: true, alignment: 'center', fillColor: '#fffbeb', colSpan: 4 },
            {}, {}, {}
        );
    });

    // Use dynamic widths - let pdfmake calculate optimal widths
    const numExams = exam_results.length;
    const totalExamSubColumns = numExams * 4; // Each exam has 4 sub-columns

    // Subject column gets more weight, exam sub-columns share remaining space equally
    const columnWidths = [
        'auto', // Subject column - auto-size based on content
        ...Array(totalExamSubColumns).fill('*') // Exam sub-columns - divide remaining space equally
    ];

        examTable = {
            table: {
                headerRows: 2,
                widths: columnWidths,
                body: [
                    headerRow,
                    subHeaderRow,
                    ...dataRows,
                    totalRow,
                    rankRow
                ],
                dontBreakRows: true
            },
            layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#e0e0e0',
                vLineColor: () => '#e0e0e0',
                paddingLeft: () => 3,
                paddingRight: () => 3,
                paddingTop: () => 3,
                paddingBottom: () => 3
            },
            margin: [0, 0, 0, 8]
        };
    } // End of else block for multiple exams

    // ─── Performance Summary ───
    const totalExams = exam_results.length;
    const averagePercentage = exam_results.reduce((sum, exam) => sum + exam.percentage, 0) / (totalExams || 1);
    const highestPercentage = Math.max(...exam_results.map(e => e.percentage));
    const lowestPercentage = Math.min(...exam_results.map(e => e.percentage));

    const performanceSummary: any = {
        table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
                [
                    { text: 'Performance Summary', colSpan: 4, bold: true, fontSize: 10, color: '#667eea', fillColor: '#f8f9ff' },
                    {},
                    {},
                    {}
                ],
                [
                    { text: 'Total Exams:', bold: true, fontSize: 9 },
                    { text: totalExams, fontSize: 9 },
                    { text: 'Average %:', bold: true, fontSize: 9 },
                    { text: averagePercentage.toFixed(2) + '%', fontSize: 9, bold: true, color: '#667eea' }
                ],
                [
                    { text: 'Highest %:', bold: true, fontSize: 9 },
                    { text: highestPercentage.toFixed(2) + '%', fontSize: 9, color: '#27ae60' },
                    { text: 'Lowest %:', bold: true, fontSize: 9 },
                    { text: lowestPercentage.toFixed(2) + '%', fontSize: 9, color: '#e74c3c' }
                ]
            ]
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e0e0e0',
            vLineColor: () => '#e0e0e0',
        },
        margin: [0, 20, 0, 30]
    };

    // ─── Content ───
    const tableTitle = isSingleExam
        ? `${exam_results[0].exam_name} - Performance Report`
        : 'Consolidated Exam Performance';

    const content: any[] = [
        studentInfoTable,
        { text: tableTitle, fontSize: 11, bold: true, color: '#667eea', margin: [0, 0, 0, 10] },
        examTable,
        performanceSummary,
        getSignatureSection([
            { label: 'Class Teacher', position: 'left' },
            { label: 'Principal', position: 'right' }
        ])
    ];

    // ─── Document Definition ───
    const orientation = isSingleExam ? 'portrait' : 'landscape';
    const reportTitle = isSingleExam ? `${exam_results[0].exam_name} - Progress Report` : 'Annual Progress Report';

    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: orientation,
        pageMargins: [40, 140, 40, 60],
        header: () => {
            return getReportHeader(
                schoolData,
                reportTitle,
                `${student_name} - ${class_name} ${section_name}`,
                orientation
            );
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
        const filename = `Annual_Progress_${student_name.replace(/\s+/g, '_')}_${academic_year}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
