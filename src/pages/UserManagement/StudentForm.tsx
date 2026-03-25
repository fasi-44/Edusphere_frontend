/**
 * Student Form Component
 * Form for creating and editing students with all fields
 */

import { FC, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import { Button, LoadingSpinner, Modal } from '../../components';
import { studentService } from '../../services/modules/studentService';
import { classService } from '../../services/modules/classService';
import { parentService } from '../../services/modules/parentService';
import ParentForm from './ParentForm';
import { useDebounce } from '../../hooks/useDebounce';

interface IStudentFormProps {
    initialData?: any;
    mode?: 'create' | 'update' | 'view';
}

const StudentForm: FC<IStudentFormProps> = ({ initialData, mode: propMode = 'create' }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Auto-detect mode based on URL - if id exists, it's update mode
    const mode = id ? 'update' : propMode;
    const [student, setStudent] = useState<any>(null);
    const [originalParentId, setOriginalParentId] = useState<string>('');
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [parents, setParents] = useState<any[]>([]);
    const [selectedParentId, setSelectedParentId] = useState('');
    const [parentMode, setParentMode] = useState<'link' | 'create'>('link');
    const [parentSearchInput, setParentSearchInput] = useState('');
    const [showParentDropdown, setShowParentDropdown] = useState(false);

    // Debounce parent search to reduce unnecessary filtering (300ms delay)
    const debouncedParentSearch = useDebounce(parentSearchInput, 300);
    const [showParentModal, setShowParentModal] = useState(false);
    const [showParentReassign, setShowParentReassign] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        // Base user fields
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        date_of_birth: '',
        address: '',
        has_login: false,
        is_active: true,
        // Essential fields for ID Cards & Certificates
        student_photo: '',
        blood_group: '',
        emergency_contact: '',
        // Identification Details
        admission_number: '',
        aadhar_number: '',
        birth_certificate_number: '',
        nationality: 'Indian',
        religion: '',
        category: '',
        mother_tongue: '',
        // Student specific fields
        roll_no: '',
        admission_date: '',
        class_id: '',
        section_id: '',
        parent_id: '',
        role_id: 4,
        role: "STUDENT",
        ...initialData,
    });

    useEffect(() => {
        fetchClasses();
        fetchParents();
        if (mode === 'update' && id) {
            fetchStudent();
        }
    }, [id, mode]);

    // Fetch sections when class_id changes
    useEffect(() => {
        if (formData.class_id) {
            fetchSections(formData.class_id);
        }
    }, [formData.class_id]);

    const fetchClasses = async () => {
        try {
            const response = await classService.list();
            setClasses(response);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to fetch classes');
        }
    };

    const fetchSections = async (classId: string) => {
        try {
            const sectionsData = await classService.getSections(classId);
            setSections(sectionsData);
        } catch (error) {
            console.error('Error fetching sections:', error);
            toast.error('Failed to fetch sections');
        }
    };

    const fetchParents = async () => {
        try {
            const response = await parentService.list({ limit: 100 });
            setParents(response.data);
        } catch (error) {
            console.error('Error fetching parents:', error);
            toast.error('Failed to fetch parents');
        }
    };

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const studentData = await studentService.getById(id!);

            if (studentData) {
                // Store student data for displaying parent information
                setStudent(studentData);

                // Convert date formats to YYYY-MM-DD for input[type="date"]
                const dob = studentData.date_of_birth ? new Date(studentData.date_of_birth).toISOString().split('T')[0] : '';
                const admissionDate = studentData.profile?.admission_date ? new Date(studentData.profile.admission_date).toISOString().split('T')[0] : '';

                setFormData({
                    username: studentData.username || '',
                    password: '', // Password is never pre-filled for security
                    first_name: studentData.first_name || '',
                    last_name: studentData.last_name || '',
                    email: studentData.email || '',
                    phone: studentData.phone || '',
                    gender: studentData.gender || '',
                    date_of_birth: dob,
                    address: studentData.address || '',
                    has_login: studentData.has_login || false,
                    is_active: studentData.is_active || true,
                    // Essential fields (from profile)
                    student_photo: studentData.profile?.student_photo || studentData.photo_url || '',
                    blood_group: studentData.profile?.blood_group || '',
                    emergency_contact: studentData.profile?.emergency_contact || '',
                    // Identification Details (from profile)
                    admission_number: studentData.profile?.admission_number || '',
                    aadhar_number: studentData.profile?.aadhar_number || '',
                    birth_certificate_number: studentData.profile?.birth_certificate_number || '',
                    nationality: studentData.profile?.nationality || 'Indian',
                    religion: studentData.profile?.religion || '',
                    category: studentData.profile?.category || '',
                    mother_tongue: studentData.profile?.mother_tongue || '',
                    // Student specific fields
                    roll_no: studentData.profile?.roll_no || '',
                    admission_date: admissionDate,
                    class_id: studentData.class?.id ? studentData.class.id.toString() : '', // Convert to string for select
                    section_id: studentData.section?.id ? studentData.section.id.toString() : '', // Convert to string for select
                    parent_id: studentData.parent?.id ? studentData.parent.id.toString() : '', // Convert to string for select
                    role_id: studentData.role_id || 4,
                    role: studentData.role?.role_code || "STUDENT",
                });

                if (studentData.parent?.id) {
                    const parentIdStr = studentData.parent.id.toString();
                    setSelectedParentId(parentIdStr);
                    setOriginalParentId(parentIdStr);
                }

                // Set photo preview if exists (from profile)
                if (studentData.profile?.student_photo || studentData.photo_url) {
                    setPhotoPreview(studentData.profile?.student_photo || studentData.photo_url);
                }

                // Trigger fetching sections if class_id is set
                if (studentData.class?.id) {
                    fetchSections(studentData.class.id.toString());
                }
            }
        } catch (error) {
            console.error('Error fetching student:', error);
            toast.error('Failed to fetch student');
        } finally {
            setLoading(false);
        }
    };
    

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: typeof formData) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPG, PNG, or GIF)');
            return;
        }

        // Validate file size (2MB limit)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
            toast.error('Image size should not exceed 2MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setPhotoPreview(base64String);
            setPhotoFile(file);
            setFormData((prev: typeof formData) => ({
                ...prev,
                student_photo: base64String, // Store base64 for now
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setPhotoPreview('');
        setPhotoFile(null);
        setFormData((prev: typeof formData) => ({
            ...prev,
            student_photo: '',
        }));
        // Reset file input
        const fileInput = document.getElementById('student_photo_input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    // Get filtered parents based on debounced search input
    const getFilteredParents = () => {
        if (!debouncedParentSearch.trim()) return parents;
        return parents.filter((parent) =>
            `${parent.first_name} ${parent.last_name} ${parent.email}`
                .toLowerCase()
                .includes(debouncedParentSearch.toLowerCase())
        );
    };

    // Get selected parent object
    const getSelectedParent = () => {
        return parents.find((p) => p.id === selectedParentId);
    };

    // Handle parent creation from modal
    const handleParentCreationSuccess = (parentData: any) => {
        // Add new parent to the list
        setParents(prev => [...prev, parentData]);

        // Auto-select the newly created parent
        setSelectedParentId(parentData.id);

        // Close modal and reset search
        setShowParentModal(false);
        setParentSearchInput('');
        setShowParentDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate parent selection
        let parentId = formData.parent_id;
        if (!selectedParentId) {
            toast.error('Please select a parent or create a new one');
            return;
        }
        parentId = selectedParentId;

        try {
            setIsSubmitting(true);

            const studentData = {
                ...formData,
                parent_id: parentId,
                admission_date: formData.admission_date || null,
                date_of_birth: formData.date_of_birth || null,
            };

            if (mode === 'update' && id) {
                await studentService.update(id, studentData);
                toast.success('Student updated successfully');
            } else {
                await studentService.create(studentData);
                toast.success('Student created successfully');
            }
            navigate('/students');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save student');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullHeight message="Loading student..." />;
    }

    const isViewMode = mode === 'view';

    return (
        <div className="space-y-6 p-3">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Account Information Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Username *
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter username"
                            />
                        </div>

                        {/* Password */}
                        {mode === 'create' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                    placeholder="Enter password"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Personal Information Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter first name"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter last name"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter email"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Phone *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter phone number"
                            />
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Gender
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            />
                        </div>

                        {/* Blood Group */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Blood Group
                            </label>
                            <select
                                name="blood_group"
                                value={formData.blood_group}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Emergency Contact Number
                            </label>
                            <input
                                type="tel"
                                name="emergency_contact"
                                value={formData.emergency_contact}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter emergency contact number"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            disabled={isViewMode}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            placeholder="Enter address"
                        />
                    </div>

                    {/* Student Photo */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Student Photo
                        </label>

                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Photo Preview */}
                            <div className="flex-shrink-0">
                                {photoPreview ? (
                                    <div className="relative">
                                        <img
                                            src={photoPreview}
                                            alt="Student preview"
                                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                                        />
                                        {!isViewMode && (
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition"
                                                title="Remove photo"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                        <span className="text-gray-400 dark:text-gray-500 text-sm">No Photo</span>
                                    </div>
                                )}
                            </div>

                            {/* Upload Section */}
                            {!isViewMode && (
                                <div className="flex-1">
                                    <input
                                        id="student_photo_input"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="student_photo_input"
                                        className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition"
                                    >
                                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                                    </label>
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <p>• Accepted formats: JPG, PNG, GIF</p>
                                        <p>• Maximum file size: 2MB</p>
                                        <p>• Recommended size: 300x300 pixels</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Identification Details Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Identification Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Admission Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Admission Number
                            </label>
                            <input
                                type="text"
                                name="admission_number"
                                value={formData.admission_number}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter admission number"
                            />
                        </div>

                        {/* Aadhar Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Aadhar Number
                            </label>
                            <input
                                type="text"
                                name="aadhar_number"
                                value={formData.aadhar_number}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter 12-digit Aadhar number"
                                maxLength={12}
                            />
                        </div>

                        {/* Birth Certificate Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Birth Certificate Number
                            </label>
                            <input
                                type="text"
                                name="birth_certificate_number"
                                value={formData.birth_certificate_number}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter birth certificate number"
                            />
                        </div>

                        {/* Nationality */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nationality
                            </label>
                            <input
                                type="text"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter nationality"
                            />
                        </div>

                        {/* Religion */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Religion
                            </label>
                            <select
                                name="religion"
                                value={formData.religion}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                                <option value="">Select Religion</option>
                                <option value="Hinduism">Hinduism</option>
                                <option value="Islam">Islam</option>
                                <option value="Christianity">Christianity</option>
                                <option value="Sikhism">Sikhism</option>
                                <option value="Buddhism">Buddhism</option>
                                <option value="Jainism">Jainism</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                                <option value="">Select Category</option>
                                <option value="General">General</option>
                                <option value="OBC">OBC (Other Backward Class)</option>
                                <option value="SC">SC (Scheduled Caste)</option>
                                <option value="ST">ST (Scheduled Tribe)</option>
                                <option value="EWS">EWS (Economically Weaker Section)</option>
                            </select>
                        </div>

                        {/* Mother Tongue */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Mother Tongue
                            </label>
                            <input
                                type="text"
                                name="mother_tongue"
                                value={formData.mother_tongue}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter mother tongue"
                            />
                        </div>
                    </div>
                </div>

                {/* Student Specific Information */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Roll No */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Roll Number
                            </label>
                            <input
                                type="text"
                                name="roll_no"
                                value={formData.roll_no}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder="Enter roll number"
                            />
                        </div>

                        {/* Admission Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Admission Date
                            </label>
                            <input
                                type="date"
                                name="admission_date"
                                value={formData.admission_date}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            />
                        </div>

                        {/* Class */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Class
                            </label>
                            <select
                                name="class_id"
                                value={formData.class_id}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                                <option value="">Select Class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Section
                            </label>
                            <select
                                name="section_id"
                                value={formData.section_id}
                                onChange={handleInputChange}
                                disabled={isViewMode || !formData.class_id}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                                <option value="">Select Section (Optional)</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.section_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Parent Linking */}
                {!isViewMode && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Parent Information</h3>

                        {/* Current Associated Parent (Edit Mode) */}
                        {mode === 'update' && student && student.parent && !showParentReassign && originalParentId && (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Current Associated Parent</h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowParentReassign(true);
                                            setSelectedParentId('');
                                            setParentSearchInput('');
                                        }}
                                        className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                                    >
                                        Remove & Reassign
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Father's Details - Left Side */}
                                    <div className="space-y-4">
                                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">Father's Details</h5>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.parent.father_full_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.parent.father_phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Occupation</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.parent.father_occupation || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Qualification</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.parent.father_qualification || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Mother's Details - Right Side */}
                                    <div className="space-y-4">
                                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">Mother's Details</h5>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.parent.mother_full_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.parent.mother_phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Occupation</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.parent.mother_occupation || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Qualification</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.parent.mother_qualification || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Email - Full Width */}
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{student.parent.email || 'N/A'}</p>
                                    </div>

                                    {/* Address - Full Width */}
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {student.parent.address ?
                                                `${student.parent.address}, ${student.parent.city}, ${student.parent.state} - ${student.parent.postal_code}`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Parent Linking Section - Show in create mode, when reassigning, or when no parent is linked in edit mode */}
                        {(mode === 'create' || showParentReassign || (mode === 'update' && student && !student.parent)) && (
                        <div className="space-y-6">
                            {/* Cancel Reassignment Button (Edit Mode Only) */}
                            {mode === 'update' && showParentReassign && originalParentId && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowParentReassign(false);
                                            setSelectedParentId(originalParentId);
                                            setParentSearchInput('');
                                            setShowParentDropdown(false);
                                        }}
                                        className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                                    >
                                        Cancel Reassignment
                                    </button>
                                </div>
                            )}

                            {/* Radio Button Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Parent Linking Mode
                                </label>
                                <div className="flex gap-6">
                                    {/* Link Existing Parent */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="parentMode"
                                            value="link"
                                            checked={parentMode === 'link'}
                                            onChange={() => {
                                                setParentMode('link');
                                                setParentSearchInput('');
                                                setShowParentDropdown(false);
                                            }}
                                            className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Link Existing Parent</span>
                                    </label>

                                    {/* Create New Parent */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="parentMode"
                                            value="create"
                                            checked={parentMode === 'create'}
                                            onChange={() => {
                                                setParentMode('create');
                                                setParentSearchInput('');
                                                setShowParentDropdown(false);
                                            }}
                                            className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Create New Parent</span>
                                    </label>
                                </div>
                            </div>

                            {/* Link Existing Parent Mode */}
                            {parentMode === 'link' && (
                                <div className="space-y-4">
                                    {/* Autocomplete Dropdown */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Search and Select Parent *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search by name or email..."
                                                value={parentSearchInput}
                                                onChange={(e) => {
                                                    setParentSearchInput(e.target.value);
                                                    setShowParentDropdown(true);
                                                }}
                                                onFocus={() => setShowParentDropdown(true)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                                            />
                                            {parentSearchInput && (
                                                <button
                                                    type="button"
                                                    onClick={() => setParentSearchInput('')}
                                                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        {/* Dropdown Menu */}
                                        {showParentDropdown && getFilteredParents().length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                                                {getFilteredParents().map((parent) => (
                                                    <button
                                                        key={parent.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedParentId(parent.id);
                                                            setParentSearchInput('');
                                                            setShowParentDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition"
                                                    >
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {parent.first_name} {parent.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {parent.email}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* No results message */}
                                        {showParentDropdown && parentSearchInput && getFilteredParents().length === 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 px-4 py-3">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    No parents found. Try creating a new one.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Parent Display Card */}
                                    {selectedParentId && getSelectedParent() && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                        Selected Parent
                                                    </h4>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="font-medium">Name:</span> {getSelectedParent().first_name} {getSelectedParent().last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="font-medium">Email:</span> {getSelectedParent().email}
                                                        </p>
                                                        {getSelectedParent().phone && (
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                <span className="font-medium">Phone:</span> {getSelectedParent().phone}
                                                            </p>
                                                        )}
                                                        {getSelectedParent().relation_type && (
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                <span className="font-medium">Relation:</span> {getSelectedParent().relation_type}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedParentId('')}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Create New Parent Mode */}
                            {parentMode === 'create' && (
                                <div>
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowParentModal(true)}
                                        type="button"
                                    >
                                        + Create New Parent
                                    </Button>

                                    {/* Selected Parent Display Card */}
                                    {selectedParentId && getSelectedParent() && (
                                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                        New Parent Created
                                                    </h4>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="font-medium">Name:</span> {getSelectedParent().first_name} {getSelectedParent().last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="font-medium">Email:</span> {getSelectedParent().email}
                                                        </p>
                                                        {getSelectedParent().phone && (
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                <span className="font-medium">Phone:</span> {getSelectedParent().phone}
                                                            </p>
                                                        )}
                                                        {getSelectedParent().relation_type && (
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                <span className="font-medium">Relation:</span> {getSelectedParent().relation_type}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedParentId('')}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                )}

                {/* Buttons */}
                {!isViewMode && (
                    <div className="flex gap-4 justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/students')}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Student' : 'Update Student'}
                        </Button>
                    </div>
                )}
                {isViewMode && (
                    <div className="flex gap-4 justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/students')}
                        >
                            Back
                        </Button>
                    </div>
                )}
            </form>

            {/* Parent Creation Modal */}
            <Modal
                isOpen={showParentModal}
                onClose={() => setShowParentModal(false)}
                title="Create New Parent"
                size="xl"
                footer={
                    <div className="flex gap-4 justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setShowParentModal(false)}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            form="parent-form"
                        >
                            Create Parent
                        </Button>
                    </div>
                }
            >
                <ParentForm
                    mode="create"
                    isModal={true}
                    onSubmitSuccess={handleParentCreationSuccess}
                />
            </Modal>
        </div>
    );
};

export default StudentForm;
