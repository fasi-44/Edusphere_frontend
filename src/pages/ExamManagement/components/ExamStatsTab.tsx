import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { examService } from '@/services/modules/examService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DataTable from '@/components/tables/DataTable';
import Badge from '@/components/ui/Badge';

interface IExamStatsTabProps {
  examId: string;
}

interface IStatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

interface IClassStats {
  classId: string;
  className: string;
  totalStudents: number;
  scheduledSubjects: number;
  averageScore?: number;
  status: string;
}

const ExamStatsTab: FC<IExamStatsTabProps> = ({ examId }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [classStats, setClassStats] = useState<IClassStats[]>([]);

  useEffect(() => {
    fetchStatistics();
  }, [examId]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const data = await examService.getStatistics(examId);

      // Handle response format
      if (data) {
        setStats(data);

        // Extract class stats if available
        if (data.classStats && Array.isArray(data.classStats)) {
          setClassStats(data.classStats);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading statistics..." />;
  }

  // Stat cards data
  const statCards: IStatCard[] = [
    {
      label: 'Total Subjects',
      value: stats?.totalSubjects || 0,
      icon: '📚',
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Scheduled Subjects',
      value: stats?.scheduledSubjects || 0,
      icon: '📅',
      color: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: '👥',
      color: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: 'Average Score',
      value: stats?.averageScore ? `${stats.averageScore.toFixed(1)}%` : 'N/A',
      icon: '📊',
      color: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  // Table columns
  const columns = [
    {
      key: 'className',
      label: 'Class',
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      )
    },
    {
      key: 'totalStudents',
      label: 'Students',
      render: (value: number) => (
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold">
          {value}
        </div>
      )
    },
    {
      key: 'scheduledSubjects',
      label: 'Scheduled',
      render: (value: number, row: any) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {value} {row.totalSubjects ? `/ ${row.totalSubjects}` : ''}
        </div>
      )
    },
    {
      key: 'averageScore',
      label: 'Average Score',
      render: (value?: number) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value ? `${value.toFixed(1)}%` : '-'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const variant =
          value === 'COMPLETED'
            ? 'success'
            : value === 'IN_PROGRESS'
            ? 'warning'
            : value === 'PENDING'
            ? 'info'
            : 'secondary';
        return <Badge variant={variant} text={value} />;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.color} border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-all hover:shadow-lg`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <span className="text-4xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Class-wise Statistics */}
      {classStats.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Class-wise Statistics
          </h3>
          <DataTable
            columns={columns}
            data={classStats}
            loading={false}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-4">📊</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Statistics Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Statistics will appear once exams are scheduled and results are recorded.
          </p>
        </div>
      )}

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> Statistics are calculated based on scheduled exams and recorded student results.
          Please ensure all subjects are scheduled and results are recorded for accurate statistics.
        </p>
      </div>
    </div>
  );
};

export default ExamStatsTab;
