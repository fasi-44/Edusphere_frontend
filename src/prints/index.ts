/**
 * Prints Module
 * Central export point for all PDF report generators and shared components
 */

// Shared components
export {
    getReportHeader,
    getReportFooter,
    getSignatureSection,
    commonPdfStyles,
    formatDate,
    formatDateShort,
    loadPdfFonts,
} from './HeaderAndFooterComponent';

// Report generators
export { generateAttendanceReport } from './attendanceReportGenerator';
export { generateTimetablePdf } from './timetableReportGenerator';
export { generateExamTimetablePdf } from './examTimetableGenerator';
export type { ExamTimetableReportData, ExamTimetableEntry } from './examTimetableGenerator';
export { generateSeatingArrangementPdf } from './seatingArrangementGenerator';
export type { SeatingArrangementReportData, SeatingPlanStudent, SeatingArrangementRoom } from './seatingArrangementGenerator';
export { generateProgressCardPdf } from './progressCardReportGenerator';
export { generateFeeReceiptPdf, generateFeeSummaryReceiptPdf } from './feeReceiptGenerator';
export { generateAnnualProgressReportPdf } from './annualProgressReportGenerator';
export type { FeeReceiptData, FeeFullSummaryData } from './feeReceiptGenerator';
export type { AnnualReportData, ExamResult } from './annualProgressReportGenerator';

// Certificate generators
export { generateTransferCertificatePdf } from './transferCertificateGenerator';
export { generateBonafideCertificatePdf } from './bonafideCertificateGenerator';
export { generateStudentIDCardPdf } from './studentIDCardGenerator';
export type { TransferCertificateData } from './transferCertificateGenerator';
export type { BonafideCertificateData } from './bonafideCertificateGenerator';
export type { StudentIDCardData } from './studentIDCardGenerator';

// Types
export type {
    SchoolData,
    PdfAction,
    SignatureConfig,
    AttendanceReportData,
    SingleDayReportData,
    MonthlyReportData,
    SingleDayRecord,
    SingleDayStatistics,
    MonthlyStudentRecord,
    MonthlyRecords,
    MonthlyOverallSummary,
    TimetableReportData,
    TimetableTimeSlot,
    TimetableEntry,
    TimetableEntrySubject,
    TimetableEntryTeacher,
    TimetableConfiguration,
} from './printTypes';
