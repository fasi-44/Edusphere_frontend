import { FC } from 'react';
import { IConfirmDialogProps } from '../../types';
import Modal from './Modal';
import Button from '../ui/Button';

/**
 * ConfirmDialog Component
 * Confirmation dialog with custom message and actions
 * @component
 */
const ConfirmDialog: FC<IConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isDangerous = false,
  isLoading = false,
}) => {
  // isDangerous is an alias for type="danger"
  const effectiveType = isDangerous ? 'danger' : type;
  const typeStyles = {
    info: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
    danger: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    success: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
  };

  const iconSvg = {
    info: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    warning: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4v2m0 5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    danger: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    success: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  };

  const confirmVariant = {
    info: 'primary' as const,
    warning: 'warning' as const,
    danger: 'danger' as const,
    success: 'success' as const,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      closeButton={false}
      size="sm"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Icon */}
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${typeStyles[effectiveType]}`}>
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {iconSvg[effectiveType]}
          </svg>
        </div>

        {/* Message */}
        <p className="text-center text-gray-700 dark:text-gray-300">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 w-full mt-6">
          <Button
            variant="secondary"
            fullWidth
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant[effectiveType]}
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Processing..."
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
