import { FC, lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/common';

// Lazy load dashboards for better performance
const SuperAdminDashboard = lazy(() => import('./SuperAdminDashboard'));
const AdministratorDashboard = lazy(() => import('./AdministratorDashboard'));
const EducatorDashboard = lazy(() => import('./EducatorDashboard'));
const LearnerDashboard = lazy(() => import('./LearnerDashboard'));
const GuardianDashboard = lazy(() => import('./GuardianDashboard'));

const LoadingDashboard: FC = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
    </div>
);

const DashboardRouter: FC = () => {
    const { user, loading } = useAuth();

    if (loading || !user) {
        return <LoadingDashboard />;
    }

    const getDashboard = () => {
        switch (user.role) {
            case UserRole.SUPER_ADMIN:
                return (
                    <Suspense fallback={<LoadingDashboard />}>
                        <SuperAdminDashboard />
                    </Suspense>
                );

            case UserRole.SCHOOL_ADMIN:
                return (
                    <Suspense fallback={<LoadingDashboard />}>
                        <AdministratorDashboard />
                    </Suspense>
                );

            case UserRole.PRINCIPAL:
                // Principal can access administrator dashboard
                return (
                    <Suspense fallback={<LoadingDashboard />}>
                        <AdministratorDashboard />
                    </Suspense>
                );

            case UserRole.TEACHER:
                return (
                    <Suspense fallback={<LoadingDashboard />}>
                        <EducatorDashboard />
                    </Suspense>
                );

            case UserRole.STUDENT:
                return (
                    <Suspense fallback={<LoadingDashboard />}>
                        <LearnerDashboard />
                    </Suspense>
                );

            case UserRole.PARENT:
                return (
                    <Suspense fallback={<LoadingDashboard />}>
                        <GuardianDashboard />
                    </Suspense>
                );

            default:
                return (
                    <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-yellow-600 dark:text-yellow-400">
                            No dashboard available for your role: {user.role}
                        </p>
                    </div>
                );
        }
    };

    return <>{getDashboard()}</>;
};

export default DashboardRouter;
