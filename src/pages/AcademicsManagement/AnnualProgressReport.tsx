/**
 * Annual Progress Report Page
 * Displays all exam results for a specific student with filtering and print capability
 */

import { FC, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, FormField, FormSelect, LoadingSpinner, EmptyState, PrintActions } from '../../components';
import { academicsService } from '../../services/modules/academicsService';
import { useAuthStore } from '../../stores/authStore';
import { IStudentProgress } from '../../types/index';
import { generateAnnualProgressReportPdf } from '../../prints';
import type { AnnualReportData, SchoolData, PdfAction } from '../../prints';

interface ExamResult {
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

const AnnualProgressReport: FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [examResults, setExamResults] = useState<ExamResult[]>([]);
    const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
    const [selectedExamFilter, setSelectedExamFilter] = useState<string>('ALL');
    const [loading, setLoading] = useState(false);

    const fetchExamTypes = useCallback(async () => {
        try {
            const data = await academicsService.fetchExamTypes();
            setExamTypes(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch exam types');
        }
    }, []);

    const fetchAnnualReport = useCallback(async () => {
        if (!studentId || !user?.current_academic_year?.id) return;

        try {
            setLoading(true);
            // TODO: Create API endpoint to fetch all exam results for a student
            const data = await academicsService.fetchStudentAnnualReport(
                studentId,
                String(user.current_academic_year.id)
            );

            setStudentInfo(data.student_info);
            setExamResults(data.exam_results || []);
            setFilteredResults(data.exam_results || []);
        } catch (error: any) {
            console.error('Error fetching annual report:', error);
            toast.error(error.message || 'Failed to fetch annual report');
            setExamResults([]);
            setFilteredResults([]);
        } finally {
            setLoading(false);
        }
    }, [studentId, user?.current_academic_year?.id]);

    useEffect(() => {
        fetchExamTypes();
        fetchAnnualReport();
    }, [fetchExamTypes, fetchAnnualReport]);

    // Filter results when exam filter changes
    useEffect(() => {
        if (selectedExamFilter === 'ALL') {
            setFilteredResults(examResults);
        } else {
            setFilteredResults(examResults.filter(result => result.exam_id === selectedExamFilter));
        }
    }, [selectedExamFilter, examResults]);

    const getSchoolData = useCallback((): SchoolData => {
        const authUser = user;
        return {
            logo: authUser?.school_logo || '',
            schoolName: authUser?.school_name || 'School Name',
            schoolAddress: authUser?.school_address || 'School Address',
            schoolPhone: authUser?.school_phone || 'N/A',
            schoolEmail: authUser?.school_email || 'N/A',
            generatedBy: authUser?.full_name || authUser?.name || 'System',
        };
    }, [user]);

    const handlePrint = async (action: PdfAction = 'print') => {
        if (!studentInfo || filteredResults.length === 0) {
            toast.error('No data to print');
            return;
        }

        try {
            const reportData: AnnualReportData = {
                student_name: studentInfo.student_name,
                roll_number: studentInfo.roll_number,
                class_name: studentInfo.class_name,
                section_name: studentInfo.section_name,
                academic_year: user?.current_academic_year?.year_name || '',
                exam_results: filteredResults,
            };

            await generateAnnualProgressReportPdf(reportData, getSchoolData(), action);
            const message = action === 'download'
                ? 'Report downloaded successfully'
                : 'Report sent to printer successfully';
            toast.success(message);
        } catch (error: any) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        }
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Students', href: '/students' },
        { label: 'Academics', href: '/academics' },
        { label: 'Annual Report', href: '#' },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Annual Progress Report"
                subtitle={studentInfo ? `${studentInfo.student_name} - ${studentInfo.class_name} ${studentInfo.section_name}` : 'Loading...'}
                breadcrumbs={breadcrumbs}
            />

            {/* Loading State */}
            {loading && <LoadingSpinner message="Loading annual report..." fullHeight />}

            {!loading && (
                <>
                    {/* Filter Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                            <div>
                                <FormField label="Filter by Exam">
                                    <FormSelect
                                        value={selectedExamFilter}
                                        onChange={(e) => setSelectedExamFilter(e.target.value)}
                                        options={[
                                            { label: 'All Exams', value: 'ALL' },
                                            ...examTypes.map((exam) => ({
                                                label: exam.exam_name || exam.name,
                                                value: exam.id,
                                            }))
                                        ]}
                                    />
                                </FormField>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 invisible">
                                    Actions
                                </label>
                                <div className="flex gap-2">
                                    <PrintActions
                                        onAction={handlePrint}
                                        disabled={loading || filteredResults.length === 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Basic Info */}
                    {studentInfo && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Student Name</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{studentInfo.student_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Roll Number</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{studentInfo.roll_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Class</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{studentInfo.class_name} - {studentInfo.section_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Academic Year</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{user?.current_academic_year?.year_name}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Exam Results */}
                    {filteredResults.length > 0 ? (
                        <div className="space-y-6">
                            {filteredResults.map((result, index) => (
                                <div key={result.exam_id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* Exam Header */}
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                                        <div className="flex justify-between items-center text-white">
                                            <div>
                                                <h3 className="text-lg font-semibold">{result.exam_name}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">{result.percentage.toFixed(2)}%</p>
                                                <p className="text-sm">Grade: {result.grade} | Rank: {result.rank}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject-wise Marks */}
                                    <div className="p-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Subject</th>
                                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Max Marks</th>
                                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Obtained</th>
                                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Percentage</th>
                                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Grade</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.subjects.map((subject, idx) => (
                                                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                                                            <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{subject.subject_name}</td>
                                                            <td className="py-2 px-4 text-sm text-center text-gray-700 dark:text-gray-300">{subject.max_marks}</td>
                                                            <td className="py-2 px-4 text-sm text-center font-semibold text-gray-900 dark:text-white">{subject.obtained_marks}</td>
                                                            <td className="py-2 px-4 text-sm text-center text-gray-700 dark:text-gray-300">
                                                                {((subject.obtained_marks / subject.max_marks) * 100).toFixed(2)}%
                                                            </td>
                                                            <td className="py-2 px-4 text-sm text-center">
                                                                <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold">
                                                                    {subject.grade}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Total Row */}
                                                    <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
                                                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">Total</td>
                                                        <td className="py-3 px-4 text-sm text-center text-gray-900 dark:text-white">{result.total_marks}</td>
                                                        <td className="py-3 px-4 text-sm text-center text-gray-900 dark:text-white">{result.obtained_marks}</td>
                                                        <td className="py-3 px-4 text-sm text-center text-gray-900 dark:text-white">{result.percentage.toFixed(2)}%</td>
                                                        <td className="py-3 px-4 text-sm text-center text-gray-900 dark:text-white">{result.grade}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon="📊"
                            title="No Exam Results"
                            description="No exam results available for this student yet."
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default AnnualProgressReport;
