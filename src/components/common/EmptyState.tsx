import React, { FC } from 'react';

interface IEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  message?: string; // Alias for description
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState Component
 * Displays empty state message with optional action button
 * @component
 */
const EmptyState: FC<IEmptyStateProps> = ({
  icon,
  title,
  description,
  message,
  action,
  className = '',
}) => {
  // Support both description and message props
  const displayText = description || message;
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon */}
      {icon ? (
        <div className="mb-4 text-4xl text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      ) : (
        <div className="mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      {displayText && (
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-sm">
          {displayText}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
