/**
 * Students feature — barrel export.
 * 
 * Consumers import from '@/features/students' without caring
 * about internal folder paths.
 * 
 * @example
 *   import { AddStudent, EditStudent, ViewStudent, DeleteStudent } from '@/features/students';
 */

export { StudentManagementPage } from './StudentManagementPage';
export { StudentTable } from './components/StudentTable';

export { AddStudent } from './StudentForm/AddStudent';
export type { StudentFormShellProps as AddStudentProps } from './StudentForm/common/StudentFormShell';

export { EditStudent } from './StudentForm/EditStudent';
export { ViewStudent } from './ViewStudent/ViewStudent';
export { DeleteStudent } from './DeleteStudent/DeleteStudent';

export * from './types';
export * from './hooks';
export * from './api';
