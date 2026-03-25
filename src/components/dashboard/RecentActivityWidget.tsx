import React, { FC } from 'react';
import { Badge } from '../index';

export interface IActivity {
  id: string;
  title: string;
  description: string;
  type: 'user' | 'system' | 'alert' | 'success' | 'warning';
  timestamp: string;
  icon?: React.ReactNode;
}

interface IRecentActivityWidgetProps {
  activities: IActivity[];
  maxItems?: number;
  className?: string;
}

/**
 * RecentActivityWidget Component
 * Displays recent system activities
 * @component
 */
const RecentActivityWidget: FC<IRecentActivityWidgetProps> = ({
  activities,
  maxItems = 5,
  className = '',
}) => {
  const getActivityColor = (type: IActivity['type']) => {
    const colors = {
      user: 'primary' as const,
      system: 'secondary' as const,
      alert: 'danger' as const,
      success: 'success' as const,
      warning: 'warning' as const,
    };
    return colors[type];
  };

  const getActivityIcon = (type: IActivity['type']) => {
    const icons = {
      user: '👤',
      system: '⚙️',
      alert: '⚠️',
      success: '✅',
      warning: '🔔',
    };
    return icons[type];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const recentActivities = activities.slice(0, maxItems);

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activities
        </h3>
      </div>

      {/* Activities List */}
      {recentActivities.length > 0 ? (
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div
              key={activity.id || index}
              className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 last:pb-0"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                  {activity.icon || getActivityIcon(activity.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </h4>
                  <Badge variant={getActivityColor(activity.type)} size="sm">
                    {activity.type}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {activity.description}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No recent activities
          </p>
        </div>
      )}

      {/* View More Link */}
      {activities.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <a
            href="#"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            View all activities →
          </a>
        </div>
      )}
    </div>
  );
};

export default RecentActivityWidget;
