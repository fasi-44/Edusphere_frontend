/**
 * usePageSearch Hook
 * Custom hook for searching pages with fuzzy matching and role-based filtering
 */

import { useMemo } from 'react';
import { searchablePages, SearchablePage } from '../data/searchablePages';
import { UserRole } from '../types/common';

interface UsePageSearchOptions {
    query: string;
    userRole: UserRole | null;
}

interface GroupedResults {
    category: string;
    pages: SearchablePage[];
}

export const usePageSearch = ({ query, userRole }: UsePageSearchOptions) => {
    const results = useMemo(() => {
        // If no query, return empty results
        if (!query.trim()) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();

        // Filter pages based on user role and search query
        const filteredPages = searchablePages.filter((page) => {
            // Check if user has access to this page
            if (!userRole || !page.roles.includes(userRole)) {
                return false;
            }

            // Search in name, description, and keywords
            const nameMatch = page.name.toLowerCase().includes(searchTerm);
            const descriptionMatch = page.description.toLowerCase().includes(searchTerm);
            const keywordMatch = page.keywords.some((keyword) =>
                keyword.toLowerCase().includes(searchTerm)
            );
            const categoryMatch = page.category.toLowerCase().includes(searchTerm);

            return nameMatch || descriptionMatch || keywordMatch || categoryMatch;
        });

        // Group results by category
        const grouped: GroupedResults[] = [];
        const categoryMap = new Map<string, SearchablePage[]>();

        filteredPages.forEach((page) => {
            const existing = categoryMap.get(page.category) || [];
            existing.push(page);
            categoryMap.set(page.category, existing);
        });

        categoryMap.forEach((pages, category) => {
            grouped.push({ category, pages });
        });

        return grouped;
    }, [query, userRole]);

    const totalResults = useMemo(() => {
        return results.reduce((acc, group) => acc + group.pages.length, 0);
    }, [results]);

    const hasResults = totalResults > 0;

    return {
        results,
        totalResults,
        hasResults,
    };
};
