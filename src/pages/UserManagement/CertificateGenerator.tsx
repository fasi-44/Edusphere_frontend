/**
 * Certificate Generator Page
 * Generates Transfer Certificate, Bonafide Certificate, and Student ID Card with tabs
 */

import { FC, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, FormField, FormInput, FormTextarea, LoadingSpinner, Button } from '../../components';
import { studentService } from '../../services/modules/studentService';
import { useAuthStore } from '../../stores/authStore';
import {
    generateTransferCertificatePdf,
    generateBonafideCertificatePdf,
    generateStudentIDCardPdf,
    type TransferCertificateData,
    type BonafideCertificateData,
    type StudentIDCardData,
    type SchoolData,
} from '../../prints';

type CertificateTab = 'transfer' | 'bonafide' | 'idcard';

const CertificateGenerator: FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<CertificateTab>('transfer');
    const [formData, setFormData] = useState<any>({
        issueDate: new Date().toISOString().split('T')[0],
        reason: '',
        tcNumber: '',
        remarks: '',
        purpose: '',
        validUntil: '',
        bloodGroup: '',
        emergencyContact: '',
        lastAttendedDate: '',
        admissionDate: '',
        totalWorkingDays: '',
        daysPresent: '',
    });

    const tabs = [
        { id: 'transfer' as CertificateTab, label: 'Transfer Certificate', icon: '📄' },
        { id: 'bonafide' as CertificateTab, label: 'Bonafide Certificate', icon: '📋' },
        { id: 'idcard' as CertificateTab, label: 'Student ID Card', icon: '🆔' },
    ];

    const fetchStudentDetails = useCallback(async () => {
        if (!studentId) return;

        try {
            setLoading(true);
            const data = await studentService.getById(studentId);
            setStudent(data);

            // Pre-populate admission date if available
            if (data.profile?.admission_date) {
                const admissionDate = new Date(data.profile.admission_date);
                const formattedDate = admissionDate.toISOString().split('T')[0];
                setFormData((prev: any) => ({
                    ...prev,
                    admissionDate: formattedDate,
                }));
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch student details');
            navigate('/students');
        } finally {
            setLoading(false);
        }
    }, [studentId, navigate]);

    useEffect(() => {
        fetchStudentDetails();
    }, [fetchStudentDetails]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const getSchoolData = (): SchoolData => {
        return {
            schoolName: user?.school_name || 'School Name',
            schoolAddress: user?.school_address || '',
            schoolPhone: user?.school_phone || '',
            schoolEmail: user?.school_email || '',
            logo: user?.school_logo || '',
            generatedBy: user?.full_name || user?.username || 'Admin',
        };
    };

    const handleGenerate = async () => {
        try {
            setLoading(true);

            const schoolData = getSchoolData();

            switch (activeTab) {
                case 'transfer':
                    if (!formData.tcNumber) {
                        toast.error('Please enter TC Number');
                        return;
                    }

                    const transferData: TransferCertificateData = {
                        student_name: student.full_name,
                        roll_number: student.profile?.roll_no || 'N/A',
                        class_name: student.class?.class_name || 'N/A',
                        section_name: student.section?.section_name || 'N/A',
                        date_of_birth: student.date_of_birth || '',
                        father_name: student.parent?.father_full_name || 'N/A',
                        mother_name: student.parent?.mother_full_name || 'N/A',
                        admission_date: formData.admissionDate || student.profile?.admission_date,
                        tc_number: formData.tcNumber,
                        issue_date: formData.issueDate,
                        reason: formData.reason || 'N/A',
                        remarks: formData.remarks,
                        academic_year: (user?.academic_year as any)?.year || 'N/A',
                        last_attended_date: formData.lastAttendedDate,
                        total_working_days: formData.totalWorkingDays ? parseInt(formData.totalWorkingDays) : undefined,
                        days_present: formData.daysPresent ? parseInt(formData.daysPresent) : undefined,
                    };

                    await generateTransferCertificatePdf(transferData, schoolData, 'print');
                    toast.success('Transfer Certificate generated successfully');
                    break;

                case 'bonafide':
                    const bonafideData: BonafideCertificateData = {
                        student_name: student.full_name,
                        roll_number: student.profile?.roll_no || 'N/A',
                        class_name: student.class?.class_name || 'N/A',
                        section_name: student.section?.section_name || 'N/A',
                        date_of_birth: student.date_of_birth || '',
                        father_name: student.parent?.father_full_name || 'N/A',
                        mother_name: student.parent?.mother_full_name || 'N/A',
                        issue_date: formData.issueDate,
                        purpose: formData.purpose || '',
                        remarks: formData.remarks,
                        academic_year: (user?.academic_year as any)?.year || 'N/A',
                    };

                    await generateBonafideCertificatePdf(bonafideData, schoolData, 'print');
                    toast.success('Bonafide Certificate generated successfully');
                    break;

                case 'idcard':
                    if (!formData.validUntil) {
                        toast.error('Please enter Valid Until date');
                        return;
                    }

                    const qrPayload = JSON.stringify({
                        student_id: student.id,
                        school: user?.skid || '',
                    });

                    const idCardData: StudentIDCardData = {
                        student_name: student.full_name,
                        roll_number: student.profile?.roll_no || 'N/A',
                        class_name: student.class?.class_name || 'N/A',
                        section_name: student.section?.section_name || 'N/A',
                        date_of_birth: student.date_of_birth || '',
                        blood_group: formData.bloodGroup,
                        student_photo: student.photo_url,
                        issue_date: formData.issueDate,
                        valid_until: formData.validUntil,
                        emergency_contact: formData.emergencyContact,
                        academic_year: (user?.academic_year as any)?.year || 'N/A',
                        qr_data: qrPayload,
                    };

                    await generateStudentIDCardPdf(idCardData, schoolData, 'print');
                    toast.success('Student ID Card generated successfully');
                    break;
            }
        } catch (error: any) {
            console.error('Error generating certificate:', error);
            toast.error('Failed to generate certificate');
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Students', href: '/students' },
        { label: 'Certificates', href: '#' },
    ];

    if (loading && !student) {
        return <LoadingSpinner message="Loading student details..." fullHeight />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Student Certificates"
                subtitle={student ? `${student.full_name} - ${student.class?.class_name || ''} ${student.section?.section_name || ''}` : 'Loading...'}
                breadcrumbs={breadcrumbs}
            />

            {/* Student Information Card */}
            {student && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.full_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Roll Number</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.profile?.roll_no || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Class</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.class?.class_name || 'N/A'} - {student.section?.section_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.date_of_birth || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Father's Name</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.parent?.father_full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Mother's Name</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.parent?.mother_full_name || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Tab Headers */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex -mb-px" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }
                                `}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Transfer Certificate Form */}
                    {activeTab === 'transfer' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transfer Certificate Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Issue Date" required>
                                    <FormInput
                                        type="date"
                                        name="issueDate"
                                        value={formData.issueDate}
                                        onChange={handleInputChange}
                                    />
                                </FormField>

                                <FormField label="TC Number" required>
                                    <FormInput
                                        type="text"
                                        name="tcNumber"
                                        value={formData.tcNumber}
                                        onChange={handleInputChange}
                                        placeholder="Enter TC Number"
                                    />
                                </FormField>

                                <FormField label="Reason for Leaving" className="md:col-span-2">
                                    <FormTextarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        placeholder="Enter reason for leaving"
                                        rows={3}
                                    />
                                </FormField>

                                <FormField label="Last Attended Date">
                                    <FormInput
                                        type="date"
                                        name="lastAttendedDate"
                                        value={formData.lastAttendedDate}
                                        onChange={handleInputChange}
                                    />
                                </FormField>

                                <FormField label="Admission Date">
                                    <FormInput
                                        type="date"
                                        name="admissionDate"
                                        value={formData.admissionDate}
                                        onChange={handleInputChange}
                                    />
                                </FormField>

                                <FormField label="Total Working Days">
                                    <FormInput
                                        type="number"
                                        name="totalWorkingDays"
                                        value={formData.totalWorkingDays}
                                        onChange={handleInputChange}
                                        placeholder="Total working days"
                                    />
                                </FormField>

                                <FormField label="Days Present">
                                    <FormInput
                                        type="number"
                                        name="daysPresent"
                                        value={formData.daysPresent}
                                        onChange={handleInputChange}
                                        placeholder="Days present"
                                    />
                                </FormField>

                                <FormField label="Remarks" className="md:col-span-2">
                                    <FormTextarea
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        placeholder="Enter any additional remarks (optional)"
                                        rows={2}
                                    />
                                </FormField>
                            </div>
                        </div>
                    )}

                    {/* Bonafide Certificate Form */}
                    {activeTab === 'bonafide' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bonafide Certificate Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Issue Date" required>
                                    <FormInput
                                        type="date"
                                        name="issueDate"
                                        value={formData.issueDate}
                                        onChange={handleInputChange}
                                    />
                                </FormField>

                                <FormField label="Purpose" className="md:col-span-2">
                                    <FormTextarea
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        placeholder="Enter purpose of certificate (e.g., Bank Account, Passport, etc.)"
                                        rows={3}
                                    />
                                </FormField>

                                <FormField label="Remarks" className="md:col-span-2">
                                    <FormTextarea
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        placeholder="Enter any additional remarks (optional)"
                                        rows={2}
                                    />
                                </FormField>
                            </div>
                        </div>
                    )}

                    {/* Student ID Card Form */}
                    {activeTab === 'idcard' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student ID Card Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Issue Date" required>
                                    <FormInput
                                        type="date"
                                        name="issueDate"
                                        value={formData.issueDate}
                                        onChange={handleInputChange}
                                    />
                                </FormField>

                                <FormField label="Valid Until" required>
                                    <FormInput
                                        type="date"
                                        name="validUntil"
                                        value={formData.validUntil || ''}
                                        onChange={handleInputChange}
                                    />
                                </FormField>

                                <FormField label="Blood Group">
                                    <FormInput
                                        type="text"
                                        name="bloodGroup"
                                        value={formData.bloodGroup || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g., A+, B+, O+, etc."
                                    />
                                </FormField>

                                <FormField label="Emergency Contact">
                                    <FormInput
                                        type="tel"
                                        name="emergencyContact"
                                        value={formData.emergencyContact || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter emergency contact number"
                                    />
                                </FormField>

                                <FormField label="Remarks" className="md:col-span-2">
                                    <FormTextarea
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        placeholder="Enter any additional remarks (optional)"
                                        rows={2}
                                    />
                                </FormField>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="primary"
                            onClick={handleGenerate}
                            disabled={loading}
                        >
                            Generate & Print
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/students')}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateGenerator;
