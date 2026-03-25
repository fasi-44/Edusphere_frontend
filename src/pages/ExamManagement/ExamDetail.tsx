/**
 * Exam Configuration Detail Page
 * View and manage exam configuration details
 */

import { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
  PageHeader,
  Button,
  Badge,
  LoadingSpinner,
  EmptyState,
  ConfirmDialog,
} from '@/components';
import { examService } from '@/services/modules/examService';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../config/permissions';

interface IExamConfig {
  id?: number;
  exam_name: string;
  exam_code: string;
  exam_category: string;
  sequence_order: number;
}

const ExamDetail: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = usePermissions();

  const [exam, setExam] = useState<IExamConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Fetch exam data
  useEffect(() => {
    if (id) {
      fetchExamData();
    }
  }, [id]);

  const fetchExamData = async () => {
    setLoading(true);
    try {
      const data = await examService.getById(id!);
      // Cast IExam to IExamConfig since the API returns exam type data
      setExam({
        id: Number(data.id) || undefined,
        exam_name: data.exam_name || data.name || '',
        exam_code: data.exam_code || '',
        exam_category: data.exam_category || '',
        sequence_order: data.sequence_order ?? 1,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exam configuration');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!exam) return;

    try {
      await examService.delete(String(exam.id));
      toast.success('Exam configuration deleted successfully');
      setTimeout(() => navigate('/exams'), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete exam configuration');
    }
  };

  // Get category color variant
  const getCategoryVariant = (category: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' => {
    switch (category?.toLowerCase()) {
      case 'formative':
        return 'info';
      case 'summative':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Show loading spinner
  if (loading && !exam) {
    return <LoadingSpinner fullHeight message="Loading exam configuration..." />;
  }

  // Show error message
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Exam Configuration Details"
          subtitle="View exam configuration"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Exams', href: '/exams' },
            { label: 'Details', href: '#' },
          ]}
        />
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/exams')}>
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state if no exam found
  if (!exam) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Exam Configuration Details"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Exams', href: '/exams' },
            { label: 'Details', href: '#' },
          ]}
        />
        <EmptyState
          icon="📝"
          title="Exam Configuration Not Found"
          description="The exam configuration you're looking for doesn't exist or has been deleted."
          action={
            <Button variant="secondary" onClick={() => navigate('/exams')}>
              Back to Exams
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={exam.exam_name}
        subtitle={exam.exam_code}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Exams', href: '/exams' },
          { label: exam.exam_name, href: '#' },
        ]}
        actions={
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {hasPermission(Permission.MANAGE_EXAMS) && (
              <Button
                variant="info"
                onClick={() => navigate(`/exams/${exam.id}/edit`)}
              >
                ✏️ Edit
              </Button>
            )}
            {hasPermission(Permission.MANAGE_EXAMS) && (
              <Button
                variant="danger"
                onClick={() => setDeleteConfirm(true)}
              >
                🗑️ Delete
              </Button>
            )}
          </div>
        }
      />

      {/* Detail Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Exam Name
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {exam.exam_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Exam Code
                </label>
                <p className="font-mono text-lg text-gray-900 dark:text-white">
                  {exam.exam_code}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Category
                </label>
                <Badge
                  variant={getCategoryVariant(exam.exam_category)}
                  text={exam.exam_category}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Sequence Order
                </label>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  #{exam.sequence_order}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> This exam configuration defines a type/category of exam that can be used across the school.
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        type="danger"
        title="Delete Exam Configuration"
        message={`Are you sure you want to delete "${exam.exam_name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  );
};

export default ExamDetail;
