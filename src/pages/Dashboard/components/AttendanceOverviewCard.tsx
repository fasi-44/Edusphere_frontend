import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Chart from 'react-apexcharts';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import dashboardService, { AttendanceOverview, ClassItem, SectionItem } from '../../../services/dashboardService';

const AttendanceOverviewCard: FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AttendanceOverview | null>(null);

    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | ''>('');
    const [selectedSection, setSelectedSection] = useState<number | ''>('');
    const [classesLoading, setClassesLoading] = useState(false);
    const [sectionsLoading, setSectionsLoading] = useState(false);

    const skid = user?.skid || '';
    const academicYearId = user?.current_academic_year?.id;

    // Fetch classes on mount
    useEffect(() => {
        if (skid) {
            fetchClasses();
        }
    }, [skid]);

    // Fetch sections when class changes
    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass as number);
        }
    }, [selectedClass]);

    // Fetch attendance data when filters change
    useEffect(() => {
        if (skid && academicYearId) {
            fetchData();
        }
    }, [skid, academicYearId, selectedClass, selectedSection]);

    const fetchClasses = async () => {
        try {
            setClassesLoading(true);
            const data = await dashboardService.getClasses(skid);
            setClasses(data);
        } catch (err: any) {
            console.error('Error fetching classes:', err);
        } finally {
            setClassesLoading(false);
        }
    };

    const fetchSections = async (classId: number) => {
        try {
            setSectionsLoading(true);
            const data = await dashboardService.getSections(skid, classId);
            setSections(data);
        } catch (err: any) {
            console.error('Error fetching sections:', err);
        } finally {
            setSectionsLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await dashboardService.getAttendanceOverview(
                skid,
                academicYearId!,
                selectedClass ? (selectedClass as number) : undefined,
                selectedSection ? (selectedSection as number) : undefined
            );
            setData(result);
        } catch (err: any) {
            toast.error('Failed to load attendance overview');
            console.error('Error fetching attendance overview:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = (value: string) => {
        const classId = value ? Number(value) : '';
        setSelectedClass(classId);
        setSelectedSection('');
        setSections([]);
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="flex items-end justify-between h-32 gap-3 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t" style={{ height: `${40 + i * 15}%` }}></div>
                    ))}
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
        );
    }

    // Build ApexCharts config
    const categories = data?.weekly_trend.map(d => d.day) || [];
    const presentData = data?.weekly_trend.map(d => d.present) || [];
    const absentData = data?.weekly_trend.map(d => d.absent) || [];

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            stacked: true,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'inherit',
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                borderRadiusApplication: 'end',
                columnWidth: '50%',
            },
        },
        colors: [isDark ? '#34D399' : '#10B981', isDark ? '#F87171' : '#F87171'],
        xaxis: {
            categories,
            labels: {
                style: {
                    colors: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: '12px',
                    fontWeight: 500,
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: {
                    colors: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: '12px',
                },
            },
        },
        grid: {
            borderColor: isDark ? '#374151' : '#F3F4F6',
            strokeDashArray: 3,
        },
        legend: { show: false },
        dataLabels: { enabled: false },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: { formatter: (val: number) => `${val} students` },
        },
        states: {
            hover: { filter: { type: 'darken', value: 0.9 } as { type?: string; value?: number } },
        },
    };

    const chartSeries = [
        { name: 'Present', data: presentData },
        { name: 'Absent', data: absentData },
    ];

    const hasData = data && data.weekly_trend.length > 0;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Weekly Attendance
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        This week's attendance trend
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={selectedClass}
                        onChange={(e) => handleClassChange(e.target.value)}
                        disabled={classesLoading}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                        <option value="">{classesLoading ? 'Loading...' : 'All Classes'}</option>
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value ? Number(e.target.value) : '')}
                        disabled={!selectedClass || sectionsLoading}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                        <option value="">{sectionsLoading ? 'Loading...' : 'All Sections'}</option>
                        {sections.map((sec) => (
                            <option key={sec.id} value={sec.id}>{sec.section_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {hasData ? (
                <>
                    {/* Today's percentage badge */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Present</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Absent</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {data!.today_percentage}%
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
                        </div>
                    </div>

                    {/* ApexCharts Bar Chart */}
                    <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        height={200}
                    />

                    {/* Summary */}
                    <div className="flex items-center justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Today: <span className="font-semibold text-gray-700 dark:text-gray-300">{data!.today_present}</span> / {data!.today_total_marked || data!.total_students}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                    <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No attendance data this week</p>
                </div>
            )}
        </div>
    );
};

export default AttendanceOverviewCard;
