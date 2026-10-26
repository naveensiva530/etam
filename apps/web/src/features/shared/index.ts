/**
 * Shared feature — barrel export.
 *
 * Contains components, hooks, and types used by both Student and Staff features.
 *
 * @example
 *   import { FormField, SearchableDropdown } from '@/features/shared';
 *   import type { BloodGroupType, StudentRecord } from '@/features/shared';
 */

// Components
export { FormField } from './components/fields/FormField';
export { SearchableDropdown } from './components/fields/SearchableDropdown';
export type { DropdownOption } from './components/fields/SearchableDropdown';
export { PhotoUploadField } from './components/fields/PhotoUploadField';
export { MemberReadOnlyForm, ReadOnlyCard } from './components/MemberReadOnlyForm';
export type { ReadOnlyField } from './components/MemberReadOnlyForm';
export { DeleteConfirmation } from './components/DeleteConfirmation';
export { MemberActionsMenu } from './components/MemberActionsMenu';
export { MemberManagementView } from './components/MemberManagementView';
export { MemberManagementToolbar } from './components/MemberManagementToolbar';

// Hooks
export { useDepartments } from './hooks/useDepartments';
export type { UseDepartmentsReturn } from './hooks/useDepartments';

// Types
export type {
  InstitutionType,
  GenderType,
  BloodGroupType,
  StudentStatus,
  StudentRecord,
  StudentInput,
  StaffRecord,
  StaffInput,
  StaffType,
  StaffTeachingScope,
} from './types/common.types';
