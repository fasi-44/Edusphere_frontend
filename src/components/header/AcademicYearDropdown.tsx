import { FC, useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { AcademicYear } from '../../types/auth';

// Icons
const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

interface AcademicYearDropdownProps {
    onManageClick?: () => void;
}

const AcademicYearDropdown: FC<AcademicYearDropdownProps> = ({ onManageClick }) => {
    const { user, setSelectedAcademicYear } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const academicYears = user?.academic_years || [];
    const currentYear = user?.current_academic_year;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleYearChange = (year: AcademicYear) => {
        if (year.id !== currentYear?.id) {
            setSelectedAcademicYear(year);
        }
        setIsOpen(false);
    };

    const handleManageClick = () => {
        setIsOpen(false);
        onManageClick?.();
    };

    if (!academicYears || academicYears.length === 0) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
                <CalendarIcon />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {currentYear?.year_name || 'Select Year'}
                </span>
                <ChevronDownIcon />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Academic Year
                        </p>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {academicYears
                            .slice()
                            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                            .map((year) => (
                                <button
                                    key={year.id}
                                    onClick={() => handleYearChange(year)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                        year.id === currentYear?.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : ''
                                    }`}
                                >
                                    <span className={`text-sm ${
                                        year.id === currentYear?.id
                                            ? 'font-semibold text-blue-700 dark:text-blue-300'
                                            : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                        {year.year_name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {year.is_current && (
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                Current
                                            </span>
                                        )}
                                        {year.id === currentYear?.id && (
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))}
                    </div>

                    {onManageClick && (
                        <>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                            <button
                                onClick={handleManageClick}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <SettingsIcon />
                                Manage Academic Years
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AcademicYearDropdown;
