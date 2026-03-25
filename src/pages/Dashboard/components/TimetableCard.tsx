import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import dashboardService, { TimetableData, ClassItem, SectionItem } from '../../../services/dashboardService';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableCard: FC = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [classesLoading, setClassesLoading] = useState(false);
    const [sectionsLoading, setSectionsLoading] = useState(false);

    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | ''>('');
    const [selectedSection, setSelectedSection] = useState<number | ''>('');
    const [timetableData, setTimetableData] = useState<TimetableData | null>(null);

    const skid = user?.skid || '';
    const academicYearId = user?.current_academic_year?.id;

    // Fetch classes on mount
    useEffect(() => {
        if (skid && academicYearId) {
            fetchClasses();
        }
    }, [skid, academicYearId]);

    // Fetch sections when class changes
    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass as number);
        }
    }, [selectedClass]);

    // Fetch timetable when filters change or on initial load
    useEffect(() => {
        if (skid && academicYearId) {
            fetchTimetable();
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

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getTimetable(
                skid,
                academicYearId!,
                selectedClass ? (selectedClass as number) : undefined,
                selectedSection ? (selectedSection as number) : undefined
            );
            setTimetableData(data);

            // Auto-populate filters from response
            if (!selectedClass && data.timetable?.class_id) {
                setSelectedClass(data.timetable.class_id);
            }
            if (!selectedSection && data.timetable?.section_id) {
                setSelectedSection(data.timetable.section_id);
            }
        } catch (err: any) {
            toast.error('Failed to load timetable');
            console.error('Error fetching timetable:', err);
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

    // Get period timing from entries
    const getPeriodTiming = (periodNumber: number): string | null => {
        if (!timetableData?.entries) return null;
        const entry = timetableData.entries.find((e) => e.period_number === periodNumber);
        if (entry) {
            return `${entry.start_time} - ${entry.end_time}`;
        }
        return null;
    };

    // Get available days that have data
    const availableDays = DAYS_ORDER.filter(
        (day) => timetableData?.timetable_by_day?.[day]?.length
    );

    // Build rows for the table
    const getTableRows = () => {
        if (!timetableData?.timetable) return [];
        const rows = [];
        for (let i = 1; i <= timetableData.timetable.total_periods; i++) {
            const row: Record<string, any> = {
                period: i,
                timing: getPeriodTiming(i),
            };
            DAYS_ORDER.forEach((day) => {
                const dayEntries = timetableData.timetable_by_day[day] || [];
                row[day] = dayEntries.find((e) => e.period_number === i) || null;
            });
            rows.push(row);
        }
        return rows;
    };

    const tableRows = getTableRows();

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Class Timetable
                    </h3>
                    {timetableData?.timetable && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            - {timetableData.timetable.class_name} {timetableData.timetable.section_name}
                        </span>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <select
                        value={selectedClass}
                        onChange={(e) => handleClassChange(e.target.value)}
                        disabled={classesLoading}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                        <option value="">{classesLoading ? 'Loading...' : 'Select Class'}</option>
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
                        <option value="">{sectionsLoading ? 'Loading...' : 'Select Section'}</option>
                        {sections.map((sec) => (
                            <option key={sec.id} value={sec.id}>{sec.section_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Timetable */}
            {loading ? (
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded mb-2"></div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-50 dark:bg-gray-700/50 rounded mb-1"></div>
                    ))}
                </div>
            ) : timetableData?.timetable ? (
                <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full border-collapse min-w-[700px]">
                        <thead>
                            <tr>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 rounded-tl-lg w-24">
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
                            {tableRows.map((row) => (
                                <tr key={row.period} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-3 py-3 border-b border-gray-100 dark:border-gray-700">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            P{row.period}
                                        </div>
                                        {row.timing && (
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                {row.timing}
                                            </div>
                                        )}
                                    </td>
                                    {availableDays.map((day) => {
                                        const entry = row[day];
                                        return (
                                            <td key={day} className="px-2 py-2 border-b border-gray-100 dark:border-gray-700 text-center">
                                                {entry ? (
                                                    <div className="px-2 py-1.5 rounded-md bg-blue-50/70 dark:bg-blue-900/15 border border-blue-100/50 dark:border-blue-800/30">
                                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                                            {entry.subject_name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                            {entry.teacher_name}
                                                        </p>
                                                        {entry.room_number && (
                                                            <span className="inline-block mt-0.5 px-1.5 py-0 text-[9px] font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                                R-{entry.room_number}
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
                    <p className="text-sm">No timetable available for the selected class and section</p>
                    <p className="text-xs mt-1">Select a class and section to view timetable</p>
                </div>
            )}
        </div>
    );
};

export default TimetableCard;
