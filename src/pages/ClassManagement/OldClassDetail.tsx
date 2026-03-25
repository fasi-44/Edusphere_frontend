/**
 * Class Detail Page
 * View class details with sections tabs, students and subjects
 */

import { ConfirmDialog, EmptyState, LoadingSpinner, PageHeader } from '@/components';
import { academicsService } from '@/services/modules/academicsService';
import { classService } from '@/services/modules/classService';
import { studentService } from '@/services/modules/studentService';
import { useAuthStore } from '@/stores/authStore';
import { IClass } from '@/types';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import Button from '../../components/ui/button/Button';

interface Section {
    id: number;
    class_id: number;
    section_name: string;
    student_count: number;
    teacher_id: number;
    teacher_name: string;
}

interface Subject {
    id: string;
    name: string;
    code?: string;
    [key: string]: any;
}

interface IColumn {
    key: string;
    label: string;
    width?: number;
    render?: (value: any, row: any) => React.ReactNode;
}

interface IPaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const ClassDetail: FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // State for class data
    const [classData, setClassData] = useState<IClass | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // State for active section and tabs
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');

    // State for students and subjects
    const [sectionStudents, setSectionStudents] = useState<any[]>([]);
    const [sectionSubjects, setSectionSubjects] = useState<Subject[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Pagination state for students
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // Fixed page size
    const [studentPagination, setStudentPagination] = useState<IPaginationMeta>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    // Filter and search states
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Actions menu state
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [confirmAction, setConfirmAction] = useState<'remove' | 'delete' | 'move' | null>(null);

    // Move to section state
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedTargetSection, setSelectedTargetSection] = useState<string>('');

    // Promotion state
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promoteToClass, setPromoteToClass] = useState<string>('');
    const [promoteToSection, setPromoteToSection] = useState<string>('');
    const [promoteToAcademicYear, setPromoteToAcademicYear] = useState<string>('');
    const [promoteStatus, setPromoteStatus] = useState<'PASSED' | 'FAILED'>('PASSED');
    const [promoteRemarks, setPromoteRemarks] = useState<string>('');
    const [promoteDateStr, setPromoteDateStr] = useState<string>('');

    // Promotion dropdown state
    const [allClasses, setAllClasses] = useState<any[]>([]);
    const [promoteSectionOptions, setPromoteSectionOptions] = useState<any[]>([]);
    const [allAcademicYears, setAllAcademicYears] = useState<any[]>([]);
    const [loadingPromoteData, setLoadingPromoteData] = useState(false);

    // Bulk promotion state
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [showBulkPromoteModal, setShowBulkPromoteModal] = useState(false);
    const [bulkPromoteToClass, setBulkPromoteToClass] = useState<string>('');
    const [bulkPromoteToSection, setBulkPromoteToSection] = useState<string>('');
    const [bulkPromoteToAcademicYear, setBulkPromoteToAcademicYear] = useState<string>('');
    const [bulkPromoteStatus, setBulkPromoteStatus] = useState<'PASSED' | 'FAILED'>('PASSED');
    const [bulkPromoteRemarks, setBulkPromoteRemarks] = useState<string>('');
    const [bulkPromoteDateStr, setBulkPromoteDateStr] = useState<string>('');
    const [bulkPromoteSectionOptions, setBulkPromoteSectionOptions] = useState<any[]>([]);
    const [bulkLoadingPromoteData, setBulkLoadingPromoteData] = useState(false);

    // Subject management state
    const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
    const [selectedSubjectsToAdd, setSelectedSubjectsToAdd] = useState<any[]>([]);
    const [selectedSubjectToRemove, setSelectedSubjectToRemove] = useState<any>(null);
    const [showRemoveSubjectConfirm, setShowRemoveSubjectConfirm] = useState(false);
    const [subjectActionsMenu, setSubjectActionsMenu] = useState<string | null>(null);
    const [subjectMenuPosition, setSubjectMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
    const [loadingAvailableSubjects, setLoadingAvailableSubjects] = useState(false);

    // Fetch class data on mount
    useEffect(() => {
        if (id) {
            const fetchClassAndSection = async () => {
                setLoading(true);
                try {
                    const cls = await classService.getById(id);
                    setClassData(cls);

                    // Fetch sections
                    const sectionData = await classService.getSections(id);
                    setSections(sectionData);

                    // Set first section as active
                    if (sectionData.length > 0) {
                        setActiveSection(sectionData[0].id);
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch class');
                    toast.error(err.message || 'Failed to fetch class');
                } finally {
                    setLoading(false);
                }
            };
            fetchClassAndSection();
        }
    }, [id]);

    // Reset pagination and filters when section changes
    useEffect(() => {
        setCurrentPage(1);
        setStudentSearchTerm('');
        setGenderFilter('');
        setStatusFilter('');
    }, [activeSection]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [studentSearchTerm, genderFilter, statusFilter]);

    // Fetch students when section, pagination, or filters change
    useEffect(() => {
        if (activeSection && activeTab === 'students') {
            fetchSectionStudents(currentPage, pageSize);
        }
    }, [activeSection, activeTab, currentPage, pageSize, studentSearchTerm, genderFilter, statusFilter]);

    // Fetch subjects when section or tab changes
    useEffect(() => {
        if (activeSection && activeTab === 'subjects') {
            fetchSectionSubjects();
        }
    }, [activeSection, activeTab]);

    // Fetch subjects for the active section
    const fetchSectionSubjects = async () => {
        try {
            setLoadingSubjects(true);
            const subjects = await academicsService.getSectionSpecificSubjects(activeSection!.toString());
            setSectionSubjects(subjects);
        } catch (err: any) {
            console.error('Failed to fetch subjects:', err);
            toast.error(err.message || 'Failed to fetch subjects');
            setSectionSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const fetchSectionStudents = async (page: number, limit: number) => {
        try {
            setLoadingStudents(true);
            const authUser = useAuthStore.getState().user;
            if (!authUser) {
                toast.error('User not authenticated');
                return;
            }
            const response = await studentService.getSectionStudents(
                authUser.current_academic_year.id.toString(),
                activeSection!.toString(),
                page,
                limit,
                studentSearchTerm,
                genderFilter,
                statusFilter
            );

            // Add sl no to students
            const students = response.data.map((student: any, index: number) => ({
                ...student,
                key: student.id,
                slNo: (page - 1) * limit + index + 1,
            }));

            setSectionStudents(students);
            setStudentPagination({
                total: response.meta.total,
                page: response.meta.page,
                limit: response.meta.limit,
                totalPages: response.meta.totalPages,
            });
        } catch (err: any) {
            console.error('Failed to fetch students:', err.message);
            toast.error(err.message || 'Failed to fetch students');
            setSectionStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    // Fetch subjects when section or tab changes
    useEffect(() => {
        if (activeSection && activeTab === 'subjects') {
            const fetchSubjects = async () => {
                setLoadingSubjects(true);
                try {
                    const subjects = await academicsService.getSectionSpecificSubjects(activeSection.toString());
                    setSectionSubjects(subjects);
                } catch (err: any) {
                    console.error('Failed to fetch subjects:', err.message);
                    toast.error(err.message || 'Failed to fetch subjects');
                    setSectionSubjects([]);
                } finally {
                    setLoadingSubjects(false);
                }
            };
            fetchSubjects();
        }
    }, [activeSection, activeTab]);

    // Handle delete class
    const handleDeleteClass = async () => {
        if (!classData) return;

        try {
            await classService.delete(String(classData.id));
            toast.success('Class deleted successfully');
            setTimeout(() => navigate('/classes'), 1500);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete class');
        }
    };

    // Handle menu click for student actions
    const handleMenuClick = (event: React.MouseEvent, studentId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setShowActionsMenu(showActionsMenu === studentId ? null : studentId);
    };

    // Handle view student
    const handleViewStudent = (student: any) => {
        setShowActionsMenu(null);
        navigate(`/students/${student.id}`, { state: { student, mode: 'view' } });
    };

    // Handle edit student
    const handleEditStudent = (student: any) => {
        setShowActionsMenu(null);
        navigate(`/students/${student.id}/edit`, { state: { student, mode: 'update' } });
    };

    // Handle remove student from section
    const handleRemoveStudentFromSection = (student: any) => {
        setSelectedStudent(student);
        setConfirmAction('remove');
        setRemoveConfirmOpen(true);
        setShowActionsMenu(null);
    };

    // Handle move student to another section
    const handleMoveToSection = (student: any) => {
        setSelectedStudent(student);
        setShowMoveModal(true);
        setShowActionsMenu(null);
    };

    // Handle delete student from system
    const handleDeleteStudentFromSystem = (student: any) => {
        setSelectedStudent(student);
        setConfirmAction('delete');
        setRemoveConfirmOpen(true);
        setShowActionsMenu(null);
    };

    // Handle promote student - fetch classes and academic year
    const handlePromoteStudent = async (student: any) => {
        setSelectedStudent(student);
        setShowPromoteModal(true);
        setShowActionsMenu(null);

        // Reset form
        setPromoteToClass('');
        setPromoteToSection('');
        setPromoteToAcademicYear('');
        setPromoteStatus('PASSED');
        setPromoteRemarks('');
        setPromoteDateStr('');
        setPromoteSectionOptions([]);

        // Fetch all classes and academic years
        setLoadingPromoteData(true);
        try {
            const classesResponse = await classService.list();
            setAllClasses(classesResponse.data || []);

            // Get academic years from auth store
            const authUser = useAuthStore.getState().user;
            if (authUser?.academic_years && Array.isArray(authUser.academic_years)) {
                setAllAcademicYears(authUser.academic_years);
                // Set current academic year as default
                if (authUser.current_academic_year?.id) {
                    setPromoteToAcademicYear(authUser.current_academic_year.id.toString());
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch classes:', err);
            toast.error('Failed to load classes');
        } finally {
            setLoadingPromoteData(false);
        }
    };

    // Handle class selection in promotion modal - fetch sections
    const handlePromoteClassChange = async (classId: string) => {
        setPromoteToClass(classId);
        setPromoteToSection(''); // Reset section when class changes
        setPromoteSectionOptions([]);

        if (!classId) return;

        try {
            const sectionsResponse = await classService.getSections(classId);
            setPromoteSectionOptions(sectionsResponse || []);
        } catch (err: any) {
            console.error('Failed to fetch sections:', err);
            toast.error('Failed to load sections for this class');
        }
    };

    // Confirm promote student
    const handleConfirmPromoteStudent = async () => {
        if (!selectedStudent || !promoteToClass || !promoteToSection || !promoteToAcademicYear) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoadingStudents(true);
            await studentService.promoteStudent({
                student_ids: [selectedStudent.id],
                from_class_id: classData?.id,
                from_section_id: activeSection,
                from_academic_year_id: '2', // Current academic year
                to_class_id: promoteToClass,
                to_section_id: promoteToSection,
                to_academic_year_id: promoteToAcademicYear,
                promotion_date: promoteDateStr || new Date().toISOString().split('T')[0],
                default_status: promoteStatus,
                remarks: promoteRemarks
            });
            toast.success('Student promoted successfully!');
            setShowPromoteModal(false);
            fetchSectionStudents(currentPage, pageSize);
        } catch (err: any) {
            toast.error(err.message || 'Failed to promote student.');
        } finally {
            setLoadingStudents(false);
        }
    };

    // Handle bulk promote student - open modal
    const handleBulkPromoteStudent = async () => {
        if (selectedStudents.size === 0) {
            toast.error('Please select at least one student');
            return;
        }

        setBulkLoadingPromoteData(true);
        try {
            const classesResponse = await classService.list();
            setAllClasses(classesResponse.data || []);

            // Get academic years from auth store
            const authUser = useAuthStore.getState().user;
            if (authUser?.academic_years && Array.isArray(authUser.academic_years)) {
                setAllAcademicYears(authUser.academic_years);
                // Set current academic year as default
                if (authUser.current_academic_year?.id) {
                    setBulkPromoteToAcademicYear(authUser.current_academic_year.id.toString());
                }
            }

            setShowBulkPromoteModal(true);
            setBulkPromoteToClass('');
            setBulkPromoteToSection('');
            setBulkPromoteStatus('PASSED');
            setBulkPromoteRemarks('');
            setBulkPromoteDateStr('');
            setBulkPromoteSectionOptions([]);
        } catch (err: any) {
            console.error('Failed to fetch classes:', err);
            toast.error('Failed to load classes');
        } finally {
            setBulkLoadingPromoteData(false);
        }
    };

    // Handle class selection in bulk promotion modal - fetch sections
    const handleBulkPromoteClassChange = async (classId: string) => {
        setBulkPromoteToClass(classId);
        setBulkPromoteToSection(''); // Reset section when class changes
        setBulkPromoteSectionOptions([]);

        if (!classId) return;

        try {
            const sectionsResponse = await classService.getSections(classId);
            setBulkPromoteSectionOptions(sectionsResponse || []);
        } catch (err: any) {
            console.error('Failed to fetch sections:', err);
            toast.error('Failed to load sections for this class');
        }
    };

    // Confirm bulk promote students
    const handleConfirmBulkPromoteStudents = async () => {
        if (
            selectedStudents.size === 0 ||
            !bulkPromoteToClass ||
            !bulkPromoteToSection ||
            !bulkPromoteToAcademicYear
        ) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoadingStudents(true);
            await studentService.promoteStudent({
                student_ids: Array.from(selectedStudents).map(id => parseInt(id, 10)),
                from_class_id: classData?.id,
                from_section_id: activeSection,
                from_academic_year_id: '2', // Current academic year
                to_class_id: bulkPromoteToClass,
                to_section_id: bulkPromoteToSection,
                to_academic_year_id: bulkPromoteToAcademicYear,
                promotion_date: bulkPromoteDateStr || new Date().toISOString().split('T')[0],
                default_status: bulkPromoteStatus,
                remarks: bulkPromoteRemarks
            });
            toast.success(`${selectedStudents.size} student(s) promoted successfully!`);
            setShowBulkPromoteModal(false);
            setSelectedStudents(new Set());
            fetchSectionStudents(currentPage, pageSize);
        } catch (err: any) {
            toast.error(err.message || 'Failed to promote students.');
        } finally {
            setLoadingStudents(false);
        }
    };

    // Handle student checkbox selection
    const handleStudentSelection = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedStudents.size === sectionStudents.length) {
            setSelectedStudents(new Set());
        } else {
            const allIds = new Set(sectionStudents.map((s: any) => s.id.toString()));
            setSelectedStudents(allIds);
        }
    };

    // Confirm move to section
    const handleConfirmMoveStudent = async () => {
        if (!selectedStudent || !selectedTargetSection) {
            toast.error('Please select a target section');
            return;
        }

        try {
            setLoadingStudents(true);
            await classService.moveStudent(selectedTargetSection, selectedStudent.id);
            toast.success('Student moved to new section successfully!');
            setShowMoveModal(false);
            setSelectedTargetSection('');
            fetchSectionStudents(currentPage, pageSize);
        } catch (err: any) {
            toast.error(err.message || 'Failed to move student.');
        } finally {
            setLoadingStudents(false);
        }
    };

    // Confirm student action (delete or remove from section)
    const handleConfirmRemoveStudent = async () => {
        if (!selectedStudent) return;

        try {
            setLoadingStudents(true);
            if (confirmAction === 'delete') {
                // Delete student from the system
                await studentService.delete(selectedStudent.id);
                toast.success('Student deleted successfully!');
            } else if (confirmAction === 'remove') {
                // Remove student from section
                if (!activeSection) {
                    throw new Error('No section selected');
                }
                await classService.removeStudent(activeSection.toString(), selectedStudent.id);
                toast.success('Student removed from section successfully!');
            }
            setRemoveConfirmOpen(false);
            setConfirmAction(null);
            fetchSectionStudents(currentPage, pageSize);
        } catch (err: any) {
            toast.error(err.message || 'Failed to perform action.');
        } finally {
            setLoadingStudents(false);
        }
    };

    // ============ Subject Management Handlers ============

    // Fetch available subjects for the section (not yet added to this section)
    const fetchAvailableSubjects = async () => {
        try {
            setLoadingAvailableSubjects(true);
            if (!activeSection) {
                toast.error('No section selected');
                return;
            }
            const subjects = await academicsService.getAvailableSubjects(activeSection.toString());
            setAvailableSubjects(subjects);
        } catch (err: any) {
            console.error('Failed to fetch available subjects:', err);
            toast.error(err.message || 'Failed to load available subjects');
            setAvailableSubjects([]);
        } finally {
            setLoadingAvailableSubjects(false);
        }
    };

    // Open add subjects modal
    const handleOpenAddSubjectModal = () => {
        setSelectedSubjectsToAdd([]);
        fetchAvailableSubjects();
        setShowAddSubjectModal(true);
    };

    // Handle removing subject from selected list (in modal)
    const handleRemoveFromSelectedList = (subjectId: string) => {
        setSelectedSubjectsToAdd(prev => prev.filter(s => s.id !== subjectId));
    };

    // Add selected subjects to section
    const handleAddSubjects = async () => {
        if (selectedSubjectsToAdd.length === 0) {
            toast.error('Please select at least one subject');
            return;
        }

        try {
            setLoadingSubjects(true);
            const subjectIds = selectedSubjectsToAdd.map(s => s.id);

            if (!activeSection) {
                toast.error('No section selected');
                return;
            }

            await academicsService.addSubjectsToSection(activeSection.toString(), subjectIds);

            toast.success('Subjects added successfully!');
            await fetchSectionSubjects();
            setShowAddSubjectModal(false);
            setSelectedSubjectsToAdd([]);
        } catch (err: any) {
            console.error('Error adding subjects:', err);
            toast.error(err.message || 'Failed to add subjects to section');
        } finally {
            setLoadingSubjects(false);
        }
    };

    // Handle remove subject from section
    const handleRemoveSubject = (subject: any) => {
        setSelectedSubjectToRemove(subject);
        setSubjectActionsMenu(null);
        setShowRemoveSubjectConfirm(true);
    };

    // Confirm remove subject from section
    const confirmRemoveSubject = async () => {
        if (!selectedSubjectToRemove) return;

        try {
            setLoadingSubjects(true);

            if (!activeSection) {
                toast.error('No section selected');
                return;
            }

            await academicsService.removeSubjectFromSection(
                activeSection.toString(),
                selectedSubjectToRemove.id
            );

            toast.success('Subject removed successfully!');
            await fetchSectionSubjects();
            setShowRemoveSubjectConfirm(false);
            setSelectedSubjectToRemove(null);
        } catch (err: any) {
            console.error('Error removing subject:', err);
            toast.error(err.message || 'Failed to remove subject from section');
        } finally {
            setLoadingSubjects(false);
        }
    };

    // Handle subject actions menu click
    const handleSubjectMenuClick = (event: React.MouseEvent, subjectId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setSubjectMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setSubjectActionsMenu(subjectActionsMenu === subjectId ? null : subjectId);
    };

    // Get active section data
    const getActiveSectionData = (): Section | undefined => {
        return sections.find(s => s.id === activeSection);
    };

    // Define student columns for DataTable
    const studentColumns: IColumn[] = [
        {
            key: 'slNo',
            label: 'Sl. No',
        },
        {
            key: 'full_name',
            label: 'Name',
            render: (value) => <span className="font-medium text-gray-900 dark:text-white truncate">{value}</span>,
        },
        {
            key: 'email',
            label: 'Email',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value}</span>,
        },
        {
            key: 'profile',
            label: 'Roll No',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value?.roll_no || '-'}</span>,
        },
    ];

    // Define subject columns for DataTable
    const subjectColumns: IColumn[] = [
        {
            key: 'subject_name',
            label: 'Subject Name',
            render: (value) => <span className="font-medium text-gray-900 dark:text-white">{value}</span>,
        },
        {
            key: 'subject_code',
            label: 'Code',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>,
        },
        {
            key: 'teachers',
            label: 'Teacher',
            render: (value) => (
                <span className="text-gray-600 dark:text-gray-400">
                    {value?.length > 0
                        ? value.map((t: any) => `${t.first_name} ${t.last_name}`).join(', ')
                        : 'Not Assigned'
                    }
                </span>
            ),
        },
        {
            key: 'credits',
            label: 'Credits',
            render: (value) => <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>,
        },
    ];

    // Show loading spinner
    if (loading && !classData) {
        return <LoadingSpinner fullHeight message="Loading class details..." />;
    }

    // Show error message
    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Class Details"
                    subtitle="View class information"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Classes', href: '/classes' },
                        { label: 'Details', href: '#' },
                    ]}
                />
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button variant="outline" onClick={() => navigate('/classes')}>
                        Back to Classes
                    </Button>
                </div>
            </div>
        );
    }

    // Show empty state if no class found
    if (!classData) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Class Details"
                    subtitle="View class information"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Classes', href: '/classes' },
                        { label: 'Details', href: '#' },
                    ]}
                />
                <EmptyState
                    icon="📚"
                    title="Class Not Found"
                    description="The class you're looking for doesn't exist or has been deleted."
                    action={
                        <Button variant="outline" onClick={() => navigate('/classes')}>
                            Back to Classes
                        </Button>
                    }
                />
            </div>
        );
    }

    const activeSectionData = getActiveSectionData();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={classData.name}
                subtitle="View and manage class information"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Classes', href: '/classes' },
                    { label: classData.class_name || classData.name, href: '#' },
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/classes/${classData.id}/edit`)}
                        >
                            Edit Class
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete Class
                        </Button>
                    </div>
                }
            />

            {/* Sections Tabs */}
            {sections.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setActiveSection(section.id);
                                    setActiveTab('students');
                                }}
                                className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${activeSection === section.id
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                            >
                                {section.section_name}
                            </button>
                        ))}
                    </div>

                    {activeSectionData && (
                        <div className="p-6 space-y-6">
                            {/* Section Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Section Name</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {activeSectionData.section_name}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {activeSectionData.student_count}
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Class Teacher</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {activeSectionData.teacher_name || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Content Tabs */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setActiveTab('students')}
                                        className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'students'
                                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        Students
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('subjects')}
                                        className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'subjects'
                                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        Subjects
                                    </button>
                                </div>

                                {/* Students Tab */}
                                {activeTab === 'students' && (
                                    <div className="space-y-4">
                                        {/* Search and Filter Section */}
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* Search Filter */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Search
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Name or email..."
                                                        value={studentSearchTerm}
                                                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                {/* Gender Filter */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Gender
                                                    </label>
                                                    <select
                                                        value={genderFilter}
                                                        onChange={(e) => setGenderFilter(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">All Genders</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>

                                                {/* Status Filter */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Status
                                                    </label>
                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">All Status</option>
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>

                                                {/* Reset Button */}
                                                <div className="flex items-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setStudentSearchTerm('');
                                                            setGenderFilter('');
                                                            setStatusFilter('');
                                                        }}
                                                        className="flex-1"
                                                    >
                                                        Reset Filters
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Bulk Actions Bar */}
                                            {selectedStudents.size > 0 && (
                                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudents.size === sectionStudents.length && sectionStudents.length > 0}
                                                            onChange={handleSelectAll}
                                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {selectedStudents.size} of {sectionStudents.length} student(s) selected
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setSelectedStudents(new Set())}
                                                        >
                                                            Clear Selection
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            onClick={handleBulkPromoteStudent}
                                                            disabled={selectedStudents.size === 0 || loadingStudents}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline-block', marginRight: '0.5rem' }}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                            Promote Selected
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Students DataTable with Checkboxes */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                                        <th className="px-4 py-3 text-left">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStudents.size === sectionStudents.length && sectionStudents.length > 0}
                                                                onChange={handleSelectAll}
                                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                                                                title="Select all students"
                                                            />
                                                        </th>
                                                        {studentColumns.map((col) => (
                                                            <th
                                                                key={col.key}
                                                                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                                                style={{ width: col.width ? `${col.width}px` : 'auto' }}
                                                            >
                                                                {col.label}
                                                            </th>
                                                        ))}
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loadingStudents ? (
                                                        <tr>
                                                            <td colSpan={studentColumns.length + 2} className="px-4 py-8 text-center">
                                                                <div className="flex justify-center">
                                                                    <div className="inline-block animate-spin">
                                                                        <div className="h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : sectionStudents.length > 0 ? (
                                                        sectionStudents.map((student) => (
                                                            <tr
                                                                key={student.id}
                                                                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedStudents.has(student.id.toString())}
                                                                        onChange={() => handleStudentSelection(student.id.toString())}
                                                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                                                                    />
                                                                </td>
                                                                {studentColumns.map((col) => (
                                                                    <td
                                                                        key={col.key}
                                                                        className="px-4 py-3 text-sm text-gray-900 dark:text-white"
                                                                    >
                                                                        {col.render ? col.render(student[col.key], student) : student[col.key]}
                                                                    </td>
                                                                ))}
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        onClick={(e) => handleMenuClick(e, student.id)}
                                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                        title="More actions"
                                                                    >
                                                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                                            <circle cx="12" cy="5" r="2" />
                                                                            <circle cx="12" cy="12" r="2" />
                                                                            <circle cx="12" cy="19" r="2" />
                                                                        </svg>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={studentColumns.length + 2} className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
                                                                No students found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {!loadingStudents && sectionStudents.length > 0 && (
                                            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, studentPagination.total)} of {studentPagination.total} students
                                                </span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setCurrentPage(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <div className="flex items-center gap-2">
                                                        {Array.from({ length: Math.min(5, studentPagination.totalPages) }, (_, i) => {
                                                            const page = i + 1;
                                                            return (
                                                                <button
                                                                    key={page}
                                                                    onClick={() => setCurrentPage(page)}
                                                                    className={`px-3 py-1 rounded text-sm ${currentPage === page
                                                                        ? 'bg-blue-500 text-white'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                        }`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setCurrentPage(currentPage + 1)}
                                                        disabled={currentPage === studentPagination.totalPages}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Fixed Actions Menu */}
                                        {showActionsMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(null)} />
                                                <div
                                                    className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                                                    style={{
                                                        top: `${menuPosition.top}px`,
                                                        right: `${menuPosition.right}px`,
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => handleEditStudent(sectionStudents.find(s => s.id === showActionsMenu)!)}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg text-gray-900 dark:text-gray-100"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewStudent(sectionStudents.find(s => s.id === showActionsMenu)!)}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveToSection(sectionStudents.find(s => s.id === showActionsMenu)!)}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                        </svg>
                                                        Move to Another Section
                                                    </button>
                                                    <button
                                                        onClick={() => handlePromoteStudent(sectionStudents.find(s => s.id === showActionsMenu)!)}
                                                        className="w-full text-left px-4 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-2 text-green-600 dark:text-green-400"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        Promote Student
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveStudentFromSection(sectionStudents.find(s => s.id === showActionsMenu)!)}
                                                        className="w-full text-left px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2 text-orange-600 dark:text-orange-400"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Remove from Section
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStudentFromSystem(sectionStudents.find(s => s.id === showActionsMenu)!)}
                                                        className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 last:rounded-b-lg"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete Student
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Subjects Tab */}
                                {activeTab === 'subjects' && (
                                    <div className="space-y-4">
                                        {/* Add Subject Button */}
                                        <div className="flex justify-end">
                                            <Button
                                                variant="primary"
                                                onClick={handleOpenAddSubjectModal}
                                            >
                                                <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add Subject
                                            </Button>
                                        </div>

                                        {/* Subjects Table */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            {loadingSubjects ? (
                                                <div className="text-center py-8">
                                                    <div className="inline-block animate-spin">
                                                        <div className="h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
                                                    </div>
                                                </div>
                                            ) : sectionSubjects.length > 0 ? (
                                                <>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                                                    {subjectColumns.map((col) => (
                                                                        <th
                                                                            key={col.key}
                                                                            className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                                                            style={{ width: col.width ? `${col.width}px` : 'auto' }}
                                                                        >
                                                                            {col.label}
                                                                        </th>
                                                                    ))}
                                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                                        Actions
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {sectionSubjects.map((subject) => (
                                                                    <tr
                                                                        key={subject.id}
                                                                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                                    >
                                                                        {subjectColumns.map((col) => (
                                                                            <td
                                                                                key={col.key}
                                                                                className="px-4 py-3 text-sm text-gray-900 dark:text-white"
                                                                            >
                                                                                {col.render ? col.render(subject[col.key], subject) : subject[col.key]}
                                                                            </td>
                                                                        ))}
                                                                        <td className="px-4 py-3 text-center">
                                                                            <button
                                                                                onClick={(e) => handleSubjectMenuClick(e, subject.id)}
                                                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                                title="More actions"
                                                                            >
                                                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                                                    <circle cx="12" cy="5" r="2" />
                                                                                    <circle cx="12" cy="12" r="2" />
                                                                                    <circle cx="12" cy="19" r="2" />
                                                                                </svg>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Subject Actions Menu */}
                                                    {subjectActionsMenu && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setSubjectActionsMenu(null)} />
                                                            <div
                                                                className="fixed w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                                                                style={{
                                                                    top: `${subjectMenuPosition.top}px`,
                                                                    right: `${subjectMenuPosition.right}px`,
                                                                }}
                                                            >
                                                                <button
                                                                    onClick={() => handleRemoveSubject(sectionSubjects.find(s => s.id === subjectActionsMenu)!)}
                                                                    className="w-full text-left px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2 rounded-lg text-orange-600 dark:text-orange-400"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                    Remove from Section
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-600 dark:text-gray-400">No subjects in this section</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {sections.length === 0 && (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No sections available for this class</p>
                </div>
            )}

            {/* Student Action Confirmation Dialog */}
            <ConfirmDialog
                isOpen={removeConfirmOpen}
                title={confirmAction === 'delete' ? 'Delete Student' : 'Remove Student from Section'}
                message={
                    confirmAction === 'delete'
                        ? `Are you sure you want to delete the student "${selectedStudent?.full_name}"? This action cannot be undone.`
                        : `Are you sure you want to remove "${selectedStudent?.full_name}" from this section?`
                }
                type="danger"
                confirmText={confirmAction === 'delete' ? 'Yes, Delete' : 'Yes, Remove'}
                cancelText="Cancel"
                isLoading={loadingStudents}
                onConfirm={handleConfirmRemoveStudent}
                onCancel={() => {
                    setRemoveConfirmOpen(false);
                    setConfirmAction(null);
                }}
            />

            {/* Move to Section Modal */}
            {showMoveModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMoveModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-96 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Move Student to Another Section
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Select the section to move <span className="font-medium">{selectedStudent?.full_name}</span> to:
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Target Section
                            </label>
                            <select
                                value={selectedTargetSection}
                                onChange={(e) => setSelectedTargetSection(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a section</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id.toString()}>
                                        {section.section_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowMoveModal(false);
                                    setSelectedTargetSection('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConfirmMoveStudent}
                                disabled={!selectedTargetSection}
                            >
                                Move Student
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Promote Student Modal */}
            {showPromoteModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPromoteModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-full max-w-md p-6 max-h-96 overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Promote Student
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Promote <span className="font-medium">{selectedStudent?.full_name}</span> to:
                        </p>

                        <div className="space-y-4">
                            {/* Target Class Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Class *
                                </label>
                                <select
                                    value={promoteToClass}
                                    onChange={(e) => handlePromoteClassChange(e.target.value)}
                                    disabled={loadingPromoteData}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">Select a class</option>
                                    {allClasses.map((cls: any) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.class_name || `Class ${cls.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Target Section Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Section *
                                </label>
                                <select
                                    value={promoteToSection}
                                    onChange={(e) => setPromoteToSection(e.target.value)}
                                    disabled={!promoteToClass || promoteSectionOptions.length === 0}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">
                                        {!promoteToClass ? 'Select a class first' : 'Select a section'}
                                    </option>
                                    {promoteSectionOptions.map((sec: any) => (
                                        <option key={sec.id} value={sec.id}>
                                            {sec.section_name || `Section ${sec.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Target Academic Year - Dropdown from Auth Store */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Academic Year *
                                </label>
                                <select
                                    value={promoteToAcademicYear}
                                    onChange={(e) => setPromoteToAcademicYear(e.target.value)}
                                    disabled={loadingPromoteData || allAcademicYears.length === 0}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">Select an academic year</option>
                                    {allAcademicYears.map((year: any) => (
                                        <option key={year.id} value={year.id}>
                                            {year.year_name}
                                            {year.is_current ? ' (Current)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Promotion Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Promotion Status
                                </label>
                                <select
                                    value={promoteStatus}
                                    onChange={(e) => setPromoteStatus(e.target.value as 'PASSED' | 'FAILED')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="PASSED">Passed</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </div>

                            {/* Promotion Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Promotion Date
                                </label>
                                <input
                                    type="date"
                                    value={promoteDateStr}
                                    onChange={(e) => setPromoteDateStr(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Remarks
                                </label>
                                <textarea
                                    value={promoteRemarks}
                                    onChange={(e) => setPromoteRemarks(e.target.value)}
                                    placeholder="Add any remarks (optional)"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowPromoteModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConfirmPromoteStudent}
                                disabled={!promoteToClass || !promoteToSection || !promoteToAcademicYear || loadingPromoteData}
                            >
                                {loadingPromoteData ? 'Loading...' : 'Promote Student'}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Add Subjects Modal */}
            {showAddSubjectModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAddSubjectModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
                            </svg>
                            Add Subjects to {activeSectionData?.section_name}
                        </h3>

                        <div className="space-y-4">
                            {/* Autocomplete for subject selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Subjects from {classData?.class_name}
                                </label>
                                <div className="relative">
                                    <datalist id="subjects-list">
                                        {availableSubjects.map((subject) => (
                                            <option key={subject.id} value={`${subject.subject_name} (${subject.subject_code})`} />
                                        ))}
                                    </datalist>
                                    <div className="absolute right-2 top-2">
                                        {loadingAvailableSubjects && (
                                            <div className="animate-spin text-blue-500">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" opacity="0.3" />
                                                    <circle cx="12" cy="2" r="2" fill="currentColor" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {availableSubjects.length > 0 && (
                                    <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                        {availableSubjects.map((subject) => (
                                            <button
                                                key={subject.id}
                                                onClick={() => {
                                                    if (!selectedSubjectsToAdd.find(s => s.id === subject.id)) {
                                                        setSelectedSubjectsToAdd([...selectedSubjectsToAdd, subject]);
                                                    }
                                                }}
                                                disabled={selectedSubjectsToAdd.find(s => s.id === subject.id)}
                                                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">{subject.subject_name}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{subject.subject_code} • {subject.credits || 1} Credits</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {availableSubjects.length === 0 && !loadingAvailableSubjects && (
                                    <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            ⚠️ All subjects from {classData?.name} are already added to this section.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Selected Subjects List */}
                            {selectedSubjectsToAdd.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Selected Subjects ({selectedSubjectsToAdd.length})
                                    </p>
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600 max-h-48 overflow-y-auto">
                                        {selectedSubjectsToAdd.map((subject) => (
                                            <div key={subject.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">{subject.subject_name}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{subject.subject_code} • {subject.credits || 1} Credits</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFromSelectedList(subject.id)}
                                                    className="ml-3 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddSubjectModal(false);
                                    setSelectedSubjectsToAdd([]);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddSubjects}
                                disabled={selectedSubjectsToAdd.length === 0 || loadingSubjects}
                            >
                                {loadingSubjects ? 'Adding...' : `Add ${selectedSubjectsToAdd.length} Subject(s)`}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Remove Subject Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showRemoveSubjectConfirm}
                title="Remove Subject from Section?"
                message={`Are you sure you want to remove "${selectedSubjectToRemove?.subject_name}" from this section? The subject will still exist in the system.`}
                type="warning"
                confirmText="Yes, Remove"
                cancelText="Cancel"
                isLoading={loadingSubjects}
                onConfirm={confirmRemoveSubject}
                onCancel={() => {
                    setShowRemoveSubjectConfirm(false);
                    setSelectedSubjectToRemove(null);
                }}
            />

            {/* Bulk Promote Students Modal */}
            {showBulkPromoteModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowBulkPromoteModal(false)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Bulk Promote Students
                        </h3>

                        {/* Summary Box */}
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <span className="font-medium">{selectedStudents.size} student(s)</span> from{' '}
                                <span className="font-medium">{activeSectionData?.section_name}</span> section will be promoted to the selected class and section.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Target Class Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Class *
                                </label>
                                <select
                                    value={bulkPromoteToClass}
                                    onChange={(e) => handleBulkPromoteClassChange(e.target.value)}
                                    disabled={bulkLoadingPromoteData}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">Select a class</option>
                                    {allClasses.map((cls: any) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name || `Class ${cls.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Target Section Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Section *
                                </label>
                                <select
                                    value={bulkPromoteToSection}
                                    onChange={(e) => setBulkPromoteToSection(e.target.value)}
                                    disabled={!bulkPromoteToClass || bulkPromoteSectionOptions.length === 0}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">
                                        {!bulkPromoteToClass ? 'Select a class first' : 'Select a section'}
                                    </option>
                                    {bulkPromoteSectionOptions.map((sec: any) => (
                                        <option key={sec.id} value={sec.id}>
                                            {sec.section_name || `Section ${sec.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Target Academic Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Academic Year *
                                </label>
                                <select
                                    value={bulkPromoteToAcademicYear}
                                    onChange={(e) => setBulkPromoteToAcademicYear(e.target.value)}
                                    disabled={bulkLoadingPromoteData || allAcademicYears.length === 0}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">Select an academic year</option>
                                    {allAcademicYears.map((year: any) => (
                                        <option key={year.id} value={year.id}>
                                            {year.year_name}
                                            {year.is_current ? ' (Current)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Promotion Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Promotion Status
                                </label>
                                <select
                                    value={bulkPromoteStatus}
                                    onChange={(e) => setBulkPromoteStatus(e.target.value as 'PASSED' | 'FAILED')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="PASSED">Passed</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </div>

                            {/* Promotion Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Promotion Date
                                </label>
                                <input
                                    type="date"
                                    value={bulkPromoteDateStr}
                                    onChange={(e) => setBulkPromoteDateStr(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Remarks
                                </label>
                                <textarea
                                    value={bulkPromoteRemarks}
                                    onChange={(e) => setBulkPromoteRemarks(e.target.value)}
                                    placeholder="Add any remarks (optional)"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Preview Box */}
                            {bulkPromoteToClass && bulkPromoteToSection && bulkPromoteToAcademicYear && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        <span className="font-medium">{selectedStudents.size} student(s)</span> will be promoted to{' '}
                                        <span className="font-medium">
                                            {allClasses.find(c => c.id === bulkPromoteToClass)?.name}
                                        </span> -{' '}
                                        <span className="font-medium">
                                            {bulkPromoteSectionOptions.find(s => s.id === parseInt(bulkPromoteToSection))?.section_name}
                                        </span> for{' '}
                                        <span className="font-medium">
                                            {allAcademicYears.find(y => y.id === parseInt(bulkPromoteToAcademicYear))?.year_name}
                                        </span>. Previous enrollment status will be marked as <span className="font-medium">{bulkPromoteStatus}</span>.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowBulkPromoteModal(false);
                                    setBulkPromoteToClass('');
                                    setBulkPromoteToSection('');
                                    setBulkPromoteToAcademicYear('');
                                    setBulkPromoteStatus('PASSED');
                                    setBulkPromoteRemarks('');
                                    setBulkPromoteDateStr('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConfirmBulkPromoteStudents}
                                disabled={
                                    !bulkPromoteToClass ||
                                    !bulkPromoteToSection ||
                                    !bulkPromoteToAcademicYear ||
                                    selectedStudents.size === 0 ||
                                    loadingStudents
                                }
                            >
                                {loadingStudents ? 'Promoting...' : `Promote ${selectedStudents.size} Student(s)`}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Class Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteClass}
                title="Delete Class?"
                message="Are you sure you want to delete this class? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default ClassDetail;
