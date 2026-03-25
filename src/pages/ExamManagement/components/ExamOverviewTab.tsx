import { FC } from 'react';
import { IExam, IClass } from '@/types';
import Badge from '@/components/ui/Badge';

interface IExamOverviewTabProps {
  exam: IExam;
  classes: IClass[];
  scheduledCount?: number;
}

const ExamOverviewTab: FC<IExamOverviewTabProps> = ({ exam, classes, scheduledCount = 0 }) => {
  // Get class names for the exam
  const examClasses = classes.filter(c => exam.classIds.includes(String(c.id)));

  // Calculate duration in days
  const startDate = new Date(exam.startDate);
  const endDate = new Date(exam.endDate);
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color variant
  const getStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' => {
    switch (status) {
      case 'SCHEDULED':
        return 'info';
      case 'ONGOING':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Get exam type display
  const getExamTypeDisplay = (type: string): string => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Exam Information</h3>

            <div className="space-y-4">
              {/* Type and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Exam Type</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {getExamTypeDisplay(exam.type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  <Badge
                    variant={getStatusVariant(exam.status)}
                    text={exam.status.charAt(0) + exam.status.slice(1).toLowerCase()}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* Dates and Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {formatDate(exam.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">End Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {formatDate(exam.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {durationDays} day{durationDays !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Divider */}
              {exam.description && <div className="border-t border-gray-200 dark:border-gray-700"></div>}

              {/* Description */}
              {exam.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
                  <p className="text-base text-gray-900 dark:text-gray-100 line-clamp-3">
                    {exam.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Classes Involved */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Classes Involved</h3>

            {examClasses.length > 0 ? (
              <div className="space-y-2">
                {examClasses.map((examClass) => (
                  <div
                    key={examClass.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <span className="text-lg">🎓</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {examClass.class_name}
                      </p>
                      {examClass.section && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Section: {examClass.section}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No classes assigned</p>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">Quick Stats</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total Classes</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {exam.classIds.length}
                </p>
              </div>

              <div className="border-t border-blue-200 dark:border-blue-800"></div>

              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Scheduled Subjects</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {scheduledCount}
                </p>
              </div>

              <div className="border-t border-blue-200 dark:border-blue-800"></div>

              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Results Published</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block w-3 h-3 rounded-full ${exam.publishResults ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {exam.publishResults ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Exam ID</p>
                <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded break-all">
                  {exam.id}
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Created</p>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(exam.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamOverviewTab;
