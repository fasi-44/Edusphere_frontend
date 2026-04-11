/**
 * Bonafide Certificate PDF Generator
 * Generates official Bonafide Certificate for students
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

export interface BonafideCertificateData {
    // Student Information
    student_name: string;
    roll_number: string;
    class_name: string;
    section_name: string;
    date_of_birth: string;
    father_name: string;
    mother_name: string;

    // Certificate Details
    issue_date: string;
    purpose: string;
    remarks?: string;

    // Academic Information
    academic_year: string;
}

/**
 * Generate Bonafide Certificate PDF
 */
export const generateBonafideCertificatePdf = async (
    data: BonafideCertificateData,
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
        issue_date,
        purpose,
        remarks,
        academic_year,
    } = data;

    // ─── Certificate Title ───
    const certificateTitle: any = {
        text: 'BONAFIDE CERTIFICATE',
        fontSize: 16,
        bold: true,
        alignment: 'center',
        color: '#667eea',
        margin: [0, 0, 0, 30]
    };

    // ─── Certificate Body ───
    const certificateBody: any = {
        stack: [
            {
                text: 'TO WHOM IT MAY CONCERN',
                fontSize: 11,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 20]
            },
            {
                text: [
                    'This is to certify that ',
                    { text: student_name, bold: true },
                    ', son/daughter of ',
                    { text: father_name, bold: true },
                    ' and ',
                    { text: mother_name, bold: true },
                    ', born on ',
                    { text: formatDate(date_of_birth), bold: true },
                    ', is a bonafide student of this institution, studying in ',
                    { text: `${class_name} - ${section_name}`, bold: true },
                    ' for the academic year ',
                    { text: academic_year, bold: true },
                    '.'
                ],
                fontSize: 11,
                lineHeight: 1.5,
                alignment: 'justify',
                margin: [0, 0, 0, 20]
            },
            {
                text: [
                    'Roll Number: ',
                    { text: roll_number, bold: true }
                ],
                fontSize: 11,
                margin: [0, 0, 0, 20]
            },
            ...(purpose ? [{
                text: [
                    'This certificate is issued for the purpose of ',
                    { text: purpose.toLowerCase(), bold: true, italics: true },
                    '.'
                ],
                fontSize: 11,
                lineHeight: 1.5,
                alignment: 'justify',
                margin: [0, 0, 0, 20]
            }] : []),
            ...(remarks ? [{
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
            }] : []),
            {
                columns: [
                    {
                        text: `Date: ${formatDate(issue_date)}`,
                        fontSize: 10,
                        bold: true,
                    },
                    {
                        text: '',
                        width: '*'
                    }
                ],
                margin: [0, 10, 0, 40]
            }
        ]
    };

    // ─── Content ───
    const content: any[] = [
        certificateTitle,
        certificateBody,
        getSignatureSection([
            { label: 'Class Teacher', position: 'left' },
            { label: 'Principal (with School Seal)', position: 'right' }
        ])
    ];

    // ─── Document Definition ───
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [60, 140, 60, 60],
        header: () => {
            return getReportHeader(
                schoolData,
                'Bonafide Certificate',
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
        const filename = `Bonafide_Certificate_${student_name.replace(/\s+/g, '_')}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
