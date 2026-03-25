/**
 * User Detail Page
 * View detailed information about a specific user
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
  PageHeader,
  Button,
  Badge,
  LoadingSpinner,
  EmptyState,
  Modal,
} from '../../components';
import { userService } from '../../services/modules/userService';
import { IUser } from '../../types/index';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';

const UserDetail: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = usePermissions();

  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          const user = await userService.getById(id);
          setSelectedUser(user);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch user');
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (!selectedUser) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this user? This action cannot be undone.'
    );

    if (confirmed) {
      try {
        await userService.delete(selectedUser.id);
        toast.success('User deleted successfully');
        setTimeout(() => navigate('/users'), 1500);
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete user');
      }
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please enter both passwords');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setResettingPassword(true);
    try {
      if (selectedUser) {
        await userService.resetPassword(selectedUser.id, newPassword);
        toast.success('Password reset successfully');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      SUPER_ADMIN: 'danger',
      SCHOOL_ADMIN: 'warning',
      PRINCIPAL: 'info',
      TEACHER: 'primary',
      STUDENT: 'success',
      PARENT: 'primary',
    };
    return variants[role] || 'primary';
  };

  // Format role name
  const formatRoleName = (role: string) => {
    return role.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // Show loading spinner
  if (loading && !selectedUser) {
    return <LoadingSpinner fullHeight message="Loading user details..." />;
  }

  // Show error message
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Details"
          subtitle="View user information"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Users', href: '/users' },
            { label: 'Details', href: '#' },
          ]}
        />
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state if no user found
  if (!selectedUser) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Details"
          subtitle="View user information"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Users', href: '/users' },
            { label: 'Details', href: '#' },
          ]}
        />
        <EmptyState
          icon="👤"
          title="User Not Found"
          description="The user you're looking for doesn't exist or has been deleted."
          action={
            <Button variant="secondary" onClick={() => navigate('/users')}>
              Back to Users
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={selectedUser.name}
        subtitle="View and manage user information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/users' },
          { label: selectedUser.name, href: '#' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {hasPermission(Permission.MANAGE_USERS) && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/users/${selectedUser.id}/edit`)}
              >
                Edit User
              </Button>
            )}
            {hasPermission(Permission.MANAGE_USERS) && (
              <Button
                variant="warning"
                onClick={() => setShowPasswordModal(true)}
              >
                Reset Password
              </Button>
            )}
            {hasPermission(Permission.DELETE_USERS) && (
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Delete User
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              {/* Name and Status */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser.name}
                  </p>
                </div>
                <Badge
                  variant={selectedUser.status === 'active' ? 'success' : 'warning'}
                  text={selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                />
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white font-medium break-all">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedUser.phone || '-'}</p>
                </div>
              </div>

              {/* Role */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                <div className="mt-2">
                  <Badge
                    variant={getRoleBadgeVariant(selectedUser.role)}
                    text={formatRoleName(selectedUser.role)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                <div className="text-2xl mb-2">📊</div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">View Activity</span>
              </button>
              <button className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                <div className="text-2xl mb-2">💬</div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Send Message</span>
              </button>
              <button className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                <div className="text-2xl mb-2">📋</div>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-400">View History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">User ID</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{selectedUser.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Created At</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {(selectedUser.created_at || selectedUser.createdAt)
                    ? new Date(selectedUser.created_at || selectedUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Last Updated</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {(selectedUser.updated_at || selectedUser.updatedAt)
                    ? new Date(selectedUser.updated_at ?? selectedUser.updatedAt ?? '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className={`p-6 rounded-lg border ${selectedUser.status === 'active'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
            <p className={`text-sm font-medium ${selectedUser.status === 'active'
                ? 'text-green-700 dark:text-green-400'
                : 'text-yellow-700 dark:text-yellow-400'
              }`}>
              {selectedUser.status === 'active'
                ? '✅ User account is active'
                : '⚠️ User account is inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Reset Password"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Enter a new password for <strong>{selectedUser.name}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
              disabled={resettingPassword}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResetPassword}
              isLoading={resettingPassword}
              loadingText="Resetting..."
            >
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetail;
