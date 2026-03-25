/**
 * PermissionGuard
 * Wraps route elements and redirects to /dashboard if the user lacks permission.
 * Acts as a safety net — the sidebar already hides items the user can't access,
 * but this prevents direct URL navigation to restricted routes.
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  /** Required permission key. Ignored if superAdminOnly is true. */
  permission?: Permission;
  /** Access granted if user has ANY of these permissions (OR logic) */
  anyPermission?: Permission[];
  /** If true, only SUPER_ADMIN can access this route. */
  superAdminOnly?: boolean;
}

export const PermissionGuard = ({
  children,
  permission,
  anyPermission,
  superAdminOnly,
}: PermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();

  if (superAdminOnly) {
    if (!isSuperAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  if (anyPermission && anyPermission.length > 0 && !hasAnyPermission(anyPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
