/**
 * Stat Card Component
 * Reusable card for displaying statistics
 */

import React from 'react';

interface StatCardProps {
  label?: string;
  title?: string; // Alias for label
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  change?: number;
  changeType?: 'increase' | 'decrease';
  loading?: boolean;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    icon: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  title,
  value,
  icon,
  color = 'blue',
  trend,
  change,
  changeType = 'increase',
  loading = false,
}) => {
  const colorClasses = colorVariants[color];
  const displayLabel = title || label || '';

  // Determine trend from change/changeType if trend not provided
  const effectiveTrend = trend || (change !== undefined ? {
    value: Math.abs(change),
    direction: changeType === 'increase' ? 'up' as const : 'down' as const,
  } : undefined);

  if (loading) {
    return (
      <div
        className={`p-6 rounded-lg border ${colorClasses.bg} ${colorClasses.border} animate-pulse`}
      >
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-lg border ${colorClasses.bg} ${colorClasses.border} transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {displayLabel}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </h3>
            {effectiveTrend && (
              <span
                className={`text-sm font-semibold ${
                  effectiveTrend.direction === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {effectiveTrend.direction === 'up' ? '↑' : '↓'} {effectiveTrend.value}%
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
