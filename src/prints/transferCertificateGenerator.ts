/**
 * Transfer Certificate PDF Generator
 * Generates official Transfer Certificate for students
 * Portrait A4 format
 */

import pdfMake from 'pdfmake/build/pdfmake';
import {
    getReportHeader,
    getReportFooter,
    getSignatureSection,
    commonPdfStyles,
    loadPdfFonts,
    formatDate,
} from './HeaderAndFooterComponent';
import type { SchoolData, PdfAction } from './printTypes';

export interface TransferCertificateData {
    // Student Information
    student_name: string;
    roll_number: string;
    class_name: string;
    section_name: string;
    date_of_birth: string;
    father_name: string;
    mother_name: string;
    admission_date?: string;

    // Certificate Details
    tc_number: string;
    issue_date: string;
    reason: string;
    remarks?: string;

    // Academic Information
    academic_year: string;
    last_attended_date?: string;
    total_working_days?: number;
    days_present?: number;
}

/**
 * Generate Transfer Certificate PDF
 */
export const generateTransferCertificatePdf = async (
    data: TransferCertificateData,
    schoolData: SchoolData,
    action: PdfAction = 'print'
): Promise<void> => {
    await loadPdfFonts();

    const {
        student_name,
        roll_number,
        class_name,
        section_name,
        date_of_birth,
        father_name,
        mother_name,
        admission_date,
        tc_number,
        issue_date,
        reason,
        remarks,
        academic_year,
        last_attended_date,
        total_working_days,
        days_present,
    } = data;

    // ─── Certificate Title ───
    const certificateTitle: any = {
        text: 'TRANSFER CERTIFICATE',
        fontSize: 16,
        bold: true,
        alignment: 'center',
        color: '#667eea',
        margin: [0, 0, 0, 20]
    };

    // ─── TC Number and Date ───
    const tcInfo: any = {
        columns: [
            {
                text: `TC No: ${tc_number}`,
                fontSize: 10,
                bold: true,
            },
            {
                text: `Date: ${formatDate(issue_date)}`,
                fontSize: 10,
                bold: true,
                alignment: 'right'
            }
        ],
        margin: [0, 0, 0, 20]
    };

    // ─── Student Details Table ───
    const studentDetailsTable: any = {
        table: {
            widths: [150, '*'],
            body: [
                [
                    { text: 'Name of the Student:', bold: true, fontSize: 10 },
                    { text: student_name, fontSize: 10 }
                ],
                [
                    { text: 'Father\'s Name:', bold: true, fontSize: 10 },
                    { text: father_name, fontSize: 10 }
                ],
                [
                    { text: 'Mother\'s Name:', bold: true, fontSize: 10 },
                    { text: mother_name, fontSize: 10 }
                ],
                [
                    { text: 'Date of Birth:', bold: true, fontSize: 10 },
                    { text: date_of_birth ? formatDate(date_of_birth) : 'N/A', fontSize: 10 }
                ],
                [
                    { text: 'Roll Number:', bold: true, fontSize: 10 },
                    { text: roll_number, fontSize: 10 }
                ],
                [
                    { text: 'Class/Grade:', bold: true, fontSize: 10 },
                    { text: `${class_name} - ${section_name}`, fontSize: 10 }
                ],
                [
                    { text: 'Academic Year:', bold: true, fontSize: 10 },
                    { text: academic_year, fontSize: 10 }
                ],
                ...(admission_date ? [[
                    { text: 'Date of Admission:', bold: true, fontSize: 10 },
                    { text: formatDate(admission_date), fontSize: 10 }
                ]] : []),
                ...(last_attended_date ? [[
                    { text: 'Last Attended Date:', bold: true, fontSize: 10 },
                    { text: formatDate(last_attended_date), fontSize: 10 }
                ]] : []),
                ...(total_working_days && days_present ? [[
                    { text: 'Attendance:', bold: true, fontSize: 10 },
                    { text: `${days_present} days out of ${total_working_days} days`, fontSize: 10 }
                ]] : []),
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

    // ─── Reason for Leaving ───
    const reasonSection: any = {
        stack: [
            {
                text: 'Reason for Leaving:',
                fontSize: 10,
                bold: true,
                margin: [0, 0, 0, 5]
            },
            {
                text: reason || 'N/A',
                fontSize: 10,
                margin: [0, 0, 0, 20]
            }
        ]
    };

    // ─── Remarks ───
    const remarksSection: any = remarks ? {
        stack: [
            {
                text: 'Remarks:',
                fontSize: 10,
                bold: true,
                margin: [0, 0, 0, 5]
            },
            {
                text: remarks,
                fontSize: 10,
                margin: [0, 0, 0, 20]
            }
        ]
    } : null;

    // ─── Character Certificate ───
    const characterCertificate: any = {
        stack: [
            {
                text: 'Character & Conduct:',
                fontSize: 10,
                bold: true,
                margin: [0, 0, 0, 5]
            },
            {
                text: 'The student has shown good character and conduct during their stay in this institution.',
                fontSize: 10,
                margin: [0, 0, 0, 30]
            }
        ]
    };

    // ─── Content ───
    const content: any[] = [
        certificateTitle,
        tcInfo,
        studentDetailsTable,
        reasonSection,
        ...(remarksSection ? [remarksSection] : []),
        characterCertificate,
        getSignatureSection([
            { label: 'Class Teacher', position: 'left' },
            { label: 'Principal', position: 'right' }
        ])
    ];

    // ─── Document Definition ───
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 140, 40, 60],
        header: () => {
            return getReportHeader(
                schoolData,
                'Transfer Certificate',
                `Academic Year: ${academic_year}`,
                'portrait'
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
        const filename = `Transfer_Certificate_${student_name.replace(/\s+/g, '_')}_${tc_number}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
