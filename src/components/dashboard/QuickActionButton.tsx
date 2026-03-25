import React, { FC } from 'react';

interface IQuickActionButtonProps {
  icon: React.ReactNode | string;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

/**
 * QuickActionButton Component
 * Styled button for quick actions on dashboard
 * @component
 */
const QuickActionButton: FC<IQuickActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'primary',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400',
    info: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400',
  };

  return (
    <button
      onClick={onClick}
      className={`
        p-4 border rounded-lg transition-all duration-200
        flex flex-col items-center justify-center gap-2
        ${variantStyles[variant]}
        ${className}
      `}
      title={label}
    >
      {/* Icon */}
      <div className="text-2xl leading-none">
        {typeof icon === 'string' ? icon : icon}
      </div>

      {/* Label */}
      <span className="text-xs font-medium text-center leading-tight max-w-[80px]">
        {label}
      </span>
    </button>
  );
};

export default QuickActionButton;
