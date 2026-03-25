/**
 * Progress Statistics Card Component
 * Displays a single statistic card with icon, value, and color-coded background
 */

import { FC, ReactNode } from 'react';

interface ProgressStatCardProps {
    icon: ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    bgColor: string;
    iconColor: string;
}

const ProgressStatCard: FC<ProgressStatCardProps> = ({
    icon,
    title,
    value,
    subtitle,
    bgColor,
    iconColor,
}) => {
    return (
        <div className={`${bgColor} p-6 rounded-lg border border-gray-200 dark:border-gray-700`}>
            <div className="flex flex-col items-center text-center space-y-3">
                {/* Icon */}
                <div className={`flex items-center justify-center ${iconColor}`}>
                    {icon}
                </div>

                {/* Value */}
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {value}
                </div>

                {/* Title */}
                <div className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">
                    {title}
                </div>

                {/* Subtitle */}
                {subtitle && (
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressStatCard;
