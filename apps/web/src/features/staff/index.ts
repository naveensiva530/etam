/**
 * Staff feature — barrel export.
 * 
 * Consumers import from '@/features/staff' without caring
 * about internal folder paths.
 * 
 * @example
 *   import { AddStaff, EditStaff, ViewStaff, DeleteStaff } from '@/features/staff';
 */

export { StaffManagementPage } from './StaffManagementPage';
export { StaffTable } from './components/StaffTable';

export { AddStaff } from './StaffForm/AddStaff';
export type { AddStaffProps } from './StaffForm/AddStaff';

export { EditStaff } from './StaffForm/EditStaff';
export type { EditStaffProps } from './StaffForm/EditStaff';

export { ViewStaff } from './ViewStaff/ViewStaff';
export { DeleteStaff } from './DeleteStaff/DeleteStaff';

export * from './types';
export * from './hooks';
export * from './api';
