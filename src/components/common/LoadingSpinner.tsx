import { FC } from 'react';

interface ILoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  message?: string;
  className?: string;
}

/**
 * LoadingSpinner Component
 * Displays a loading spinner with optional message
 * @component
 */
const LoadingSpinner: FC<ILoadingSpinnerProps> = ({
  size = 'md',
  fullHeight = false,
  message = 'Loading...',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const containerClasses = fullHeight
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center py-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className={`mx-auto mb-4 ${sizeClasses[size]} animate-spin`}>
          <svg
            className="h-full w-full text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        {message && (
          <p className="text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
