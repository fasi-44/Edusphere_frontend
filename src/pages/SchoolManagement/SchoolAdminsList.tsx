/**
 * School Admins List Page
 * Manage school administrators with edit, password change, and delete functionality
 */

import { FC, useEffect, useState } from 'react';
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

const SchoolAdminsList: FC = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

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
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await schoolService.listSchoolAdmins();
      const admins = response.data.map((admin: any, index: number) => ({
        ...admin,
        key: admin.id,
        slNo: index + 1,
      }));
      setRows(admins);
    } catch (error: any) {
      console.error('Error fetching school admins:', error);
      toast.error('Failed to fetch school admins');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin: any) => {
    const schoolObj = {
      id: admin.school_id,
      name: admin.school_name,
      code: admin.school_code,
      skid: admin.skid,
      school_admin_id: admin.id,
    };
    setSelectedSchool(schoolObj);
    setEditDialogOpen(true);
    setShowActionsMenu(null);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedSchool(null);
    fetchAdmins();
  };

  const handleChangePassword = (admin: any) => {
    setSelectedAdmin(admin);
    setPasswordDialogOpen(true);
    setNewPassword('');
    setShowPassword(false);
    setShowActionsMenu(null);
  };

  const handleConfirmPasswordChange = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await schoolService.changeAdminPassword(selectedAdmin.id, newPassword);
      toast.success('Password changed successfully!');
      setPasswordDialogOpen(false);
      setNewPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewPassword(password);
    setShowPassword(true);
  };

  const handleDelete = (admin: any) => {
    setSelectedAdmin(admin);
    setDeleteConfirmOpen(true);
    setShowActionsMenu(null);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      toast.success('School admin deleted successfully!');
      setDeleteConfirmOpen(false);
      fetchAdmins();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete admin.');
    } finally {
      setLoading(false);
    }
  };

  const columns: IColumn[] = [
    {
      key: 'slNo',
      label: 'Sl. No',
      width: 80,
    },
    {
      key: 'first_name',
      label: 'Name',
      width: 150,
      render: (_, row) => (
        <span className="font-medium text-gray-900 dark:text-white truncate">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      width: 130,
    },
    {
      key: 'email',
      label: 'Email',
      width: 180,
    },
    {
      key: 'phone',
      label: 'Phone',
      width: 130,
    },
    {
      key: 'school_name',
      label: 'School',
      width: 160,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white truncate">{value}</div>
          {row.school_code && row.school_code !== '-' && (
            <Badge variant="info">{row.school_code}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      width: 120,
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (loading && rows.length === 0) {
    return <LoadingSpinner fullHeight message="Loading school admins..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Administrators"
        subtitle="Manage school admin users and their access"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'School Admins', href: '#' },
        ]}
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
              Edit Details
            </button>
            <button
              onClick={() => handleChangePassword(rows.find(r => r.id === showActionsMenu))}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
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

      {/* Edit School Admin Modal */}
      <Modal
        isOpen={editDialogOpen}
        onClose={handleEditClose}
        title={`Edit School Admin for "${selectedSchool?.name}"`}
        size="lg"
      >
        {selectedSchool && <SchoolAdminForm school={selectedSchool} onClose={handleEditClose} />}
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        title={`Change Password for ${selectedAdmin?.first_name} ${selectedAdmin?.last_name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
              Must be at least 8 characters long
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={generateRandomPassword}
            fullWidth
          >
            Generate Random Password
          </Button>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmPasswordChange}
              disabled={!newPassword || newPassword.length < 8 || loading}
              isLoading={loading}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete School Admin"
        message={`Are you sure you want to delete ${selectedAdmin?.first_name} ${selectedAdmin?.last_name}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default SchoolAdminsList;
