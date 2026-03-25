/**
 * System Admins List Page
 * Display and manage system administrators (super admins)
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, DataTable, Button, Modal, Badge } from '../../components';
import { schoolService } from '../../services/modules/schoolService';

interface IColumn {
  key: string;
  label: string;
  width?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

const SystemAdminsList: FC = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Create form state
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await schoolService.listSuperAdmins();
      const admins = response.data.map((admin: any, index: number) => ({
        ...admin,
        key: admin.id,
        slNo: index + 1,
      }));
      setRows(admins);
    } catch (error: any) {
      console.error('Error fetching system admins:', error);
      toast.error('Failed to fetch system admins');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ identifier: '', password: '' });
    setFormErrors({});
    setShowPassword(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.identifier.trim()) {
      errors.identifier = 'Email or username is required';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const identifier = formData.identifier.trim();
      const isEmail = identifier.includes('@');

      const payload: Record<string, string> = {
        password: formData.password,
      };

      if (isEmail) {
        payload.email = identifier;
        payload.username = identifier.split('@')[0];
      } else {
        payload.username = identifier;
      }

      await schoolService.createSuperAdmin(payload);
      toast.success('System admin created successfully');
      setCreateOpen(false);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      console.error('Error creating system admin:', error);
      toast.error(error.message || 'Failed to create system admin');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: IColumn[] = [
    {
      key: 'slNo',
      label: 'Sl. No',
      width: 80,
    },
    {
      key: 'username',
      label: 'Username',
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'full_name',
      label: 'Name',
      render: (value) => value || '-',
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value || '-',
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
    {
      key: 'created_at',
      label: 'Created',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ];

  if (loading && rows.length === 0) {
    return <LoadingSpinner fullHeight message="Loading system admins..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administrators"
        subtitle="Manage system admin accounts"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'System Admins', href: '#' },
        ]}
        actions={
          <Button variant="primary" onClick={() => { resetForm(); setCreateOpen(true); }}>
            + Create System Admin
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
      />

      {/* Create System Admin Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); resetForm(); }}
        title="Create System Admin"
        size="sm"
      >
        <div className="p-6 space-y-4">
          {/* Email or Username */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Email or Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => {
                setFormData({ ...formData, identifier: e.target.value });
                if (formErrors.identifier) {
                  setFormErrors((prev) => { const n = { ...prev }; delete n.identifier; return n; });
                }
              }}
              placeholder="Enter email address or username"
              className={`w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                formErrors.identifier ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {formErrors.identifier && (
              <p className="text-red-500 text-sm mt-1">{formErrors.identifier}</p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              If an email is provided, the username will be auto-generated from it
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (formErrors.password) {
                    setFormErrors((prev) => { const n = { ...prev }; delete n.password; return n; });
                  }
                }}
                placeholder="Enter password (min 8 characters)"
                className={`w-full px-4 py-2 pr-10 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M21 21l-4.878-4.878" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { setCreateOpen(false); resetForm(); }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SystemAdminsList;
