import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IExam, ISubject } from '@/types';
import { examService } from '@/services/modules/examService';
import { classService } from '@/services/modules/classService';
import { subjectService } from '@/services/modules/subjectService';
import Button from '@/components/ui/Button';
import FormSelect from '@/components/forms/FormSelect';
import FormInput from '@/components/forms/FormInput';
import FormField from '@/components/forms/FormField';
import DataTable from '@/components/tables/DataTable';
import Modal from '@/components/modals/Modal';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface IExamSchedule {
  id?: string;
  examId: string;
  classId: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
}

interface IScheduleFormData {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface IScheduleFormErrors {
  subject?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

interface IExamScheduleTabProps {
  exam: IExam;
}

const ExamScheduleTab: FC<IExamScheduleTabProps> = ({ exam }) => {
  // State management
  const [selectedClass, setSelectedClass] = useState<string>(exam.classIds[0] || '');
  const [schedules, setSchedules] = useState<IExamSchedule[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<IExamSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<IScheduleFormData>({
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    room: ''
  });

  const [formErrors, setFormErrors] = useState<IScheduleFormErrors>({});

  // Fetch classes, schedules, and subjects
  useEffect(() => {
    fetchClasses();
    fetchSchedules();
  }, [exam.id]);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjectsForClass(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await classService.list();
      setClasses(response.data || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await examService.getSchedule(exam.id);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsForClass = async (classId: string) => {
    try {
      const response = await subjectService.listByClass(classId);
      setSubjects(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
      setSubjects([]);
    }
  };

  // Validation functions
  const validateForm = (): boolean => {
    const errors: IScheduleFormErrors = {};

    // Subject validation
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    // Date validation
    if (!formData.date) {
      errors.date = 'Exam date is required';
    } else {
      const scheduleDate = new Date(formData.date);
      const examStart = new Date(exam.startDate);
      const examEnd = new Date(exam.endDate);

      if (scheduleDate < examStart || scheduleDate > examEnd) {
        errors.date = `Date must be between ${formatDate(exam.startDate)} and ${formatDate(exam.endDate)}`;
      }
    }

    // Start time validation
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    // End time validation
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
      errors.endTime = 'End time must be after start time';
    }

    // Check for duplicate schedule (same subject, same date, same class)
    const hasDuplicate = schedules.some(s =>
      s.classId === selectedClass &&
      s.subject === formData.subject &&
      s.date === formData.date &&
      (!editingSchedule || s.id !== editingSchedule.id)
    );

    if (hasDuplicate) {
      errors.subject = 'This subject is already scheduled for this date in this class';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSchedule = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const scheduleData = {
        classId: selectedClass,
        subject: formData.subject,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room || undefined
      };

      if (editingSchedule && editingSchedule.id) {
        await examService.updateSchedule(exam.id, editingSchedule.id, scheduleData);
        toast.success('Schedule updated successfully');
      } else {
        await examService.createSchedule(exam.id, scheduleData);
        toast.success('Schedule created successfully');
      }

      // Reset form and refresh
      resetForm();
      setShowModal(false);
      await fetchSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteConfirm) return;

    try {
      await examService.deleteSchedule(exam.id, deleteConfirm);
      toast.success('Schedule deleted successfully');
      setDeleteConfirm(null);
      await fetchSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete schedule');
    }
  };

  const handleEditSchedule = (schedule: IExamSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      subject: schedule.subject,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      date: '',
      startTime: '',
      endTime: '',
      room: ''
    });
    setFormErrors({});
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get class name
  const getClassName = (classId: string): string => {
    return classes.find(c => c.id === classId)?.class_name || classId;
  };

  // Filter schedules for selected class
  const classSchedules = schedules.filter(s => s.classId === selectedClass);

  // Table columns
  const columns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      )
    },
    {
      key: 'date',
      label: 'Exam Date',
      render: (value: string) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'time',
      label: 'Time',
      render: (_: any, row: IExamSchedule) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {row.startTime} - {row.endTime}
        </div>
      )
    },
    {
      key: 'room',
      label: 'Room',
      render: (value?: string) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {value || '-'}
        </div>
      )
    }
  ];

  if (loading && schedules.length === 0) {
    return <LoadingSpinner message="Loading schedules..." />;
  }

  return (
    <div className="space-y-6">
      {/* Class Selector and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 min-w-0">
          <FormField label="Select Class" required>
            <FormSelect
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={exam.classIds.map(id => ({
                value: id,
                label: getClassName(id)
              }))}
            />
          </FormField>
        </div>
        <Button
          variant="primary"
          onClick={handleAddSchedule}
          className="w-full sm:w-auto"
        >
          + Add Subject Schedule
        </Button>
      </div>

      {/* Schedule Table */}
      {classSchedules.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <DataTable
            columns={columns}
            data={classSchedules}
            loading={false}
            actions={(row: IExamSchedule) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => handleEditSchedule(row)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteConfirm(row.id || '')}
                >
                  Delete
                </Button>
              </div>
            )}
          />
        </div>
      ) : (
        <EmptyState
          icon="📅"
          title="No Schedules"
          description={selectedClass ? 'Add subject schedules for this class' : 'Select a class first'}
          action={selectedClass ? (
            <Button variant="primary" onClick={handleAddSchedule}>
              + Add First Schedule
            </Button>
          ) : undefined}
        />
      )}

      {/* Add/Edit Schedule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
          setEditingSchedule(null);
        }}
        title={editingSchedule ? 'Edit Schedule' : 'Add Subject Schedule'}
        size="md"
      >
        <div className="space-y-4">
          {/* Subject */}
          <FormField
            label="Subject"
            required
            error={formErrors.subject}
          >
            <FormSelect
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                setFormErrors({ ...formErrors, subject: '' });
              }}
              options={subjects.map(s => ({
                value: s.id,
                label: s.subject_name
              }))}
              placeholder="Select subject"
            />
          </FormField>

          {/* Exam Date */}
          <FormField
            label="Exam Date"
            required
            error={formErrors.date}
            help={`Must be between ${formatDate(exam.startDate)} and ${formatDate(exam.endDate)}`}
          >
            <FormInput
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                setFormErrors({ ...formErrors, date: '' });
              }}
              min={exam.startDate}
              max={exam.endDate}
            />
          </FormField>

          {/* Start Time and End Time */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Time"
              required
              error={formErrors.startTime}
            >
              <FormInput
                type="time"
                value={formData.startTime}
                onChange={(e) => {
                  setFormData({ ...formData, startTime: e.target.value });
                  setFormErrors({ ...formErrors, startTime: '' });
                }}
              />
            </FormField>

            <FormField
              label="End Time"
              required
              error={formErrors.endTime}
            >
              <FormInput
                type="time"
                value={formData.endTime}
                onChange={(e) => {
                  setFormData({ ...formData, endTime: e.target.value });
                  setFormErrors({ ...formErrors, endTime: '' });
                }}
              />
            </FormField>
          </div>

          {/* Room (Optional) */}
          <FormField label="Room (Optional)">
            <FormInput
              type="text"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g., Room 1A, Lab Block A"
            />
          </FormField>

          {/* Modal Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
                setEditingSchedule(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSchedule}
              isLoading={submitting}
              loadingText="Saving..."
            >
              {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        type="danger"
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        onConfirm={handleDeleteSchedule}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default ExamScheduleTab;
