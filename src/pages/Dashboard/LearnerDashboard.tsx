/**
 * Learner Dashboard
 * Student dashboard with real API data
 * Shows: current/next class, today's schedule, pending assignments, announcements, quick actions
 */

import { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button } from '../../components';
import QuickActionButton from '../../components/dashboard/QuickActionButton';
import AnnouncementsCard from './components/AnnouncementsCard';
import { useAuth } from '../../hooks/useAuth';
import dashboardService, { StudentTimetablePeriod } from '../../services/dashboardService';

const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatTime = (t: string): string => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${h12}:${m} ${ampm}`;
};

const parseMinutes = (t: string): number | null => {
    if (!t) return null;
    const [h, m] = t.split(':');
    return parseInt(h, 10) * 60 + parseInt(m, 10);
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const LearnerDashboard: FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [todayPeriods, setTodayPeriods] = useState<StudentTimetablePeriod[]>([]);

    const skid = user?.skid || '';
    const studentId = user?.school_user_id;
    const academicYearId = user?.current_academic_year?.id;

    const fetchDashboardData = useCallback(async () => {
        if (!skid || !studentId || !academicYearId) return;

        setLoading(true);
        const today = formatDate(new Date());

        try {
            const results = await Promise.allSettled([
                dashboardService.getStudentDayTimetable(skid, studentId, today),
            ]);

            if (results[0].status === 'fulfilled') {
                const data = results[0].value;
                setTodayPeriods(Array.isArray(data) ? data : []);
            }
        } catch (err: any) {
            toast.error('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [skid, studentId, academicYearId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Current / Next class logic
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let currentClass: StudentTimetablePeriod | null = null;
    let nextClass: StudentTimetablePeriod | null = null;

    for (const p of todayPeriods) {
        const start = parseMinutes(p.start_time);
        const end = parseMinutes(p.end_time);
        if (start !== null && end !== null) {
            if (nowMinutes >= start && nowMinutes < end) currentClass = p;
            else if (nowMinutes < start && !nextClass) nextClass = p;
        }
    }

    const today = new Date();
    const dateLabel = `${MONTH_NAMES[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={`${getGreeting()}, ${user?.first_name || 'Student'}!`}
                subtitle={dateLabel}
                actions={
                    <Button variant="primary" size="sm" onClick={() => fetchDashboardData()}>
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                        </svg>
                        Refresh
                    </Button>
                }
            />

            {/* Current / Next Class Card */}
            {!loading && (currentClass || nextClass) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentClass && (
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    Happening Now
                                </span>
                            </div>
                            <h3 className="text-xl font-bold">{currentClass.subject_name}</h3>
                            {currentClass.teacher_name && (
                                <p className="text-white/80 text-sm mt-1">{currentClass.teacher_name}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                                <span>{formatTime(currentClass.start_time)} - {formatTime(currentClass.end_time)}</span>
                                {currentClass.room && <span>Room: {currentClass.room}</span>}
                            </div>
                        </div>
                    )}
                    {nextClass && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                    Next Up
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{nextClass.subject_name}</h3>
                            {nextClass.teacher_name && (
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{nextClass.teacher_name}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400 dark:text-gray-500">
                                <span>{formatTime(nextClass.start_time)} - {formatTime(nextClass.end_time)}</span>
                                {nextClass.room && <span>Room: {nextClass.room}</span>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Today's Classes */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Today's Classes</p>
                            {loading ? (
                                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayPeriods.length}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Classes Completed */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Completed Today</p>
                            {loading ? (
                                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {todayPeriods.filter(p => {
                                        const end = parseMinutes(p.end_time);
                                        return end !== null && nowMinutes >= end;
                                    }).length}
                                    <span className="text-sm font-normal text-gray-400 ml-1">/ {todayPeriods.length}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule + Announcements Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Today's Schedule
                        </h3>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
                            ))}
                        </div>
                    ) : todayPeriods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <p className="text-sm">No classes scheduled for today</p>
                            <p className="text-xs mt-1">Enjoy your day off!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {todayPeriods.map((p, i) => {
                                const start = parseMinutes(p.start_time);
                                const end = parseMinutes(p.end_time);
                                let status: 'completed' | 'ongoing' | 'upcoming' = 'upcoming';
                                if (start !== null && end !== null) {
                                    if (nowMinutes >= end) status = 'completed';
                                    else if (nowMinutes >= start) status = 'ongoing';
                                }
                                return (
                                    <div
                                        key={p.id || i}
                                        className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all ${
                                            status === 'ongoing'
                                                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm'
                                                : status === 'completed'
                                                ? 'border-gray-100 dark:border-gray-700 opacity-50'
                                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        {/* Status indicator */}
                                        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                                            status === 'ongoing' ? 'bg-indigo-500' : status === 'completed' ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'
                                        }`} />

                                        {/* Period number */}
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                            status === 'ongoing'
                                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}>
                                            P{p.period_number}
                                        </div>

                                        {/* Subject & Teacher */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {p.subject_name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {p.teacher_name}
                                                {p.room && ` | Room: ${p.room}`}
                                            </p>
                                        </div>

                                        {/* Time & Status */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {formatTime(p.start_time)} - {formatTime(p.end_time)}
                                            </p>
                                            {status === 'ongoing' && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                                    Live
                                                </span>
                                            )}
                                            {status === 'completed' && (
                                                <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                                                    Done
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Announcements */}
                <AnnouncementsCard />
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        }
                        label="My Timetable"
                        variant="primary"
                        onClick={() => navigate('/timetable')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        }
                        label="Assignments"
                        variant="info"
                        onClick={() => navigate('/assignments/my-assignments')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                        }
                        label="Progress Report"
                        variant="success"
                        onClick={() => navigate('/academics/progress')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        }
                        label="Syllabus"
                        variant="warning"
                        onClick={() => navigate('/syllabus/my-progress')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                        }
                        label="Announcements"
                        variant="primary"
                        onClick={() => navigate('/announcements')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        }
                        label="Exams"
                        variant="info"
                        onClick={() => navigate('/exams')}
                    />
                </div>
            </div>
        </div>
    );
};

export default LearnerDashboard;
