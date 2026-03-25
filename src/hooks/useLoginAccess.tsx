import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Badge, Modal, ConfirmDialog } from '../components';
import { userService } from '../services/modules/userService';
import { getSchoolId } from '../services/api/client';
import { authService } from '../services/auth/authService';

interface UseLoginAccessOptions {
    onRefresh: () => void;
    onEdit: (user: any) => void;
}

const PROVISIONABLE_ROLES = ['STUDENT', 'PARENT'];

const getProvisionMissingFields = (user: any): string[] => {
    const missing: string[] = [];
    if (!user.username) missing.push('Username');
    if (!user.email) missing.push('Email');
    if (!user.first_name) missing.push('First Name');
    return missing;
};

export function useLoginAccess({ onRefresh, onEdit }: UseLoginAccessOptions) {
    // Login toggle state
    const [loginToggleConfirmOpen, setLoginToggleConfirmOpen] = useState(false);
    const [loginToggleUser, setLoginToggleUser] = useState<any>(null);
    const [loginToggleLoading, setLoginToggleLoading] = useState(false);

    // Provision login modal state
    const [provisionModalOpen, setProvisionModalOpen] = useState(false);
    const [provisionUser, setProvisionUser] = useState<any>(null);
    const [provisionPassword, setProvisionPassword] = useState('');
    const [provisionShowPassword, setProvisionShowPassword] = useState(false);
    const [provisionLoading, setProvisionLoading] = useState(false);

    const handleLoginToggle = (user: any) => {
        if (!user.main_user_id) return;
        setLoginToggleUser(user);
        setLoginToggleConfirmOpen(true);
    };

    const handleConfirmLoginToggle = async () => {
        if (!loginToggleUser) return;
        try {
            setLoginToggleLoading(true);
            if (loginToggleUser.login_active) {
                await userService.deactivateUser(loginToggleUser.main_user_id);
                toast.success(`Login disabled for ${loginToggleUser.full_name}`);
            } else {
                await userService.activateUser(loginToggleUser.main_user_id);
                toast.success(`Login enabled for ${loginToggleUser.full_name}`);
            }
            setLoginToggleConfirmOpen(false);
            setLoginToggleUser(null);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update login access');
        } finally {
            setLoginToggleLoading(false);
        }
    };

    const handleProvisionLogin = (user: any) => {
        setProvisionUser(user);
        setProvisionPassword('');
        setProvisionShowPassword(false);
        setProvisionModalOpen(true);
    };

    const handleConfirmProvisionLogin = async () => {
        if (!provisionUser || !provisionPassword) return;
        if (provisionPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        try {
            setProvisionLoading(true);
            const skid = getSchoolId();
            const storedUser = authService.getStoredUser();
            const schoolId = storedUser?.school_id;
            await userService.provisionLogin({
                school_user_id: provisionUser.id,
                skid,
                school_id: schoolId,
                password: provisionPassword,
            });
            toast.success(`Login created for ${provisionUser.full_name || 'user'}`);
            setProvisionModalOpen(false);
            setProvisionUser(null);
            setProvisionPassword('');
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || 'Failed to create login');
        } finally {
            setProvisionLoading(false);
        }
    };

    // Column render function
    const renderLoginAccessCell = (value: any, row: any) => {
        if (!value) {
            const roleCode = row.role?.role_code?.toUpperCase();
            if (PROVISIONABLE_ROLES.includes(roleCode)) {
                const missingFields = getProvisionMissingFields(row);
                if (missingFields.length > 0) {
                    return (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 cursor-pointer transition-colors"
                            title={`Missing: ${missingFields.join(', ')}. Click to edit.`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Update Required
                        </button>
                    );
                }
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleProvisionLogin(row); }}
                        className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                        title="Click to create login access"
                    >
                        + Create Login
                    </button>
                );
            }
            return (
                <span className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    No Login
                </span>
            );
        }
        const isActive = row.login_active;
        return (
            <button
                onClick={(e) => { e.stopPropagation(); handleLoginToggle(row); }}
                className="flex items-center gap-2 cursor-pointer"
                title={isActive ? 'Click to restrict login' : 'Click to allow login'}
            >
                <div className="relative">
                    <div className={`block h-6 w-11 rounded-full transition-colors duration-200 ${isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isActive ? 'Enabled' : 'Disabled'}
                </span>
            </button>
        );
    };

    // Column definition object
    const loginAccessColumn = {
        key: 'has_login',
        label: 'Login Access',
        render: renderLoginAccessCell,
    };

    // Modals JSX
    const renderLoginAccessModals = () => (
        <>
            <ConfirmDialog
                isOpen={loginToggleConfirmOpen}
                title={loginToggleUser?.login_active ? 'Disable Login Access' : 'Enable Login Access'}
                message={loginToggleUser?.login_active
                    ? `Are you sure you want to disable login for "${loginToggleUser?.full_name}"? They will not be able to log in.`
                    : `Are you sure you want to enable login for "${loginToggleUser?.full_name}"?`
                }
                type={loginToggleUser?.login_active ? 'warning' : 'info'}
                confirmText={loginToggleUser?.login_active ? 'Yes, Disable' : 'Yes, Enable'}
                cancelText="Cancel"
                isLoading={loginToggleLoading}
                onConfirm={handleConfirmLoginToggle}
                onCancel={() => { setLoginToggleConfirmOpen(false); setLoginToggleUser(null); }}
            />

            <Modal
                isOpen={provisionModalOpen}
                onClose={() => { setProvisionModalOpen(false); setProvisionUser(null); setProvisionPassword(''); }}
                title="Create Login Access"
                size="md"
                footer={
                    provisionUser && getProvisionMissingFields(provisionUser).length > 0 ? (
                        <div className="flex justify-between">
                            <Button variant="secondary" onClick={() => { setProvisionModalOpen(false); setProvisionUser(null); }}>Cancel</Button>
                            <Button variant="primary" onClick={() => { setProvisionModalOpen(false); onEdit(provisionUser); }}>Edit User</Button>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => { setProvisionModalOpen(false); setProvisionUser(null); setProvisionPassword(''); }} disabled={provisionLoading}>Cancel</Button>
                            <Button variant="primary" onClick={handleConfirmProvisionLogin} disabled={provisionLoading || provisionPassword.length < 8} isLoading={provisionLoading} loadingText="Creating...">Create Login</Button>
                        </div>
                    )
                }
            >
                {provisionUser && getProvisionMissingFields(provisionUser).length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Required data is missing for this user</p>
                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Please update the following fields before creating login access:</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User</label>
                            <p className="text-gray-900 dark:text-white font-medium">{provisionUser?.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Missing Fields</label>
                            <div className="flex flex-wrap gap-2">
                                {getProvisionMissingFields(provisionUser).map((field) => (
                                    <span key={field} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Set a password for this user to enable login</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <p className="text-gray-900 dark:text-white font-medium">{provisionUser?.full_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <p className="text-gray-600 dark:text-gray-400">{provisionUser?.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                <p className="text-gray-600 dark:text-gray-400">{provisionUser?.username}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <Badge variant="secondary">{provisionUser?.role?.role_name || 'Unknown'}</Badge>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                                <div className="relative">
                                    <input
                                        type={provisionShowPassword ? 'text' : 'password'}
                                        value={provisionPassword}
                                        onChange={(e) => setProvisionPassword(e.target.value)}
                                        placeholder="Minimum 8 characters"
                                        autoComplete="new-password"
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setProvisionShowPassword(!provisionShowPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        {provisionShowPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {provisionPassword.length > 0 && provisionPassword.length < 8 && (
                                    <p className="text-red-500 text-sm mt-1">Password must be at least 8 characters</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </Modal>
        </>
    );

    return {
        loginAccessColumn,
        renderLoginAccessModals,
    };
}
