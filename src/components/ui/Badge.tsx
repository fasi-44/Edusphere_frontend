import { FC } from 'react';
import { IBadgeProps } from '../../types';

/**
 * Badge Component
 * Display status or category labels
 * @component
 */
const Badge: FC<IBadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  text,
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    info: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded',
    md: 'px-3 py-1 text-sm font-medium rounded-md',
    lg: 'px-4 py-1.5 text-base font-medium rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children || text}
    </span>
  );
};

export default Badge;
