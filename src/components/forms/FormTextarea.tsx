import React, { forwardRef } from 'react';

interface IFormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  help?: string;
  required?: boolean;
  variant?: 'default' | 'filled';
}

/**
 * FormTextarea Component
 * Reusable textarea with validation and styling
 * @component
 */
const FormTextarea = forwardRef<HTMLTextAreaElement, IFormTextareaProps>(
  (
    {
      label,
      error,
      help,
      required = false,
      variant = 'default',
      className = '',
      rows = 4,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:focus:ring-offset-gray-800 resize-none';

    const variantStyles = {
      default: `border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500 ${
        error ? 'border-red-500 dark:border-red-500' : ''
      }`,
      filled:
        'bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-blue-500',
    };

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={`${baseStyles} ${variantStyles[variant]} ${className}`}
          {...props}
        />

        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {help && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {help}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;
