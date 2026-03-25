import React, { FC } from 'react';
import { IPageHeaderProps } from '../../types';

/**
 * PageHeader Component
 * Displays page title, subtitle, breadcrumbs, and actions
 * @component
 */
const PageHeader: FC<IPageHeaderProps> = ({
    title,
    subtitle,
    breadcrumbs,
    actions,
    className = '',
}) => {
    return (
        <div className={`mb-6 ${className}`}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {breadcrumbs.map((breadcrumb, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <span className="text-gray-400 dark:text-gray-600">/</span>}
                            {breadcrumb.href ? (
                                <a
                                    href={breadcrumb.href}
                                    className="hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    {breadcrumb.label}
                                </a>
                            ) : (
                                <span className="text-gray-900 dark:text-white font-medium">
                                    {breadcrumb.label}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Header with Title and Actions */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-gray-600 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
