import { FC } from 'react';
import { IFormFieldProps } from '../../types';

/**
 * FormField Component
 * Wrapper for form inputs with label, error, and help text
 * @component
 */
const FormField: FC<IFormFieldProps> = ({
  label,
  required = false,
  error,
  help,
  children,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {children}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18.101 12.93a1 1 0 00-1.313-1.313L10 14.586 3.22 7.808a1 1 0 00-1.414 1.414l7.07 7.07a1 1 0 001.414 0l8.02-8.02z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Help Text */}
      {help && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
    </div>
  );
};

export default FormField;
