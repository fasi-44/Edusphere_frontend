/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */

import { getApiClient } from '../api/client';
import {
    SuperAdminStats,
    AdministratorStats,
    EducatorStats,
    LearnerStats,
    GuardianStats,
} from '../../types/dashboard';

const client = getApiClient();

export const dashboardService = {
    /**
     * Get SuperAdmin Dashboard Stats
     */
    async getSuperAdminStats(): Promise<any> {
        try {
            const response = await client.get('/school/dashboard/stats') as any;
            if (response.code === 200 && response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message || 'Failed to fetch dashboard stats');
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get Administrator Dashboard Stats
     */
    async getAdministratorStats(): Promise<AdministratorStats> {
        try {
            return (await client.get<AdministratorStats>(
                '/dashboard/administrator/stats'
            )) as unknown as AdministratorStats;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get Educator Dashboard Stats
     */
    async getEducatorStats(): Promise<EducatorStats> {
        try {
            return (await client.get<EducatorStats>(
                '/dashboard/educator/stats'
            )) as unknown as EducatorStats;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get Learner Dashboard Stats
     */
    async getLearnerStats(): Promise<LearnerStats> {
        try {
            return (await client.get<LearnerStats>(
                '/dashboard/learner/stats'
            )) as unknown as LearnerStats;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get Guardian Dashboard Stats
     */
    async getGuardianStats(): Promise<GuardianStats> {
        try {
            return (await client.get<GuardianStats>(
                '/dashboard/guardian/stats'
            )) as unknown as GuardianStats;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get recent activities (common endpoint)
     */
    async getRecentActivities(limit: number = 10) {
        try {
            return (await client.get(
                `/dashboard/activities?limit=${limit}`
            )) as unknown;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get chart data for dashboards
     */
    async getChartData(period: 'weekly' | 'monthly' | 'yearly') {
        try {
            return (await client.get(
                `/dashboard/chart-data?period=${period}`
            )) as unknown;
        } catch (error) {
            throw error;
        }
    },
};
