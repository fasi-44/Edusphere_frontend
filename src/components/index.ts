/**
 * Centralized component exports
 * Allows for cleaner imports: import { Button, Badge } from '@/components'
 */

// Common Components
export { default as PageHeader } from './common/PageHeader';
export { default as LoadingSpinner } from './common/LoadingSpinner';
export { default as EmptyState } from './common/EmptyState';
export { default as Stepper } from './common/Stepper';
export { default as PrintActions } from './common/PrintActions';
export { LazyImage, ImagePlaceholder } from './common/LazyImage';

// Card Components
export { default as StatCard } from './cards/StatCard';

// UI Components
export { default as Button } from './ui/Button';
export { default as Badge } from './ui/Badge';

// Form Components
export { default as FormField } from './forms/FormField';
export { default as FormInput } from './forms/FormInput';
export { default as FormSelect } from './forms/FormSelect';
export { default as FormTextarea } from './forms/FormTextarea';

// Table Components
export { default as DataTable } from './tables/DataTable';

// Modal Components
export { default as Modal } from './modals/Modal';
export { default as ConfirmDialog } from './modals/ConfirmDialog';

// Timetable Components
export { default as TimetableGrid } from './timetable/TimetableGrid';
export { default as SubjectDialog } from './timetable/SubjectDialog';
export { default as ConflictDialog } from './timetable/ConflictDialog';
