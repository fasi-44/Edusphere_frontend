/**
 * Section Students Component
 * Handles students list, search, filters, bulk promotion, and individual student actions
 * Used within ClassDetail as a tab
 */

import { ConfirmDialog } from '@/components';
import { studentService } from '@/services/modules/studentService';
import { classService } from '@/services/modules/classService';
import { useAuthStore } from '@/stores/authStore';
import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import Button from '../../components/ui/button/Button';
import Modal from '../../components/modals/Modal';
import FormSelect from '../../components/forms/FormSelect';
import FormInput from '../../components/forms/FormInput';
import FormTextarea from '../../components/forms/FormTextarea';

interface Section {
    id: number;
    class_id: number;
    section_name: string;
    student_count: number;
    teacher_id: number;
    teacher_name: string;
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

interface SectionStudentsProps {
    activeSection: number | null;
    sections: Section[];
}

const SectionStudents: FC<SectionStudentsProps> = ({
    activeSection,
    sections,
}) => {
    // Individual actions
    const navigate = useNavigate();
    const academicYearVersion = useAuthStore((state) => state.academicYearVersion);
    // State for students
    const [sectionStudents, setSectionStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
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
    const [confirmAction, setConfirmAction] = useState<'remove' | 'delete' | null>(null);

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
    const [promoteSectionOptions, setPromoteSectionOptions] = useState<any[]>([]);
    const [loadingPromoteData, setLoadingPromoteData] = useState(false);
    const [allClasses, setAllClasses] = useState<any[]>([]);
    const [allAcademicYears, setAllAcademicYears] = useState<any[]>([]);

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

    // Fetch students when section or filters change
    useEffect(() => {
        if (activeSection) {
            fetchSectionStudents(1, pageSize);
        }
    }, [activeSection, studentSearchTerm, genderFilter, statusFilter, academicYearVersion]);

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

            setSectionStudents(response.data || []);
            setStudentPagination(response.meta);
            setCurrentPage(page);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch students');
            setSectionStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };


    // Student column definitions
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

    // Menu handlers
    const handleMenuClick = (event: React.MouseEvent, studentId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();

        // Calculate position, preferring to align to the right of the button
        // but adjusting if it would go off-screen
        const rightPos = window.innerWidth - rect.right;

        setMenuPosition({
            top: rect.bottom + 8,
            right: Math.max(rightPos, 8), // Ensure at least 8px from the right edge
        });
        setShowActionsMenu(showActionsMenu === studentId ? null : studentId);
    };

    const handleSelectAll = () => {
        if (selectedStudents.size === sectionStudents.length && sectionStudents.length > 0) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(sectionStudents.map(s => s.id.toString())));
        }
    };

    const handleStudentSelection = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleEditStudent = (student: any) => {
        setShowActionsMenu(null);
        navigate(`/students/${student.id}/edit`, { state: { student, mode: 'update' } });
    };

    const handleMoveToSection = (student: any) => {
        setSelectedStudent(student);
        setShowMoveModal(true);
        setShowActionsMenu(null);
    };

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
            setAllClasses(Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []);

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

    const handleRemoveStudentFromSection = (student: any) => {
        setSelectedStudent(student);
        setConfirmAction('remove');
        setRemoveConfirmOpen(true);
        setShowActionsMenu(null);
    };

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

    const handleConfirmPromoteStudent = async () => {
        if (!selectedStudent || !promoteToClass || !promoteToSection || !promoteToAcademicYear) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoadingStudents(true);
            const currentAcademicYear = useAuthStore.getState().user?.current_academic_year;
            await studentService.promoteStudent({
                student_ids: [selectedStudent.id],
                from_class_id: allClasses.find(c => c.id === parseInt(promoteToClass))?.id,
                from_section_id: activeSection,
                from_academic_year_id: currentAcademicYear?.id,
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

    // Bulk promotion
    const handleBulkPromoteStudent = async () => {
        if (selectedStudents.size === 0) {
            toast.error('Please select at least one student');
            return;
        }

        setBulkLoadingPromoteData(true);
        try {
            const classesResponse = await classService.list();
            setAllClasses(Array.isArray(classesResponse) ? classesResponse : classesResponse?.data || []);

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
            const currentAcademicYear = useAuthStore.getState().user?.current_academic_year;
            await studentService.promoteStudent({
                student_ids: Array.from(selectedStudents).map(id => parseInt(id, 10)),
                from_class_id: allClasses.find(c => c.id === parseInt(bulkPromoteToClass))?.id,
                from_section_id: activeSection,
                from_academic_year_id: currentAcademicYear?.id,
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

    return (
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
                            onChange={(e) => {
                                setStudentSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
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
                            onChange={(e) => {
                                setGenderFilter(e.target.value);
                                setCurrentPage(1);
                            }}
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
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
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
                                setCurrentPage(1);
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

            {/* Students Table */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                            onClick={() => fetchSectionStudents(currentPage - 1, pageSize)}
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
                                        onClick={() => fetchSectionStudents(page, pageSize)}
                                        className={`px-3 py-1 rounded text-sm ${
                                            currentPage === page
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
                            onClick={() => fetchSectionStudents(currentPage + 1, pageSize)}
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
                            onClick={() => handleMoveToSection(sectionStudents.find(s => s.id === showActionsMenu)!)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Move to Section
                        </button>
                        <button
                            onClick={() => handlePromoteStudent(sectionStudents.find(s => s.id === showActionsMenu)!)}
                            className="w-full text-left px-4 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-2 text-green-600 dark:text-green-400"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Promote
                        </button>
                        <button
                            onClick={() => handleRemoveStudentFromSection(sectionStudents.find(s => s.id === showActionsMenu)!)}
                            className="w-full text-left px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2 text-orange-600 dark:text-orange-400 last:rounded-b-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Remove from Section
                        </button>
                    </div>
                </>
            )}

            {/* Move to Section Modal */}
            <Modal
                isOpen={showMoveModal}
                onClose={() => {
                    setShowMoveModal(false);
                    setSelectedTargetSection('');
                }}
                title="Move Student to Another Section"
                size="sm"
                footer={
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
                }
            >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select the section to move <span className="font-medium">{selectedStudent?.full_name}</span> to:
                </p>

                <FormSelect
                    label="Target Section"
                    required
                    value={selectedTargetSection}
                    onChange={(e) => setSelectedTargetSection(e.target.value)}
                    placeholder="Select a section"
                    options={sections.map((section) => ({
                        label: section.section_name,
                        value: section.id.toString(),
                    }))}
                />
            </Modal>

            {/* Promote Student Modal */}
            <Modal
                isOpen={showPromoteModal}
                onClose={() => setShowPromoteModal(false)}
                title="Promote Student"
                size="md"
                footer={
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowPromoteModal(false)}>
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
                }
            >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Promote <span className="font-medium">{selectedStudent?.full_name}</span> to:
                </p>

                <div className="space-y-4">
                    <FormSelect
                        label="Target Class"
                        required
                        value={promoteToClass}
                        onChange={(e) => handlePromoteClassChange(e.target.value)}
                        disabled={loadingPromoteData}
                        placeholder="Select a class"
                        options={allClasses.map((cls: any) => ({
                            label: cls.class_name || `Class ${cls.id}`,
                            value: cls.id,
                        }))}
                    />

                    <FormSelect
                        label="Target Section"
                        required
                        value={promoteToSection}
                        onChange={(e) => setPromoteToSection(e.target.value)}
                        disabled={!promoteToClass || promoteSectionOptions.length === 0}
                        placeholder={!promoteToClass ? 'Select a class first' : 'Select a section'}
                        options={promoteSectionOptions.map((sec: any) => ({
                            label: sec.section_name || `Section ${sec.id}`,
                            value: sec.id,
                        }))}
                    />

                    <FormSelect
                        label="Target Academic Year"
                        required
                        value={promoteToAcademicYear}
                        onChange={(e) => setPromoteToAcademicYear(e.target.value)}
                        disabled={loadingPromoteData || allAcademicYears.length === 0}
                        placeholder="Select an academic year"
                        options={allAcademicYears.map((year: any) => ({
                            label: `${year.year_name}${year.is_current ? ' (Current)' : ''}`,
                            value: year.id,
                        }))}
                    />

                    <FormSelect
                        label="Promotion Status"
                        value={promoteStatus}
                        onChange={(e) => setPromoteStatus(e.target.value as 'PASSED' | 'FAILED')}
                        placeholder="Select status"
                        options={[
                            { label: 'Passed', value: 'PASSED' },
                            { label: 'Failed', value: 'FAILED' },
                        ]}
                    />

                    <FormInput
                        label="Promotion Date"
                        type="date"
                        value={promoteDateStr}
                        onChange={(e) => setPromoteDateStr(e.target.value)}
                    />

                    <FormTextarea
                        label="Remarks"
                        value={promoteRemarks}
                        onChange={(e) => setPromoteRemarks(e.target.value)}
                        placeholder="Add any remarks (optional)"
                        rows={2}
                    />
                </div>
            </Modal>

            {/* Remove/Delete Confirmation Dialog */}
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

            {/* Bulk Promote Students Modal */}
            <Modal
                isOpen={showBulkPromoteModal}
                onClose={() => {
                    setShowBulkPromoteModal(false);
                    setBulkPromoteToClass('');
                    setBulkPromoteToSection('');
                    setBulkPromoteToAcademicYear('');
                    setBulkPromoteStatus('PASSED');
                    setBulkPromoteRemarks('');
                    setBulkPromoteDateStr('');
                }}
                title="Bulk Promote Students"
                size="lg"
                footer={
                    <div className="flex gap-3 justify-end">
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
                }
            >
                {/* Summary Box */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">{selectedStudents.size} student(s)</span> will be promoted to the selected class and section.
                    </p>
                </div>

                <div className="space-y-4">
                    <FormSelect
                        label="Target Class"
                        required
                        value={bulkPromoteToClass}
                        onChange={(e) => handleBulkPromoteClassChange(e.target.value)}
                        disabled={bulkLoadingPromoteData}
                        placeholder="Select a class"
                        options={allClasses.map((cls: any) => ({
                            label: cls.class_name || `Class ${cls.id}`,
                            value: cls.id,
                        }))}
                    />

                    <FormSelect
                        label="Target Section"
                        required
                        value={bulkPromoteToSection}
                        onChange={(e) => setBulkPromoteToSection(e.target.value)}
                        disabled={!bulkPromoteToClass || bulkPromoteSectionOptions.length === 0}
                        placeholder={!bulkPromoteToClass ? 'Select a class first' : 'Select a section'}
                        options={bulkPromoteSectionOptions.map((sec: any) => ({
                            label: sec.section_name || `Section ${sec.id}`,
                            value: sec.id,
                        }))}
                    />

                    <FormSelect
                        label="Target Academic Year"
                        required
                        value={bulkPromoteToAcademicYear}
                        onChange={(e) => setBulkPromoteToAcademicYear(e.target.value)}
                        disabled={bulkLoadingPromoteData || allAcademicYears.length === 0}
                        placeholder="Select an academic year"
                        options={allAcademicYears.map((year: any) => ({
                            label: `${year.year_name}${year.is_current ? ' (Current)' : ''}`,
                            value: year.id,
                        }))}
                    />

                    <FormSelect
                        label="Promotion Status"
                        value={bulkPromoteStatus}
                        onChange={(e) => setBulkPromoteStatus(e.target.value as 'PASSED' | 'FAILED')}
                        placeholder="Select status"
                        options={[
                            { label: 'Passed', value: 'PASSED' },
                            { label: 'Failed', value: 'FAILED' },
                        ]}
                    />

                    <FormInput
                        label="Promotion Date"
                        type="date"
                        value={bulkPromoteDateStr}
                        onChange={(e) => setBulkPromoteDateStr(e.target.value)}
                    />

                    <FormTextarea
                        label="Remarks"
                        value={bulkPromoteRemarks}
                        onChange={(e) => setBulkPromoteRemarks(e.target.value)}
                        placeholder="Add any remarks (optional)"
                        rows={2}
                    />

                    {/* Preview Box */}
                    {bulkPromoteToClass && bulkPromoteToSection && bulkPromoteToAcademicYear && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-700 dark:text-green-300">
                                <span className="font-medium">{selectedStudents.size} student(s)</span> will be promoted to{' '}
                                <span className="font-medium">
                                    {allClasses.find(c => c.id === parseInt(bulkPromoteToClass))?.class_name}
                                </span> -{' '}
                                <span className="font-medium">
                                    {bulkPromoteSectionOptions.find(s => s.id === parseInt(bulkPromoteToSection))?.section_name}
                                </span> for{' '}
                                <span className="font-medium">
                                    {allAcademicYears.find(y => y.id === parseInt(bulkPromoteToAcademicYear))?.year_name}
                                </span>. Status will be marked as <span className="font-medium">{bulkPromoteStatus}</span>.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default SectionStudents;
