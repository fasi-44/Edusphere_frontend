import { FC, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { Button, PageHeader } from '../../components';
import { classService } from '../../services/modules/classService';
import { studentService } from '../../services/modules/studentService';
import StudentForm from './StudentForm';

interface ILocalClass {
    id: string | number;
    name?: string;
    class_name?: string;
    class_code?: string;
    sections?: { id: string | number; name: string }[];
}

/**
 * Simple CSV parser without external dependencies
 */
function parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim());

    // Parse rows
    const data = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    });

    return data;
}

/**
 * Generate sample CSV content
 */
function generateSampleCSV(): string {
    const headers = ['username', 'first_name', 'last_name', 'email', 'phone', 'gender', 'date_of_birth', 'address', 'roll_no', 'admission_date'];
    const rows = [
        headers.join(','),
        'student001,John,Doe,john.doe@example.com,9876543210,Male,2008-01-15,123 Main St,1,2024-01-15',
        'student002,Jane,Smith,jane.smith@example.com,9876543211,Female,2008-03-20,456 Oak Ave,2,2024-01-15',
        'student003,Michael,Brown,michael.brown@example.com,9876543212,Male,2008-05-10,789 Pine Rd,3,2024-01-15',
    ];
    return rows.join('\n');
}

/**
 * Download sample CSV file
 */
function downloadSampleCSV() {
    const csvContent = generateSampleCSV();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', 'student_sample.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * CSV Dropzone Component
 */
interface CSVDropzoneProps {
    csvFile: File | null;
    onFileAccepted: (file: File) => void;
}

const CSVDropzone: FC<CSVDropzoneProps> = ({ csvFile, onFileAccepted }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv'],
        },
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                onFileAccepted(acceptedFiles[0]);
            }
        },
    });

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                CSV File *
            </label>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : csvFile
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="text-gray-600 dark:text-gray-400">
                    {csvFile ? (
                        <div>
                            <p className="font-medium text-green-600 dark:text-green-400">
                                ✓ {csvFile.name}
                            </p>
                            <p className="text-sm mt-1">Drag to replace or click to select another file</p>
                        </div>
                    ) : isDragActive ? (
                        <div>
                            <p className="font-medium text-blue-600 dark:text-blue-400">Drop your CSV file here</p>
                        </div>
                    ) : (
                        <div>
                            <p className="font-medium">Drag and drop your CSV file here</p>
                            <p className="text-sm mt-1">or click to select a file</p>
                        </div>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={downloadSampleCSV}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
                📥 Download Sample CSV
            </button>
        </div>
    );
};


// Bulk Student Create
const StudentCreate: FC = () => {
    const navigate = useNavigate();
    const [createMode, setCreateMode] = useState<'single' | 'bulk'>('single');
    const [classes, setClasses] = useState<ILocalClass[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk import form state
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [defaultPassword, setDefaultPassword] = useState('Admin@123');
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Fetch classes on component mount
    useEffect(() => {
        fetchClasses();
    }, []);

    // Fetch sections when class is selected
    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await classService.list();
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchSections = async (classId: string) => {
        try {
            const sectionsData = await classService.getSections(classId);
            setSections(sectionsData);
            setSelectedSection('');
        } catch (error) {
            console.error('Error fetching sections:', error);
            toast.error('Failed to fetch sections');
        }
    };

    const handlePreviewCSV = () => {
        if (!csvFile) {
            toast.error('Please select a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target?.result as string;
                const data = parseCSV(csvText);
                if (data.length === 0) {
                    toast.error('CSV file is empty');
                    return;
                }
                setPreviewData(data.slice(0, 5));
                setShowPreview(true);
            } catch (error: any) {
                toast.error(`Error parsing CSV: ${error.message}`);
            }
        };
        reader.readAsText(csvFile);
    };

    const handleBulkImport = async () => {
        if (!csvFile) {
            toast.error('Please select a CSV file');
            return;
        }

        if (!selectedClass) {
            toast.error('Please select a class');
            return;
        }

        try {
            setIsSubmitting(true);

            // Parse the CSV file
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const csvText = e.target?.result as string;
                    const parsedData = parseCSV(csvText);

                    if (parsedData.length === 0) {
                        toast.error('CSV file is empty');
                        setIsSubmitting(false);
                        return;
                    }

                    // Transform CSV data to student format
                    const studentsData = parsedData.map((row: any) => ({
                        username: row.username || '',
                        first_name: row.first_name || '',
                        last_name: row.last_name || '',
                        email: row.email || '',
                        phone: row.phone || '',
                        gender: row.gender || '',
                        date_of_birth: row.date_of_birth || '',
                        address: row.address || '',
                        roll_no: row.roll_no || '',
                        admission_date: row.admission_date || '',
                        class_id: selectedClass,
                        section_id: selectedSection || '',
                        has_login: true,
                        is_active: true,
                    }));

                    const result = await studentService.bulkCreate(
                        studentsData,
                        defaultPassword
                    );

                    toast.success(
                        `Bulk import completed. ${result.successful || 0} successful, ${result.failed || 0} failed.`
                    );

                    // Reset form
                    setCsvFile(null);
                    setPreviewData([]);
                    setShowPreview(false);
                    setSelectedClass('');
                    setSelectedSection('');

                    // Navigate back to students list after a short delay
                    setTimeout(() => {
                        navigate('/students');
                    }, 1500);
                } catch (error: any) {
                    toast.error(error.message || 'Failed to bulk import students');
                } finally {
                    setIsSubmitting(false);
                }
            };
            reader.onerror = () => {
                toast.error('Error reading file');
                setIsSubmitting(false);
            };
            reader.readAsText(csvFile);
        } catch (error: any) {
            toast.error(error.message || 'Failed to bulk import students');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Student"
                subtitle="Choose how to add students"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Students', href: '/students' },
                    { label: 'Create', href: '#' },
                ]}
            />

            {/* Mode Selection Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setCreateMode('single')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${createMode === 'single'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        Single Create
                    </button>
                    <button
                        onClick={() => setCreateMode('bulk')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${createMode === 'bulk'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        Bulk Import
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {createMode === 'single' ? (
                        <StudentForm mode="create" />
                    ) : (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Bulk Import Students
                            </h3>

                            {/* Class and Section Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Class Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Class *
                                    </label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.class_name || cls.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Section Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Section
                                    </label>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        disabled={!selectedClass || isSubmitting}
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

                            {/* Default Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Default Password for All Students
                                </label>
                                <input
                                    type="text"
                                    value={defaultPassword}
                                    onChange={(e) => setDefaultPassword(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                    placeholder="Enter default password"
                                />
                            </div>

                            {/* CSV File Upload with Dropzone */}
                            <CSVDropzone
                                csvFile={csvFile}
                                onFileAccepted={(file) => {
                                    setCsvFile(file);
                                    setPreviewData([]);
                                    setShowPreview(false);
                                }}
                            />

                            {/* CSV Template Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                    CSV File Format
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                                    Your CSV file should have the following columns (in any order):
                                </p>
                                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                    <p>• username (required)</p>
                                    <p>• first_name (required)</p>
                                    <p>• last_name (required)</p>
                                    <p>• email (required)</p>
                                    <p>• phone (required)</p>
                                    <p>• gender (optional)</p>
                                    <p>• date_of_birth (optional, format: YYYY-MM-DD)</p>
                                    <p>• address (optional)</p>
                                    <p>• roll_no (optional)</p>
                                    <p>• admission_date (optional, format: YYYY-MM-DD)</p>
                                </div>
                            </div>

                            {/* Preview Button */}
                            {csvFile && (
                                <Button
                                    variant="secondary"
                                    onClick={handlePreviewCSV}
                                    disabled={isSubmitting}
                                >
                                    Preview CSV Data
                                </Button>
                            )}

                            {/* Data Preview */}
                            {showPreview && previewData.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 overflow-x-auto">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                                        Preview (showing {previewData.length} rows)
                                    </h4>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                                {Object.keys(previewData[0] || {}).map((key) => (
                                                    <th
                                                        key={key}
                                                        className="px-4 py-2 text-left text-gray-700 dark:text-gray-300"
                                                    >
                                                        {key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                >
                                                    {Object.values(row).map((value: any, colIdx) => (
                                                        <td
                                                            key={colIdx}
                                                            className="px-4 py-2 text-gray-700 dark:text-gray-300"
                                                        >
                                                            {value || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 justify-end">
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate('/students')}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleBulkImport}
                                    disabled={!csvFile || !selectedClass || isSubmitting}
                                >
                                    {isSubmitting ? 'Importing...' : 'Import Students'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentCreate;
