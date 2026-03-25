/**
 * usePermissions Hook
 * Core hook for permission-based access control.
 * SUPER_ADMIN and SCHOOL_ADMIN bypass all permission checks (full access).
 * All other roles are checked against user.role_obj.permissions.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '../types/common';
import { Permission } from '../config/permissions';

const FULL_ACCESS_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN];

export interface UsePermissionsReturn {
    /** True if user has the given permission (or is a full-access role) */
    hasPermission: (key: Permission) => boolean;
    /** True if user has ANY of the given permissions (or is a full-access role) */
    hasAnyPermission: (keys: Permission[]) => boolean;
    /** True for SUPER_ADMIN or SCHOOL_ADMIN */
    isFullAccess: boolean;
    /** True only for SUPER_ADMIN */
    isSuperAdmin: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
    const { user } = useAuth();

    const userPermissions = useMemo<Set<string>>(() => {
        const perms = user?.role_obj?.permissions;
        if (Array.isArray(perms)) {
            return new Set(perms);
        }
        return new Set();
    }, [user?.role_obj?.permissions]);

    const isFullAccess = useMemo(
        () => !!user?.role && FULL_ACCESS_ROLES.includes(user.role),
        [user?.role]
    );

    const isSuperAdmin = useMemo(
        () => user?.role === UserRole.SUPER_ADMIN,
        [user?.role]
    );

    const hasPermission = useCallback(
        (key: Permission): boolean => {
            if (isFullAccess) return true;
            return userPermissions.has(key);
        },
        [isFullAccess, userPermissions]
    );

    const hasAnyPermission = useCallback(
        (keys: Permission[]): boolean => {
            if (isFullAccess) return true;
            return keys.some((key) => userPermissions.has(key));
        },
        [isFullAccess, userPermissions]
    );

    return { hasPermission, hasAnyPermission, isFullAccess, isSuperAdmin };
};
