/**
 * Class Progress Report Page
 * Displays class-level and student-level progress reports with statistics and analysis
 */

import { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, FormField, FormSelect, LoadingSpinner, EmptyState } from '../../components';
import { ProgressStatCard, SubjectAnalysisTable, StudentProgressTable } from '../../components/academics';
import { academicsService } from '../../services/modules/academicsService';
import { IClassStatistics, ISubjectAnalysis, IStudentProgress } from '../../types/index';
import { useAuthStore } from '../../stores/authStore';

const ClassProgress: FC = () => {
    const navigate = useNavigate();
    const { user, academicYearVersion } = useAuthStore();
    const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [classInfo, setClassInfo] = useState<any>(null);
    const [classStatistics, setClassStatistics] = useState<IClassStatistics | null>(null);
    const [subjectAnalysis, setSubjectAnalysis] = useState<ISubjectAnalysis[]>([]);
    const [studentProgress, setStudentProgress] = useState<IStudentProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);


    const fetchClasses = useCallback(async () => {
        try {
            const data = await academicsService.fetchClasses();
            setClasses(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch classes');
        }
    }, []);

    const fetchSections = useCallback(async (classId: string) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const data = await academicsService.fetchSections(classId);
            setSections(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch sections');
            setSections([]);
        }
    }, []);

    const fetchExamTypes = useCallback(async () => {
        try {
            const data = await academicsService.fetchExamTypes();
            setExamTypes(data);
            // Set default to first exam (not "All")
            if (data.length > 0) {
                setSelectedExam(data[0].id);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch exam types');
        }
    }, []);

    const fetchTeacherAssignedClass = useCallback(async () => {
        if (!user?.school_user_id) return;

        try {
            const data = await academicsService.fetchMyClass(String(user.school_user_id));
            setClassInfo(data);
        } catch (error: any) {
            toast.error(error.message || 'No class assigned to you as class teacher');
        }
    }, [user?.school_user_id]);

    const fetchClassProgressData = useCallback(async () => {
        if (!selectedExam || !user?.current_academic_year?.id) return;

        const classId = isSchoolAdmin ? selectedClass : classInfo?.class_id;
        const sectionId = isSchoolAdmin ? selectedSection : classInfo?.section_id;

        if (!classId || !sectionId) return;

        try {
            setLoading(true);

            const data = await academicsService.fetchClassProgress({
                classId,
                sectionId,
                examId: selectedExam,
                academicYearId: String(user.current_academic_year.id),
            });

            setClassStatistics(data.statistics || null);
            setSubjectAnalysis(data.subject_analysis || []);
            setStudentProgress(data.student_progress || []);
            setCurrentPage(1);
        } catch (error: any) {
            console.error('Error fetching class progress:', error);
            toast.error(error.message || 'Failed to fetch class progress');
            setClassStatistics(null);
            setSubjectAnalysis([]);
            setStudentProgress([]);
        } finally {
            setLoading(false);
        }
    }, [selectedExam, selectedClass, selectedSection, classInfo, isSchoolAdmin, user?.current_academic_year?.id]);

    // ============================================
    // Effects
    // ============================================

    useEffect(() => {
        fetchExamTypes();

        if (isSchoolAdmin) {
            fetchClasses();
        } else {
            fetchTeacherAssignedClass();
        }
    }, [isSchoolAdmin, fetchExamTypes, fetchClasses, fetchTeacherAssignedClass, academicYearVersion]);

    useEffect(() => {
        if (isSchoolAdmin && selectedClass) {
            setSelectedSection('');
            setSections([]);
            setClassStatistics(null);
            setSubjectAnalysis([]);
            setStudentProgress([]);
            fetchSections(selectedClass);
        }
    }, [selectedClass, isSchoolAdmin, fetchSections]);

    useEffect(() => {
        if (isSchoolAdmin) {
            if (selectedClass && selectedSection) {
                fetchClassProgressData();
            }
        } else {
            if (classInfo) {
                fetchClassProgressData();
            }
        }
    }, [fetchClassProgressData]);

    const handleViewProgressCard = (studentId: string) => {
        // Navigate to single exam progress card
        navigate(`/academics/progress-card/${studentId}/${selectedExam}`);
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Academics', href: '/academics' },
        { label: 'Class Progress', href: '#' },
    ];

    const pageTitle = isSchoolAdmin ? 'Class Progress Report' : 'My Class Progress';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={pageTitle}
                subtitle="View class-level and student-wise progress reports"
                breadcrumbs={breadcrumbs}
            />

            {/* Loading State */}
            {loading && <LoadingSpinner message="Loading progress data..." fullHeight />}

            {!loading && (
                <>
                    {/* Filter Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Select Filters
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Class Filter (Admin Only) */}
                            {isSchoolAdmin && (
                                <FormField label="Class *" required>
                                    <FormSelect
                                        value={selectedClass}
                                        onChange={(e) => {
                                            setSelectedClass(e.target.value);
                                            setSelectedSection('');
                                            setSections([]);
                                            setClassStatistics(null);
                                            setSubjectAnalysis([]);
                                            setStudentProgress([]);
                                        }}
                                        options={classes.map((cls) => ({
                                            label: cls.class_name || cls.name,
                                            value: cls.id,
                                        }))}
                                        placeholder="Select Class"
                                    />
                                </FormField>
                            )}

                            {/* Section Filter (Admin Only) */}
                            {isSchoolAdmin && (
                                <FormField label="Section *" required>
                                    <FormSelect
                                        value={selectedSection}
                                        onChange={(e) => {
                                            setSelectedSection(e.target.value);
                                            setClassStatistics(null);
                                            setSubjectAnalysis([]);
                                            setStudentProgress([]);
                                        }}
                                        options={sections.map((section) => ({
                                            label: section.section_name || section.name,
                                            value: section.id,
                                        }))}
                                        placeholder="Select Section"
                                        disabled={!selectedClass}
                                    />
                                </FormField>
                            )}

                            {/* Exam Filter */}
                            <FormField label="Exam *" required>
                                <FormSelect
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                    options={examTypes.map((exam) => ({
                                        label: exam.exam_name || exam.name,
                                        value: exam.id,
                                    }))}
                                    placeholder="Select Exam"
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    {classStatistics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ProgressStatCard
                                icon={<span className="text-3xl">👥</span>}
                                title="Total Students"
                                value={classStatistics.total_students}
                                bgColor="bg-blue-50 dark:bg-blue-900/20"
                                iconColor="text-blue-600 dark:text-blue-400"
                            />
                            <ProgressStatCard
                                icon={<span className="text-3xl">📊</span>}
                                title="Class Average"
                                value={`${classStatistics.class_average?.toFixed(2) || 0}%`}
                                bgColor="bg-green-50 dark:bg-green-900/20"
                                iconColor="text-green-600 dark:text-green-400"
                            />
                            <ProgressStatCard
                                icon={<span className="text-3xl">✅</span>}
                                title="Students Passed"
                                value={classStatistics.pass_count}
                                subtitle={`${classStatistics.pass_percentage?.toFixed(1) || 0}%`}
                                bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                                iconColor="text-emerald-600 dark:text-emerald-400"
                            />
                            <ProgressStatCard
                                icon={<span className="text-3xl">🏆</span>}
                                title="Class Topper"
                                value={classStatistics.topper_name}
                                subtitle={`${classStatistics.topper_percentage?.toFixed(1) || 0}%`}
                                bgColor="bg-amber-50 dark:bg-amber-900/20"
                                iconColor="text-amber-600 dark:text-amber-400"
                            />
                        </div>
                    )}

                    {/* Subject-wise Analysis */}
                    {subjectAnalysis.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                📚 Subject-wise Analysis
                            </h3>
                            <SubjectAnalysisTable data={subjectAnalysis} loading={loading} />
                        </div>
                    )}

                    {/* Student-wise Progress */}
                    {studentProgress.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                👨‍🎓 Student-wise Progress
                            </h3>
                            <StudentProgressTable
                                data={studentProgress}
                                loading={loading}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                onViewProgress={handleViewProgressCard}
                            />
                        </div>
                    )}

                    {/* No Class Assigned (Teacher) */}
                    {!isSchoolAdmin && !classInfo && !loading && (
                        <EmptyState
                            icon="👥"
                            title="No Class Assigned"
                            description="You are not assigned as a class teacher for any class. Please contact administrator."
                        />
                    )}

                    {/* Select Class & Section (Admin) */}
                    {isSchoolAdmin && !selectedClass && !loading && (
                        <EmptyState
                            icon="📋"
                            title="Select Class and Section"
                            description="Please select a class and section to view progress report."
                        />
                    )}

                    {/* No Data Available */}
                    {((isSchoolAdmin && selectedClass && selectedSection && selectedExam) ||
                        (!isSchoolAdmin && classInfo && selectedExam)) &&
                        studentProgress.length === 0 &&
                        !loading && (
                            <EmptyState
                                icon="📄"
                                title="No Data Available"
                                description="Marks have not been entered yet for this exam. Please ensure all subject teachers have entered marks."
                            />
                        )}
                </>
            )}
        </div>
    );
};

export default ClassProgress;
