/**
 * Educator Dashboard
 * Teaching staff dashboard with real API data
 * Shows: stats, today's timetable (mobile) / week timetable (desktop), absentees, announcements, quick actions
 */

import { FC, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { PageHeader, Button } from '../../components';
import QuickActionButton from '../../components/dashboard/QuickActionButton';
import AnnouncementsCard from './components/AnnouncementsCard';
import { useAuth } from '../../hooks/useAuth';
import dashboardService, {
    TeacherTimetablePeriod,
    TeacherWeekTimetable,
    AbsenteesData,
} from '../../services/dashboardService';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

const EducatorDashboard: FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [studentCount, setStudentCount] = useState(0);
    const [absenteesData, setAbsenteesData] = useState<AbsenteesData | null>(null);
    const [todayPeriods, setTodayPeriods] = useState<TeacherTimetablePeriod[]>([]);
    const [weekTimetable, setWeekTimetable] = useState<TeacherWeekTimetable | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const skid = user?.skid || '';
    const teacherId = user?.school_user_id;
    const academicYearId = user?.current_academic_year?.id;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchDashboardData = useCallback(async () => {
        if (!skid || !teacherId || !academicYearId) return;

        setLoading(true);
        const today = formatDate(new Date());

        try {
            const results = await Promise.allSettled([
                dashboardService.getTeacherStudentCount(skid, teacherId),
                dashboardService.getTeacherAbsentees(skid, academicYearId, today),
                isMobile
                    ? dashboardService.getTeacherDayTimetable(skid, teacherId, today)
                    : dashboardService.getTeacherWeekTimetable(skid, teacherId),
            ]);

            if (results[0].status === 'fulfilled') {
                setStudentCount(results[0].value as number);
            }
            if (results[1].status === 'fulfilled') {
                setAbsenteesData(results[1].value as AbsenteesData);
            }
            if (results[2].status === 'fulfilled') {
                if (isMobile) {
                    setTodayPeriods(results[2].value as TeacherTimetablePeriod[]);
                } else {
                    setWeekTimetable(results[2].value as TeacherWeekTimetable);
                    // Also fetch today for the "current class" card
                    try {
                        const dayData = await dashboardService.getTeacherDayTimetable(skid, teacherId, today);
                        setTodayPeriods(dayData);
                    } catch { /* ignore */ }
                }
            }
        } catch (err: any) {
            toast.error('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [skid, teacherId, academicYearId, isMobile]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Current / Next class logic
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let currentClass: TeacherTimetablePeriod | null = null;
    let nextClass: TeacherTimetablePeriod | null = null;

    for (const p of todayPeriods) {
        const start = parseMinutes(p.start_time);
        const end = parseMinutes(p.end_time);
        if (start !== null && end !== null) {
            if (nowMinutes >= start && nowMinutes < end) currentClass = p;
            else if (nowMinutes < start && !nextClass) nextClass = p;
        }
    }

    // Week timetable rendering
    const getWeekTableRows = () => {
        if (!weekTimetable?.timetable_by_day) return [];
        let maxPeriods = 0;
        DAYS_ORDER.forEach(day => {
            const periods = weekTimetable.timetable_by_day[day] || [];
            if (periods.length > maxPeriods) maxPeriods = periods.length;
        });
        const rows = [];
        for (let i = 0; i < maxPeriods; i++) {
            const row: Record<string, TeacherTimetablePeriod | null> = {};
            DAYS_ORDER.forEach(day => {
                const periods = weekTimetable.timetable_by_day[day] || [];
                row[day] = periods[i] || null;
            });
            rows.push({ index: i, ...row });
        }
        return rows;
    };

    const availableDays = weekTimetable
        ? DAYS_ORDER.filter(day => (weekTimetable.timetable_by_day[day] || []).length > 0)
        : [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title={`${getGreeting()}, ${user?.first_name || 'Teacher'}!`}
                subtitle={`Manage your classes and students. Academic Year: ${user?.current_academic_year?.year_name || ''}`}
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
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    Now Teaching
                                </span>
                            </div>
                            <h3 className="text-xl font-bold">{currentClass.subject_name}</h3>
                            <p className="text-white/80 text-sm mt-1">
                                {currentClass.class_name} - {currentClass.section_name}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                                <span>{formatTime(currentClass.start_time)} - {formatTime(currentClass.end_time)}</span>
                                {currentClass.room && <span>Room: {currentClass.room}</span>}
                            </div>
                        </div>
                    )}
                    {nextClass && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    Next Up
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{nextClass.subject_name}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                {nextClass.class_name} - {nextClass.section_name}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400 dark:text-gray-500">
                                <span>{formatTime(nextClass.start_time)} - {formatTime(nextClass.end_time)}</span>
                                {nextClass.room && <span>Room: {nextClass.room}</span>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Students Count */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">My Students</p>
                            {loading ? (
                                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentCount}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Today's Classes */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

                {/* Today's Absentees */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Today's Absentees</p>
                            {loading ? (
                                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{absenteesData?.count ?? 0}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timetable + Announcements Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timetable Section */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {isMobile ? "Today's Schedule" : 'My Weekly Timetable'}
                        </h3>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
                            ))}
                        </div>
                    ) : isMobile ? (
                        /* Mobile: Today's schedule as list */
                        todayPeriods.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                                <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                                <p className="text-sm">No classes scheduled for today</p>
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
                                            key={i}
                                            className={`flex items-center gap-3 p-3.5 rounded-lg border ${
                                                status === 'ongoing'
                                                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                                                    : status === 'completed'
                                                    ? 'border-gray-100 dark:border-gray-700 opacity-50'
                                                    : 'border-gray-100 dark:border-gray-700'
                                            }`}
                                        >
                                            <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                                                status === 'ongoing' ? 'bg-blue-500' : status === 'completed' ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                    {p.subject_name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {p.class_name} - {p.section_name}
                                                    {p.room && ` | Room: ${p.room}`}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                    {formatTime(p.start_time)}
                                                </p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    {formatTime(p.end_time)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        /* Desktop: Full week timetable grid */
                        weekTimetable && availableDays.length > 0 ? (
                            <div className="overflow-x-auto -mx-6 px-6">
                                <table className="w-full border-collapse min-w-[600px]">
                                    <thead>
                                        <tr>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 rounded-tl-lg w-20">
                                                Period
                                            </th>
                                            {availableDays.map((day, idx) => (
                                                <th
                                                    key={day}
                                                    className={`px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 ${idx === availableDays.length - 1 ? 'rounded-tr-lg' : ''}`}
                                                >
                                                    {day.slice(0, 3)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getWeekTableRows().map((row) => (
                                            <tr key={row.index} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-3 py-3 border-b border-gray-100 dark:border-gray-700">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        P{row.index + 1}
                                                    </div>
                                                    {(() => {
                                                        // get timing from first non-null entry in this row
                                                        for (const day of availableDays) {
                                                            const entry = row[day] as TeacherTimetablePeriod | null;
                                                            if (entry) return (
                                                                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </td>
                                                {availableDays.map((day) => {
                                                    const entry = row[day] as TeacherTimetablePeriod | null;
                                                    return (
                                                        <td key={day} className="px-2 py-2 border-b border-gray-100 dark:border-gray-700 text-center">
                                                            {entry ? (
                                                                <div className="px-2 py-1.5 rounded-md bg-blue-50/70 dark:bg-blue-900/15 border border-blue-100/50 dark:border-blue-800/30">
                                                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                                                        {entry.subject_name}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                                        {entry.class_name} - {entry.section_name}
                                                                    </p>
                                                                    {entry.room && (
                                                                        <span className="inline-block mt-0.5 px-1.5 py-0 text-[9px] font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                                            {entry.room}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-300 dark:text-gray-600">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                                <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                                <p className="text-sm">No timetable data available</p>
                            </div>
                        )
                    )}
                </div>

                {/* Announcements */}
                <AnnouncementsCard />
            </div>

            {/* Absentees Preview */}
            {!loading && absenteesData && absenteesData.preview && absenteesData.preview.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Today's Absentees
                            </h3>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                {absenteesData.count}
                            </span>
                        </div>
                        <button
                            onClick={() => navigate('/attendance/report')}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                            View All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {absenteesData.preview.map((student, i) => (
                            <div key={student.student_id || i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                        {student.full_name?.charAt(0) || '?'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {student.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {student.class_name} - {student.section_name}
                                        {student.roll_no && ` | Roll: ${student.roll_no}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        label="Mark Attendance"
                        variant="primary"
                        onClick={() => navigate('/attendance/mark')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        }
                        label="Enter Marks"
                        variant="success"
                        onClick={() => navigate('/academics/marks-entry')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        }
                        label="Assignments"
                        variant="info"
                        onClick={() => navigate('/assignments')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        }
                        label="View Timetable"
                        variant="warning"
                        onClick={() => navigate('/timetable')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        }
                        label="Syllabus"
                        variant="primary"
                        onClick={() => navigate('/syllabus')}
                    />
                    <QuickActionButton
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                        }
                        label="Announcements"
                        variant="warning"
                        onClick={() => navigate('/announcements')}
                    />
                </div>
            </div>
        </div>
    );
};

export default EducatorDashboard;
