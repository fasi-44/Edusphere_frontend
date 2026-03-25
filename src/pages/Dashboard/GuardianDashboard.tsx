/**
 * Guardian Dashboard
 * Parent/Guardian dashboard for monitoring child's progress
 */

import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Button } from '../../components';
import StatCard from '../../components/dashboard/StatCard';
import AreaChartWidget from '../../components/dashboard/AreaChartWidget';
import RecentActivityWidget, { IActivity } from '../../components/dashboard/RecentActivityWidget';
import QuickActionButton from '../../components/dashboard/QuickActionButton';
import { useAuth } from '../../hooks/useAuth';

// TODO: Replace with API call to dashboardService.getGuardianStats()
const mockGuardianStats = {
  total_children: 2,
  overall_attendance: 93,
  pending_fees: 15000,
  overall_performance: 'Very Good',
  recent_communications: 5,
  last_updated: new Date().toISOString(),
};

const mockChildrenProgress = [
  { name: 'Child 1 - Math', value: 88 },
  { name: 'Child 1 - English', value: 92 },
  { name: 'Child 2 - Math', value: 85 },
  { name: 'Child 2 - Science', value: 90 },
];

const mockAttendanceTrend = [
  { name: 'Week 1', value: 85 },
  { name: 'Week 2', value: 90 },
  { name: 'Week 3', value: 92 },
  { name: 'Week 4', value: 93 },
];

const mockRecentActivities: IActivity[] = [
  {
    id: '1',
    title: 'Assignment Submitted',
    description: 'Child 1 submitted Mathematics assignment',
    type: 'success',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    icon: '✅',
  },
  {
    id: '2',
    title: 'Report Card Released',
    description: 'Monthly report card available for viewing',
    type: 'success',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    icon: '📊',
  },
  {
    id: '3',
    title: 'Message from Teacher',
    description: 'Teacher appreciation message about progress',
    type: 'user',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    icon: '💬',
  },
  {
    id: '4',
    title: 'Fee Reminder',
    description: 'Monthly fees are due by end of month',
    type: 'alert',
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
    icon: '⚠️',
  },
];

const mockChildren = [
  {
    id: 1,
    name: 'John Doe',
    class: '10-A',
    avgGrade: 'A',
    attendance: 94,
  },
  {
    id: 2,
    name: 'Jane Doe',
    class: '9-B',
    avgGrade: 'A-',
    attendance: 92,
  },
];

const GuardianDashboard: FC = () => {
  useAuth();
  const [stats, setStats] = useState(mockGuardianStats);
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setStats(mockGuardianStats);
    } catch (err: any) {
      setError(err?.message || 'Failed to load stats');
      toast.error(err?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button variant="danger" onClick={fetchStats}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Guardian Dashboard"
        subtitle="Monitor your child's progress and communications"
        actions={
          <Button variant="primary" onClick={fetchStats}>
            🔄 Refresh
          </Button>
        }
      />

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Children Enrolled"
          value={stats.total_children}
          change={0}
          changeType="increase"
          icon="👨‍👩‍👧‍👦"
        />
        <StatCard
          title="Overall Attendance"
          value={`${stats.overall_attendance}%`}
          change={3}
          changeType="increase"
          icon="✅"
        />
        <StatCard
          title="Pending Fees"
          value={`₹${(stats.pending_fees / 1000).toFixed(0)}K`}
          change={-5}
          changeType="decrease"
          icon="💰"
        />
        <StatCard
          title="Recent Messages"
          value={stats.recent_communications}
          change={1}
          changeType="increase"
          icon="💬"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AreaChartWidget
          title="Children's Academic Performance"
          subtitle="Latest subject scores"
          data={mockChildrenProgress}
          color="blue"
        />
        <AreaChartWidget
          title="Attendance Trend"
          subtitle="Combined attendance over 4 weeks"
          data={mockAttendanceTrend}
          color="green"
        />
      </div>

      {/* Children Cards */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Children
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockChildren.map((child) => (
            <div
              key={child.id}
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {child.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Class: {child.class}
                  </p>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {child.avgGrade}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Attendance
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {child.attendance}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${child.attendance}%` }}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full mt-4"
                onClick={() => toast.success(`View ${child.name}'s progress`)}
              >
                View Progress
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickActionButton
            icon="📊"
            label="View Progress"
            variant="primary"
            onClick={() => toast.success('Navigate to Progress Report')}
          />
          <QuickActionButton
            icon="📅"
            label="Attendance"
            variant="success"
            onClick={() => toast.success('Navigate to Attendance')}
          />
          <QuickActionButton
            icon="💬"
            label="Message Teacher"
            variant="info"
            onClick={() => toast.success('Navigate to Messages')}
          />
          <QuickActionButton
            icon="💰"
            label="Manage Fees"
            variant="warning"
            onClick={() => toast.success('Navigate to Fees')}
          />
          <QuickActionButton
            icon="📚"
            label="Course Materials"
            variant="primary"
            onClick={() => toast.success('Navigate to Materials')}
          />
          <QuickActionButton
            icon="📋"
            label="Documents"
            variant="success"
            onClick={() => toast.success('Navigate to Documents')}
          />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityWidget activities={mockRecentActivities} maxItems={4} />
        </div>

        {/* Guardian Summary */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Summary
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Avg Attendance</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats.overall_attendance}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Overall Performance</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.overall_performance}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Pending Fees</span>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                ₹{(stats.pending_fees / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">New Messages</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {stats.recent_communications}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <p>Last updated: {new Date(stats.last_updated).toLocaleString()}</p>
        <Button variant="ghost" size="sm" onClick={fetchStats}>
          Auto-refresh in 30s
        </Button>
      </div>
    </div>
  );
};

export default GuardianDashboard;