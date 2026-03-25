/**
 * Exam Management Module Exports
 * Central export point for all exam management pages
 */

// Exam Configuration
export { default as ExamList } from './ExamList';
export { default as ExamForm } from './ExamForm';
export { default as ExamDetail } from './ExamDetail';

// Exam Subject Configuration
export { default as ExamSubjectConfigList } from './ExamSubjectConfigList';
export { default as ExamSubjectConfigForm } from './ExamSubjectConfigForm';

// Exam Timetable
export { default as ExamTimetable } from './ExamTimetable';
export { default as StudentExamTimetable } from './StudentExamTimetable';
export { default as TeacherInvigilatorSchedule } from './TeacherInvigilatorSchedule';

// Seating Arrangement
export { default as SeatingArrangement } from './SeatingArrangement';

// Tab Components
export { default as ExamOverviewTab } from './components/ExamOverviewTab';
export { default as ExamScheduleTab } from './components/ExamScheduleTab';
export { default as ExamStatsTab } from './components/ExamStatsTab';
