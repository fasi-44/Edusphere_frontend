/**
 * Fee Receipt PDF Generator
 * Generates payment receipts for individual installment payments and full fee payments.
 * Portrait A4 format - based on previous design.
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

export interface FeeReceiptData {
    receiptNumber: string;
    receiptDate: string;
    studentName: string;
    rollNumber: string;
    className: string;
    sectionName: string;
    feeName: string;
    installmentName?: string;
    amountPaid: number;
    paymentMode: string;
    transactionId?: string;
    chequeNumber?: string;
    bankName?: string;
    remarks?: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
}

export interface FeeFullSummaryData {
    receiptNumber: string;
    receiptDate: string;
    studentName: string;
    rollNumber: string;
    className: string;
    sectionName: string;
    feeName: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    installmentPayments: Array<{
        installmentName: string;
        amount: number;
        paidAmount: number;
        paymentDate: string;
        paymentMode: string;
        transactionId?: string;
    }>;
}

/**
 * Generate Individual Payment Receipt PDF
 */
export const generateFeeReceiptPdf = async (
    data: FeeReceiptData,
    schoolData: SchoolData,
    action: PdfAction = 'download'
): Promise<void> => {
    await loadPdfFonts();

    const {
        receiptNumber,
        receiptDate,
        studentName,
        rollNumber,
        className,
        sectionName,
        feeName,
        installmentName,
        amountPaid,
        paymentMode,
        transactionId,
        chequeNumber,
        bankName,
        remarks,
        totalAmount,
        paidAmount,
        balanceAmount,
    } = data;

    const isInstallment = !!installmentName;
    const isPartialPayment = balanceAmount > 0 && !isInstallment;

    let receiptTitle = '';
    if (isInstallment) {
        receiptTitle = 'Fee Payment Receipt (Installment)';
    } else if (isPartialPayment) {
        receiptTitle = 'Fee Payment Receipt (Partial Payment)';
    } else {
        receiptTitle = 'Fee Payment Receipt (Full Payment)';
    }

    // ─── Receipt Info Section (Table Format) ───
    const receiptInfoSection: any = {
        table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
                // Header row
                [
                    { text: 'Student Information', colSpan: 2, bold: true, fontSize: 10, color: '#667eea', border: [true, true, false, true] },
                    {},
                    { text: 'Receipt Details', colSpan: 2, bold: true, fontSize: 10, color: '#667eea', border: [false, true, true, true] },
                    {}
                ],
                // Row 1
                [
                    { text: 'Name:', bold: true, fontSize: 9, border: [true, true, false, true] },
                    { text: studentName, fontSize: 9, border: [false, true, false, true] },
                    { text: 'Receipt No.:', bold: true, fontSize: 9, border: [false, true, false, true] },
                    { text: receiptNumber, fontSize: 9, border: [false, true, true, true] }
                ],
                // Row 2
                [
                    { text: 'Roll No.:', bold: true, fontSize: 9, border: [true, true, false, true] },
                    { text: rollNumber, fontSize: 9, border: [false, true, false, true] },
                    { text: 'Date:', bold: true, fontSize: 9, border: [false, true, false, true] },
                    { text: formatDate(receiptDate), fontSize: 9, border: [false, true, true, true] }
                ],
                // Row 3
                [
                    { text: 'Class:', bold: true, fontSize: 9, border: [true, true, false, true] },
                    { text: `${className} - ${sectionName}`, fontSize: 9, border: [false, true, false, true] },
                    { text: 'Payment Mode:', bold: true, fontSize: 9, border: [false, true, false, true] },
                    { text: paymentMode, fontSize: 9, border: [false, true, true, true] }
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

    // ─── Fee Payment Details Table ───
    const paymentDetailsTable: any = {
        style: 'section',
        table: {
            headerRows: 1,
            widths: ['*', 120, 140],
            body: [
                [
                    { text: 'Description', fontSize: 10, bold: true, alignment: 'center', color: '#ffffff', fillColor: '#667eea' },
                    { text: 'Amount (₹)', fontSize: 10, bold: true, alignment: 'right', color: '#ffffff', fillColor: '#667eea' },
                    { text: 'Remarks', fontSize: 10, bold: true, alignment: 'center', color: '#ffffff', fillColor: '#667eea' }
                ],
                [
                    {
                        stack: [
                            { text: feeName, bold: true, fontSize: 10 },
                            {
                                text: isInstallment
                                    ? `Installment: ${installmentName}`
                                    : 'Full Payment',
                                fontSize: 9,
                                color: '#666666',
                                margin: [0, 2, 0, 0]
                            }
                        ]
                    },
                    { text: amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }), alignment: 'right', fontSize: 10 },
                    { text: remarks || '-', fontSize: 9 }
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

    // ─── Transaction Information (Table Format) ───
    const transactionTableBody: any[][] = [
        // Header row
        [
            { text: 'Transaction Information', colSpan: 4, bold: true, fontSize: 10, color: '#667eea', border: [true, true, true, true] },
            {},
            {},
            {}
        ],
        // Row 1: Payment Mode | Collected By
        [
            { text: 'Payment Mode:', bold: true, fontSize: 9, border: [true, true, false, true] },
            { text: paymentMode, fontSize: 9, border: [false, true, false, true] },
            { text: 'Collected By:', bold: true, fontSize: 9, border: [false, true, false, true] },
            { text: schoolData.generatedBy || 'N/A', fontSize: 9, border: [false, true, true, true] }
        ]
    ];

    // Add Transaction ID row for ONLINE/UPI/CARD payments
    if (['ONLINE', 'UPI', 'CARD'].includes(paymentMode) && transactionId) {
        transactionTableBody.push([
            { text: 'Transaction ID:', bold: true, fontSize: 9, border: [true, true, false, true] },
            { text: transactionId, fontSize: 9, color: '#667eea', border: [false, true, false, true] },
            { text: 'Payment Date:', bold: true, fontSize: 9, border: [false, true, false, true] },
            { text: formatDate(receiptDate), fontSize: 9, border: [false, true, true, true] }
        ]);
    } else if (paymentMode === 'CHEQUE') {
        // Add Cheque details rows
        if (chequeNumber) {
            transactionTableBody.push([
                { text: 'Cheque No.:', bold: true, fontSize: 9, border: [true, true, false, true] },
                { text: chequeNumber, fontSize: 9, border: [false, true, false, true] },
                { text: 'Payment Date:', bold: true, fontSize: 9, border: [false, true, false, true] },
                { text: formatDate(receiptDate), fontSize: 9, border: [false, true, true, true] }
            ]);
        }
        if (bankName) {
            transactionTableBody.push([
                { text: 'Bank Name:', bold: true, fontSize: 9, border: [true, true, false, true] },
                { text: bankName, fontSize: 9, colSpan: 3, border: [false, true, true, true] },
                {},
                {}
            ]);
        }
    } else {
        // For CASH or other payment modes, just add Payment Date
        transactionTableBody.push([
            { text: 'Payment Date:', bold: true, fontSize: 9, border: [true, true, false, true] },
            { text: formatDate(receiptDate), fontSize: 9, colSpan: 3, border: [false, true, true, true] },
            {},
            {}
        ]);
    }

    const transactionSection: any = {
        table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: transactionTableBody
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e0e0e0',
            vLineColor: () => '#e0e0e0',
        },
        margin: [0, 0, 0, 20]
    };

    // ─── Amount Summary Box ───
    const amountBox: any = {
        table: {
            widths: ['*'],
            body: [
                [{
                    stack: [
                        {
                            columns: [
                                { text: 'Amount Paid:', bold: true, width: '*', fontSize: 11 },
                                { text: `₹ ${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bold: true, fontSize: 14, color: '#667eea' }
                            ],
                            margin: [10, 10, 10, 10]
                        }
                    ],
                    fillColor: '#f8f9ff',
                }]
            ]
        },
        layout: {
            hLineWidth: () => 2,
            vLineWidth: () => 2,
            hLineColor: () => '#667eea',
            vLineColor: () => '#667eea',
        },
        margin: [0, 0, 0, 20]
    };

    // ─── Fee Summary ───
    const feeSummarySection: any = {
        stack: [
            { text: 'Fee Summary', fontSize: 11, bold: true, color: '#667eea', margin: [0, 0, 0, 8] },
            {
                columns: [
                    {
                        width: 'auto',
                        stack: [
                            {
                                columns: [
                                    { text: 'Total Fee Amount:', bold: true, width: 150, fontSize: 9 },
                                    { text: `₹ ${totalAmount.toLocaleString('en-IN')}`, fontSize: 9 }
                                ],
                                margin: [0, 5, 0, 5]
                            },
                            {
                                columns: [
                                    { text: 'Total Paid:', bold: true, width: 150, fontSize: 9 },
                                    { text: `₹ ${paidAmount.toLocaleString('en-IN')}`, fontSize: 9, color: '#27ae60' }
                                ],
                                margin: [0, 5, 0, 5]
                            },
                            {
                                columns: [
                                    { text: 'Remaining Balance:', bold: true, width: 150, fontSize: 9 },
                                    { text: `₹ ${balanceAmount.toLocaleString('en-IN')}`, fontSize: 9, color: balanceAmount > 0 ? '#e74c3c' : '#27ae60' }
                                ],
                                margin: [0, 5, 0, 0]
                            }
                        ]
                    }
                ]
            }
        ],
        margin: [0, 0, 0, 20]
    };

    // ─── Terms & Conditions ───
    const termsSection: any = {
        stack: [
            { text: 'Terms & Conditions', fontSize: 10, bold: true, color: '#667eea' },
            {
                ul: [
                    'This is a digital receipt generated by the school management system.',
                    'Please keep this receipt for your records.',
                    'In case of any discrepancy, please contact the school office.',
                    'Refund policy as per school norms.',
                    'This receipt is valid only when duly signed.'
                ],
                fontSize: 8,
                color: '#666666',
                margin: [0, 5, 0, 0]
            }
        ],
        margin: [0, 0, 0, 30]
    };

    // ─── Content ───
    const content: any[] = [
        receiptInfoSection,
        transactionSection,
        { text: 'Fee Payment Details', fontSize: 11, bold: true, color: '#667eea', margin: [0, 0, 0, 8] },
        paymentDetailsTable,
        amountBox,
        feeSummarySection,
        termsSection,
        getSignatureSection([
            { label: 'Accountant Signature', position: 'left' },
            { label: 'Principal Signature', position: 'right' }
        ])
    ];

    // ─── Document Definition ───
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 140, 40, 60],
        header: () => {
            return getReportHeader(schoolData, receiptTitle, feeName, 'portrait');
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
        const filename = `Fee_Receipt_${receiptNumber.replace(/\s+/g, '_')}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};

/**
 * Generate Full Summary Receipt PDF (for all installments)
 */
export const generateFeeSummaryReceiptPdf = async (
    data: FeeFullSummaryData,
    schoolData: SchoolData,
    action: PdfAction = 'download'
): Promise<void> => {
    await loadPdfFonts();

    const {
        receiptNumber,
        receiptDate,
        studentName,
        rollNumber,
        className,
        sectionName,
        feeName,
        totalAmount,
        balanceAmount,
        installmentPayments,
    } = data;

    const totalPaid = installmentPayments.reduce((sum, inst) => sum + inst.paidAmount, 0);

    // ─── Student Info Section (Table Format) ───
    const studentInfoSection: any = {
        table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
                // Header row
                [
                    { text: 'Student Information', colSpan: 2, bold: true, fontSize: 10, color: '#667eea', border: [true, true, false, true] },
                    {},
                    { text: 'Fee Details', colSpan: 2, bold: true, fontSize: 10, color: '#667eea', border: [false, true, true, true] },
                    {}
                ],
                // Row 1
                [
                    { text: 'Name:', bold: true, fontSize: 9, border: [true, true, false, true] },
                    { text: studentName, fontSize: 9, border: [false, true, false, true] },
                    { text: 'Fee Name:', bold: true, fontSize: 9, border: [false, true, false, true] },
                    { text: feeName, fontSize: 9, border: [false, true, true, true] }
                ],
                // Row 2
                [
                    { text: 'Roll No.:', bold: true, fontSize: 9, border: [true, true, false, true] },
                    { text: rollNumber, fontSize: 9, border: [false, true, false, true] },
                    { text: 'Total Amount:', bold: true, fontSize: 9, border: [false, true, false, true] },
                    { text: `₹ ${totalAmount.toLocaleString('en-IN')}`, fontSize: 9, border: [false, true, true, true] }
                ],
                // Row 3
                [
                    { text: 'Class:', bold: true, fontSize: 9, border: [true, true, false, true] },
                    { text: `${className} - ${sectionName}`, fontSize: 9, border: [false, true, false, true] },
                    { text: 'Date:', bold: true, fontSize: 9, border: [false, true, false, true] },
                    { text: formatDate(receiptDate), fontSize: 9, border: [false, true, true, true] }
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

    // ─── Installments Table ───
    const installmentTableBody: any[][] = [
        [
            { text: '#', fontSize: 10, bold: true, alignment: 'center', color: '#ffffff', fillColor: '#667eea' },
            { text: 'Installment', fontSize: 10, bold: true, color: '#ffffff', fillColor: '#667eea' },
            { text: 'Amount (₹)', fontSize: 10, bold: true, alignment: 'right', color: '#ffffff', fillColor: '#667eea' },
            { text: 'Paid (₹)', fontSize: 10, bold: true, alignment: 'right', color: '#ffffff', fillColor: '#667eea' },
            { text: 'Payment Date', fontSize: 10, bold: true, alignment: 'center', color: '#ffffff', fillColor: '#667eea' },
            { text: 'Mode', fontSize: 10, bold: true, alignment: 'center', color: '#ffffff', fillColor: '#667eea' }
        ],
        ...installmentPayments.map((inst, index) => [
            { text: index + 1, alignment: 'center', fontSize: 9 },
            { text: inst.installmentName, fontSize: 9 },
            { text: inst.amount.toLocaleString('en-IN'), alignment: 'right', fontSize: 9 },
            { text: inst.paidAmount.toLocaleString('en-IN'), alignment: 'right', fontSize: 9, color: '#27ae60' },
            { text: formatDate(inst.paymentDate), alignment: 'center', fontSize: 8 },
            { text: inst.paymentMode, alignment: 'center', fontSize: 8 }
        ])
    ];

    const installmentTable: any = {
        style: 'section',
        table: {
            headerRows: 1,
            widths: [40, '*', 80, 80, 80, 60],
            body: installmentTableBody
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e0e0e0',
            vLineColor: () => '#e0e0e0',
        },
        margin: [0, 0, 0, 20]
    };

    // ─── Summary Box ───
    const summaryBox: any = {
        table: {
            widths: ['*'],
            body: [
                [{
                    stack: [
                        {
                            columns: [
                                { text: 'Total Amount:', bold: true, width: '*', fontSize: 10 },
                                { text: `₹ ${totalAmount.toLocaleString('en-IN')}`, bold: true, fontSize: 10 }
                            ],
                            margin: [0, 8, 0, 8]
                        },
                        {
                            columns: [
                                { text: 'Total Paid:', bold: true, width: '*', fontSize: 10 },
                                { text: `₹ ${totalPaid.toLocaleString('en-IN')}`, bold: true, fontSize: 10, color: '#27ae60' }
                            ],
                            margin: [0, 8, 0, 8]
                        },
                        {
                            columns: [
                                { text: 'Balance Due:', bold: true, width: '*', fontSize: 10 },
                                { text: `₹ ${balanceAmount.toLocaleString('en-IN')}`, bold: true, fontSize: 10, color: balanceAmount > 0 ? '#e74c3c' : '#27ae60' }
                            ],
                            margin: [0, 8, 0, 0]
                        }
                    ],
                    fillColor: '#f8f9ff',
                    margin: [15, 15, 15, 15]
                }]
            ]
        },
        layout: {
            hLineWidth: () => 2,
            vLineWidth: () => 2,
            hLineColor: () => '#667eea',
            vLineColor: () => '#667eea',
        },
        margin: [0, 0, 0, 30]
    };

    // ─── Content ───
    const content: any[] = [
        studentInfoSection,
        { text: 'Installment Breakdown', fontSize: 11, bold: true, color: '#667eea', margin: [0, 0, 0, 8] },
        installmentTable,
        summaryBox,
        getSignatureSection([
            { label: 'Accountant Signature', position: 'left' },
            { label: 'Principal Signature', position: 'right' }
        ])
    ];

    // ─── Document Definition ───
    const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 140, 40, 60],
        header: () => {
            return getReportHeader(schoolData, 'Installment Payment Summary', `Fee: ${feeName}`, 'portrait');
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
        const filename = `Installment_Summary_${receiptNumber.replace(/\s+/g, '_')}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
    } else {
        pdfMake.createPdf(docDefinition).open();
    }
};
