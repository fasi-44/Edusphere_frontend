/**
 * PrintActions Component
 * Consistent Download PDF and Print buttons used across all report pages.
 */

import { FC } from 'react';
import Button from '../ui/Button';
import type { PdfAction } from '../../prints';

interface PrintActionsProps {
    onAction: (action: PdfAction) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'outline' | 'secondary';
}

const DownloadIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const PrintIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

const PrintActions: FC<PrintActionsProps> = ({
    onAction,
    disabled = false,
    size = 'sm',
    variant = 'outline',
}) => {
    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => onAction('download')}
                disabled={disabled}
                leftIcon={DownloadIcon}
            >
                Download PDF
            </Button>
            <Button
                variant={variant}
                size={size}
                onClick={() => onAction('print')}
                disabled={disabled}
                leftIcon={PrintIcon}
            >
                Print
            </Button>
        </>
    );
};

export default PrintActions;
