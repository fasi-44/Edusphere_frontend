/**
 * SuperAdmin Dashboard
 * System-wide statistics and management — powered by real API data
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button, Badge, LoadingSpinner } from '../../components';
import StatCard from '../../components/dashboard/StatCard';
import QuickActionButton from '../../components/dashboard/QuickActionButton';
import { dashboardService } from '../../services/dashboard/dashboardService';

interface DashboardStats {
  total_schools: number;
  active_schools: number;
  inactive_schools: number;
  total_users: number;
  active_users: number;
  total_super_admins: number;
  total_school_admins: number;
  plan_distribution: {
    BASIC: number;
    STANDARD: number;
    PREMIUM: number;
  };
  recent_schools: any[];
  recent_admins: any[];
}

const SuperAdminDashboard: FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getSuperAdminStats();
      setStats(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load dashboard stats';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullHeight message="Loading dashboard..." />;
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Failed to load data'}</p>
        <Button variant="danger" onClick={fetchStats}>
          Retry
        </Button>
      </div>
    );
  }

  const avgUsersPerSchool = stats.total_schools > 0
    ? Math.round(stats.total_users / stats.total_schools)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="System Dashboard"
        subtitle="Monitor entire system performance and institutions"
        actions={
          <Button variant="primary" onClick={fetchStats}>
            Refresh
          </Button>
        }
      />

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Schools"
          value={stats.total_schools}
          icon="🏫"
          color="blue"
        />
        <StatCard
          title="Active Schools"
          value={stats.active_schools}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Inactive Schools"
          value={stats.inactive_schools}
          icon="🚫"
          color="red"
        />
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon="👥"
          color="purple"
        />
        <StatCard
          title="Active Users"
          value={stats.active_users}
          icon="🟢"
          color="green"
        />
        <StatCard
          title="System Admins"
          value={stats.total_super_admins}
          icon="🛡️"
          color="yellow"
        />
        <StatCard
          title="School Admins"
          value={stats.total_school_admins}
          icon="👨‍💼"
          color="blue"
        />
        <StatCard
          title="Avg Users / School"
          value={avgUsersPerSchool}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Plan Distribution + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Subscription Plan Distribution
          </h2>
          <div className="space-y-4">
            {(['BASIC', 'STANDARD', 'PREMIUM'] as const).map((plan) => {
              const count = stats.plan_distribution[plan] || 0;
              const total = stats.active_schools || 1;
              const pct = Math.round((count / total) * 100);
              const colors = {
                BASIC: { bar: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400' },
                STANDARD: { bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
                PREMIUM: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
              };
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${colors[plan].text}`}>{plan}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {count} school{count !== 1 ? 's' : ''} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${colors[plan].bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <QuickActionButton
              icon="🏫"
              label="Add School"
              variant="primary"
              onClick={() => navigate('/schools/new')}
            />
            <QuickActionButton
              icon="📋"
              label="List Schools"
              variant="success"
              onClick={() => navigate('/schools')}
            />
            <QuickActionButton
              icon="👨‍💼"
              label="School Admins"
              variant="info"
              onClick={() => navigate('/school-admins')}
            />
            <QuickActionButton
              icon="🛡️"
              label="System Admins"
              variant="warning"
              onClick={() => navigate('/system-admins')}
            />
          </div>
        </div>
      </div>

      {/* Recent Schools + Recent Admins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Schools */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Schools
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/schools')}>
              View All
            </Button>
          </div>
          {stats.recent_schools.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No schools registered yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_schools.map((school: any) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {school.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{school.code}</Badge>
                      <Badge variant={school.is_active ? 'success' : 'danger'}>
                        {school.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {school.plan && (
                        <Badge variant="info">{school.plan}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {school.user_count || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">users</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Summary */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Summary
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Active Schools</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.active_schools}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Inactive Schools</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.inactive_schools}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Total Users</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats.total_users}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">System Admins</span>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {stats.total_super_admins}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">School Admins</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {stats.total_school_admins}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Avg Users / School</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {avgUsersPerSchool}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent School Admins */}
      {stats.recent_admins.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recently Added School Admins
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/school-admins')}>
              View All
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">School</th>
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_admins.map((admin: any) => (
                  <tr key={admin.id} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-2 px-3 text-gray-900 dark:text-white font-medium">
                      {admin.full_name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username}
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                      {admin.email}
                    </td>
                    <td className="py-2 px-3">
                      {admin.school_name ? (
                        <Badge variant="secondary">{admin.school_name}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={admin.is_active ? 'success' : 'danger'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end text-xs text-gray-500 dark:text-gray-400">
        <Button variant="ghost" size="sm" onClick={fetchStats}>
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
