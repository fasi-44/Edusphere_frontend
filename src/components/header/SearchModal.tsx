/**
 * Search Modal Component
 * Displays search results with keyboard navigation
 */

import { FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePageSearch } from '../../hooks/usePageSearch';
import { useAuthStore } from '../../stores/authStore';

interface SearchModalProps {
    isOpen: boolean;
    searchQuery: string;
    onClose: () => void;
}

const SearchModal: FC<SearchModalProps> = ({ isOpen, searchQuery, onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const resultsRef = useRef<HTMLDivElement>(null);

    const { results, hasResults, totalResults } = usePageSearch({
        query: searchQuery,
        userRole: user?.role || null,
    });

    // Flatten results for keyboard navigation
    const flatResults = results.flatMap((group) => group.pages);

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < flatResults.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (flatResults[selectedIndex]) {
                        handleNavigate(flatResults[selectedIndex].route);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatResults, selectedIndex, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (resultsRef.current) {
            const selectedElement = resultsRef.current.querySelector(
                `[data-index="${selectedIndex}"]`
            );
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth',
                });
            }
        }
    }, [selectedIndex]);

    const handleNavigate = (route: string) => {
        navigate(route);
        onClose();
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <>
                {parts.map((part, index) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <mark
                            key={index}
                            className="bg-yellow-200 dark:bg-yellow-900/40 text-gray-900 dark:text-white font-semibold"
                        >
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    };

    if (!isOpen || !searchQuery.trim()) {
        return null;
    }

    let currentFlatIndex = 0;

    return (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-w-2xl">
            {/* Results Header */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {hasResults ? (
                            <>
                                Found <span className="font-semibold text-gray-900 dark:text-white">{totalResults}</span>{' '}
                                {totalResults === 1 ? 'result' : 'results'}
                            </>
                        ) : (
                            'No results found'
                        )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">↑↓</kbd>
                        <span>to navigate</span>
                        <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">↵</kbd>
                        <span>to select</span>
                        <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">esc</kbd>
                        <span>to close</span>
                    </div>
                </div>
            </div>

            {/* Results List */}
            <div
                ref={resultsRef}
                className="max-h-96 overflow-y-auto py-2"
            >
                {hasResults ? (
                    results.map((group, groupIndex) => {
                        const groupStartIndex = currentFlatIndex;
                        currentFlatIndex += group.pages.length;

                        return (
                            <div key={groupIndex} className="mb-2">
                                {/* Category Header */}
                                <div className="px-4 py-2">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {group.category}
                                    </h3>
                                </div>

                                {/* Pages in Category */}
                                {group.pages.map((page, pageIndex) => {
                                    const flatIndex = groupStartIndex + pageIndex;
                                    const isSelected = flatIndex === selectedIndex;

                                    return (
                                        <button
                                            key={page.id}
                                            data-index={flatIndex}
                                            onClick={() => handleNavigate(page.route)}
                                            onMouseEnter={() => setSelectedIndex(flatIndex)}
                                            className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                                                isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-transparent'
                                            }`}
                                        >
                                            {/* Icon */}
                                            <span className="text-2xl flex-shrink-0 mt-0.5">
                                                {page.icon}
                                            </span>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4
                                                        className={`text-sm font-medium ${
                                                            isSelected
                                                                ? 'text-blue-700 dark:text-blue-300'
                                                                : 'text-gray-900 dark:text-white'
                                                        }`}
                                                    >
                                                        {highlightMatch(page.name, searchQuery)}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                                    {highlightMatch(page.description, searchQuery)}
                                                </p>
                                            </div>

                                            {/* Arrow Icon */}
                                            {isSelected && (
                                                <svg
                                                    className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })
                ) : (
                    <div className="px-4 py-12 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            No pages found for "<span className="font-semibold">{searchQuery}</span>"
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            Try searching with different keywords
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchModal;
