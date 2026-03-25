import React, { forwardRef } from 'react';

interface IFormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  help?: string;
  required?: boolean;
  placeholder?: string;
  options: Array<{ label: string; value: string | number }>;
}

/**
 * FormSelect Component
 * Reusable select/dropdown with validation and styling
 * @component
 */
const FormSelect = forwardRef<HTMLSelectElement, IFormSelectProps>(
  (
    {
      label,
      error,
      help,
      required = false,
      options,
      className = '',
      placeholder = 'Select an option',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800';

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          className={`${baseStyles} ${
            error
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : ''
          } ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

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

FormSelect.displayName = 'FormSelect';

export default FormSelect;
