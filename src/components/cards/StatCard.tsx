import { FC } from 'react';
import { IStatCard } from '../../types';

/**
 * StatCard Component
 * Displays a statistic with optional icon and trend
 * @component
 */
const StatCard: FC<IStatCard & { className?: string }> = ({
  title,
  value,
  change,
  changeType = 'increase',
  icon,
  trend,
  onClick,
  className = '',
}) => {
  const changeColor = changeType === 'increase'
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  const changeIcon = changeType === 'increase' ? '↑' : '↓';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </h3>
        </div>

        {/* Icon */}
        {icon && (
          <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl text-blue-600 dark:text-blue-400">
            {icon}
          </div>
        )}
      </div>

      {/* Change Indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeIcon} {Math.abs(change)}%
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            from last month
          </span>
        </div>
      )}

      {/* Trend Chart */}
      {trend && trend.length > 0 && (
        <div className="mt-4 flex items-end gap-1 h-8">
          {trend.map((value, index) => {
            const maxValue = Math.max(...trend);
            const percentage = (value / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-blue-300 dark:bg-blue-700 rounded-t-sm"
                style={{ height: `${Math.max(20, percentage)}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatCard;
