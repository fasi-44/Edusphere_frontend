/**
 * Student ID Card PDF Generator
 * Generates Student ID Card (front and back)
 * Custom size for ID card printing
 */

import pdfMake from 'pdfmake/build/pdfmake';
import {
    loadPdfFonts,
    formatDate,
} from './HeaderAndFooterComponent';
import type { SchoolData, PdfAction } from './printTypes';

export interface StudentIDCardData {
    // Student Information
    student_name: string;
    roll_number: string;
    class_name: string;
    section_name: string;
    date_of_birth: string;
    blood_group?: string;
    student_photo?: string;

    // Card Details
    issue_date: string;
    valid_until: string;
    emergency_contact?: string;

    // Academic Information
    academic_year: string;
}

/**
 * Generate Student ID Card PDF
 */
export const generateStudentIDCardPdf = async (
    data: StudentIDCardData,
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
        blood_group,
        student_photo,
        issue_date,
        valid_until,
        emergency_contact,
        academic_year,
    } = data;

    // ID Card dimensions (standard CR80 size: 85.6mm x 53.98mm converted to points)
    // Using A4 landscape and centering the cards
    const cardWidth = 242.65; // 85.6mm in points
    const cardHeight = 153; // 53.98mm in points

    // ─── ID Card Front ───
    const idCardFront: any = {
        table: {
            widths: [cardWidth],
            heights: [cardHeight],
            body: [[
                {
                    stack: [
                        // School Info Header
                        {
                            table: {
                                widths: ['*'],
                                body: [[
                                    {
                                        stack: [
                                            {
                                                text: schoolData.schoolName || 'School Name',
                                                fontSize: 11,
                                                bold: true,
                                                alignment: 'center',
                                                color: '#ffffff'
                                            },
                                            {
                                                text: 'STUDENT IDENTITY CARD',
                                                fontSize: 8,
                                                alignment: 'center',
                                                color: '#ffffff',
                                                margin: [0, 2, 0, 0]
                                            }
                                        ],
                                        fillColor: '#667eea',
                                        margin: 5
                                    }
                                ]]
                            },
                            layout: 'noBorders',
                            margin: [0, 0, 0, 5]
                        },
                        // Student Details
                        {
                            columns: [
                                {
                                    width: 60,
                                    stack: [
                                        {
                                            image: student_photo || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                                            width: 50,
                                            height: 60,
                                            alignment: 'center'
                                        }
                                    ]
                                },
                                {
                                    width: '*',
                                    stack: [
                                        {
                                            text: student_name,
                                            fontSize: 10,
                                            bold: true,
                                            margin: [0, 0, 0, 3]
                                        },
                                        {
                                            text: `Class: ${class_name} - ${section_name}`,
                                            fontSize: 8,
                                            margin: [0, 0, 0, 2]
                                        },
                                        {
                                            text: `Roll No: ${roll_number}`,
                                            fontSize: 8,
                                            margin: [0, 0, 0, 2]
                                        },
                                        {
                                            text: `DOB: ${formatDate(date_of_birth)}`,
                                            fontSize: 7,
                                            margin: [0, 0, 0, 2]
                                        },
                                        ...(blood_group ? [{
                                            text: `Blood Group: ${blood_group}`,
                                            fontSize: 7,
                                            color: '#e74c3c',
                                            bold: true
                                        }] : [])
                                    ]
                                }
                            ],
                            margin: [5, 0, 5, 5]
                        },
                        // Footer
                        {
                            table: {
                                widths: ['*'],
                                body: [[
                                    {
                                        stack: [
                                            {
                                                text: `Valid Until: ${formatDate(valid_until)}`,
                                                fontSize: 6,
                                                alignment: 'center',
                                                color: '#666666'
                                            }
                                        ],
                                        margin: 2
                                    }
                                ]]
                            },
                            layout: 'noBorders'
                        }
                    ],
                    margin: 0
                }
            ]]
        },
        layout: {
            hLineWidth: () => 2,
            vLineWidth: () => 2,
            hLineColor: () => '#667eea',
            vLineColor: () => '#667eea',
        }
    };

    // ─── ID Card Back ───
    const idCardBack: any = {
        table: {
            widths: [cardWidth],
            heights: [cardHeight],
            body: [[
                {
                    stack: [
                        {
                            text: 'IMPORTANT INSTRUCTIONS',
                            fontSize: 9,
                            bold: true,
                            alignment: 'center',
                            color: '#667eea',
                            margin: [0, 10, 0, 10]
                        },
                        {
                            ul: [
                                { text: 'This card is property of the school', fontSize: 7 },
                                { text: 'Carry this card at all times', fontSize: 7 },
                                { text: 'Report loss immediately', fontSize: 7 },
                                { text: 'Not transferable', fontSize: 7 }
                            ],
                            margin: [10, 0, 10, 10]
                        },
                        ...(emergency_contact ? [{
                            stack: [
                                {
                                    text: 'Emergency Contact:',
                                    fontSize: 7,
                                    bold: true,
                                    margin: [10, 5, 0, 2]
                                },
                                {
                                    text: emergency_contact,
                                    fontSize: 8,
                                    bold: true,
                                    color: '#e74c3c',
                                    margin: [10, 0, 0, 10]
                                }
                            ]
                        }] : []),
                        {
                            text: [
                                { text: 'Issued: ', fontSize: 6 },
                                { text: formatDate(issue_date), fontSize: 6, bold: true }
                            ],
                            alignment: 'center',
                            margin: [0, 10, 0, 5]
                        },
                        {
                            canvas: [
                                {
                                    type: 'line',
                                    x1: 50,
                                    y1: 0,
                                    x2: cardWidth - 50,
                                    y2: 0,
                                    lineWidth: 0.5
                                }
                            ],
                            margin: [0, 5, 0, 5]
                        },
                        {
                            text: 'Authorized Signature',
                            fontSize: 6,
                            alignment: 'center',
                            color: '#666666'
                        }
                    ],
                    margin: 0
                }
            ]]
        },
        layout: {
            hLineWidth: () => 2,
            vLineWidth: () => 2,
            hLineColor: () => '#667eea',
            vLineColor: () => '#667eea',
        }
    };

    // ─── Content (Front and Back side by side) ───
    const content: any[] = [
        {
            text: 'Student ID Card',
            fontSize: 14,
            bold: true,
            alignment: 'center',
            color: '#667eea',
            margin: [0, 20, 0, 20]
        },
        {
            columns: [
                {
                    width: '*',
                    stack: [
                        {
                            text: 'FRONT',
                            fontSize: 10,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 10]
                        },
                        idCardFront
                    ]
                },
                {
                    width: 30,
                    text: ''
                },
                {
                    width: '*',
                    stack: [
                        {
                            text: 'BACK',
                            fontSize: 10,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 10]
                        },
                        idCardBack
                    ]
                }
            ]
        },
        {
            text: 'Cut along the border and laminate for durability',
            fontSize: 8,
            alignment: 'center',
            color: '#666666',
            italics: true,
            margin: [0, 20, 0, 0]
        }
    ];

    // ─── Document Definition ───
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [40, 40, 40, 40],
        content,
        defaultStyle: {
            fontSize: 8,
            color: '#333333',
        },
    };

    // ─── Output ───
    if (action === 'print') {
        pdfMake.createPdf(docDefinition).print();
    } else if (action === 'download') {
        const filename = `Student_ID_Card_${student_name.replace(/\s+/g, '_')}_${roll_number}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
