import React, { forwardRef } from 'react';

interface IFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | boolean;
  help?: string;
  required?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

/**
 * FormInput Component
 * Reusable text input with validation and styling
 * @component
 */
const FormInput = forwardRef<HTMLInputElement, IFormInputProps>(
  (
    {
      label,
      error,
      help,
      required = false,
      icon,
      variant = 'default',
      className = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:focus:ring-offset-gray-800';

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

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-600">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={`${baseStyles} ${variantStyles[variant]} ${icon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>

        {error && typeof error === 'string' && (
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

FormInput.displayName = 'FormInput';

export default FormInput;
