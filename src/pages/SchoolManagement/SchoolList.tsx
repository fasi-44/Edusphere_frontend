/**
 * School List Page
 * Display and manage schools with status toggle, edit, assign admin, and delete
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, DataTable, Button, Modal, ConfirmDialog, Badge } from '../../components';
import { schoolService } from '../../services/modules/schoolService';
import SchoolAdminForm from './schoolAdminForm';

interface IColumn {
    key: string;
    label: string;
    width?: number;
    render?: (value: any, row: any) => React.ReactNode;
}

const SchoolList: FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [assignAdminOpen, setAssignAdminOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [statusAction, setStatusAction] = useState<string | null>(null);
    const [schoolForAdmin, setSchoolForAdmin] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

    const handleMenuClick = (event: React.MouseEvent, rowId: string) => {
        const button = event.currentTarget as HTMLButtonElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
        setShowActionsMenu(showActionsMenu === rowId ? null : rowId);
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            setLoading(true);
            const response = await schoolService.listSchools();
            const schools = response.data.map((school: any, index: number) => ({
                ...school,
                key: school.id,
                slNo: index + 1,
            }));
            setRows(schools);
        } catch (error) {
            console.error('Error fetching schools:', error);
            toast.error('Failed to fetch schools');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (school: any) => {
        setShowActionsMenu(null);
        navigate('/schools/' + school.id + '/edit', { state: { school, mode: 'update' } });
    };

    const handleStatusToggle = (school: any) => {
        setSelectedSchool(school);
        setStatusAction(school.is_active ? 'deactivate' : 'activate');
        setConfirmOpen(true);
        setShowActionsMenu(null);
    };

    const handleConfirmStatusChange = async () => {
        try {
            setLoading(true);
            if (statusAction === 'deactivate') {
                await schoolService.deactivateSchool(selectedSchool.id);
            } else {
                await schoolService.activateSchool(selectedSchool.id);
            }
            toast.success(`School ${statusAction}d successfully!`);
            fetchSchools();
            setConfirmOpen(false);
        } catch (err: any) {
            toast.error(err.message || `Failed to ${statusAction} school.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (school: any) => {
        setSelectedSchool(school);
        setDeleteConfirmOpen(true);
        setShowActionsMenu(null);
    };

    const handleConfirmDelete = async () => {
        try {
            setLoading(true);
            await schoolService.deleteSchool(selectedSchool.id);
            toast.success('School deleted successfully!');
            fetchSchools();
            setDeleteConfirmOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete school.');
        } finally {
            setLoading(false);
        }
    };

    const openAssignAdminModal = (school: any) => {
        // Always open in create mode - strip school_admin_id so the form creates a new admin
        const { school_admin_id, ...schoolWithoutAdmin } = school;
        setSchoolForAdmin(schoolWithoutAdmin);
        setAssignAdminOpen(true);
        setShowActionsMenu(null);
    };

    const columns: IColumn[] = [
        {
            key: 'slNo',
            label: 'Sl. No',
            // width: 70,
        },
        {
            key: 'name',
            label: 'School Name',
            // width: 220,
            render: (value) => <span className="font-medium text-gray-900 dark:text-white truncate">{value}</span>,
        },
        {
            key: 'code',
            label: 'Code',
            // width: 90,
            render: (value) => <Badge variant="secondary">{value}</Badge>,
        },
        {
            key: 'city',
            label: 'City',
            // width: 110,
        },
        {
            key: 'phone',
            label: 'Phone',
            // width: 130,
        },
        {
            key: 'plan',
            label: 'Plan',
            // width: 100,
            render: (value) => {
                const colors: Record<string, string> = {
                    PREMIUM: 'warning',
                    STANDARD: 'info',
                    BASIC: 'secondary',
                };
                return <Badge variant={colors[value] as any}>{value}</Badge>;
            },
        },
        {
            key: 'is_active',
            label: 'Status',
            // width: 120,
            render: (value, row) => (
                <button
                    onClick={() => handleStatusToggle(row)}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    {/* Toggle Switch */}
                    <div className="relative">
                        <div
                            className={`block h-6 w-11 rounded-full transition-colors duration-200 ${
                                value
                                    ? 'bg-green-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                        />
                        <div
                            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                value ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </div>
                    <span className={`text-sm font-medium whitespace-nowrap ${
                        value
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                    }`}>
                        {value ? 'Active' : 'Inactive'}
                    </span>
                </button>
            ),
        },
    ];

    if (loading && rows.length === 0) {
        return <LoadingSpinner fullHeight message="Loading schools..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="School Management"
                subtitle="Manage schools and view their details"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Schools', href: '#' },
                ]}
                actions={
                    <Button
                        variant="primary"
                        onClick={() => navigate('/schools/new')}
                    >
                        + Create School
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={rows}
                loading={loading}
                pagination={{
                    page: currentPage,
                    pageSize: pageSize,
                    total: rows.length,
                    onPageChange: setCurrentPage,
                }}
                actions={(row) => (
                    <button
                        onClick={(e) => handleMenuClick(e, row.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    </button>
                )}
            />

            {/* Fixed Actions Menu */}
            {showActionsMenu && (
                <>
                    {/* Backdrop to close menu */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowActionsMenu(null)}
                    />

                    {/* Menu */}
                    <div
                        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        style={{
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
                        }}
                    >
                        <button
                            onClick={() => handleEdit(rows.find(r => r.id === showActionsMenu))}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 first:rounded-t-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            onClick={() => openAssignAdminModal(rows.find(r => r.id === showActionsMenu))}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Assign Admin
                        </button>
                        <button
                            onClick={() => handleDelete(rows.find(r => r.id === showActionsMenu))}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 last:rounded-b-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </>
            )}

            {/* Status Change Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmOpen}
                title={`Confirm ${statusAction === 'deactivate' ? 'Deactivation' : 'Activation'}`}
                message={`Are you sure you want to ${statusAction} the school "${selectedSchool?.name}"?${statusAction === 'deactivate' ? ' Users from this school will not be able to log in.' : ''}`}
                type={statusAction === 'deactivate' ? 'warning' : 'info'}
                confirmText={statusAction === 'deactivate' ? 'Deactivate' : 'Activate'}
                cancelText="Cancel"
                isLoading={loading}
                onConfirm={handleConfirmStatusChange}
                onCancel={() => setConfirmOpen(false)}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                title="Delete School - CRITICAL ACTION"
                message={`This will permanently delete the school "${selectedSchool?.name}" including all users, dedicated database, and academic data. This action cannot be undone.`}
                type="danger"
                confirmText="Yes, Permanently Delete"
                cancelText="Cancel"
                isLoading={loading}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmOpen(false)}
            />

            {/* Assign Admin Modal */}
            <Modal
                isOpen={assignAdminOpen}
                onClose={() => {
                    setAssignAdminOpen(false);
                    fetchSchools();
                }}
                title={`Assign School Admin to "${schoolForAdmin?.name}"`}
                size="lg"
            >
                {schoolForAdmin && (
                    <SchoolAdminForm
                        school={schoolForAdmin}
                        onClose={() => {
                            setAssignAdminOpen(false);
                            fetchSchools();
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default SchoolList;
