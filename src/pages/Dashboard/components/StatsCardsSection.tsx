import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import dashboardService, { DashboardStats } from '../../../services/dashboardService';

interface StatsCardsSectionProps {
    onStatsLoaded?: (stats: DashboardStats['stats']) => void;
}

const StatsCardsSection: FC<StatsCardsSectionProps> = ({ onStatsLoaded }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats['stats'] | null>(null);

    const skid = user?.skid || '';
    const academicYearId = user?.current_academic_year?.id;

    useEffect(() => {
        if (skid && academicYearId) {
            fetchStats();
        }
    }, [skid, academicYearId]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getStats(skid, academicYearId!);
            setStats(data.stats);
            onStatsLoaded?.(data.stats);
        } catch (err: any) {
            toast.error('Failed to load dashboard statistics');
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const attendancePercentage = stats?.today_attendance_total_students
        ? Math.round((stats.today_attendance_present / stats.today_attendance_total_students) * 100)
        : 0;

    const cards = [
        {
            label: 'Total Students',
            value: stats?.students_count ?? '-',
            subtitle: stats ? `${stats.male_students}M / ${stats.female_students}F` : '',
            color: 'blue' as const,
            link: '/students',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
            ),
        },
        {
            label: 'Total Teachers',
            value: stats?.teachers_count ?? '-',
            color: 'green' as const,
            link: '/teachers',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            ),
        },
        {
            label: 'Total Parents',
            value: stats?.parents_count ?? '-',
            color: 'yellow' as const,
            link: '/parents',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
            ),
        },
        {
            label: 'Overall Users',
            value: stats?.overall_users_count ?? '-',
            color: 'purple' as const,
            link: '/users',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            ),
        },
        {
            label: "Today's Attendance",
            value: stats
                ? `${stats.today_attendance_present} / ${stats.today_attendance_total_students}`
                : '-',
            subtitle: stats?.today_attendance_total_students
                ? `${attendancePercentage}% Present`
                : 'No data',
            color: 'green' as const,
            link: '/attendance/mark',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {cards.map((card) => {
                const colorMap = {
                    blue: {
                        bg: 'from-blue-500 to-blue-600',
                        light: 'bg-blue-50 dark:bg-blue-900/20',
                        border: 'border-blue-100 dark:border-blue-800',
                        iconBg: 'bg-white/20',
                        text: 'text-white',
                    },
                    green: {
                        bg: 'from-emerald-500 to-emerald-600',
                        light: 'bg-emerald-50 dark:bg-emerald-900/20',
                        border: 'border-emerald-100 dark:border-emerald-800',
                        iconBg: 'bg-white/20',
                        text: 'text-white',
                    },
                    yellow: {
                        bg: 'from-amber-500 to-amber-600',
                        light: 'bg-amber-50 dark:bg-amber-900/20',
                        border: 'border-amber-100 dark:border-amber-800',
                        iconBg: 'bg-white/20',
                        text: 'text-white',
                    },
                    purple: {
                        bg: 'from-purple-500 to-purple-600',
                        light: 'bg-purple-50 dark:bg-purple-900/20',
                        border: 'border-purple-100 dark:border-purple-800',
                        iconBg: 'bg-white/20',
                        text: 'text-white',
                    },
                };
                const colors = colorMap[card.color];
                return (
                    <div
                        key={card.label}
                        onClick={() => navigate(card.link)}
                        className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colors.bg} p-5 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white/80 mb-1 truncate">
                                    {card.label}
                                </p>
                                <h3 className="text-2xl font-bold text-white">
                                    {card.value}
                                </h3>
                                {card.subtitle && (
                                    <p className="text-xs text-white/70 mt-1">{card.subtitle}</p>
                                )}
                            </div>
                            <div className={`p-2.5 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                                {card.icon}
                            </div>
                        </div>
                        {/* Decorative circle */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5"></div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatsCardsSection;
