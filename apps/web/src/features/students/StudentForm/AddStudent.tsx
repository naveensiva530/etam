import React from 'react';
import { StudentFormShell, StudentFormShellProps } from './common/StudentFormShell';

export type AddStudentProps = Omit<StudentFormShellProps, 'mode' | 'initialStudent'>;

/**
 * Entry point for adding a new student.
 * Accepts initialMode so callers can open directly to 'bulk' tab.
 */
export const AddStudent: React.FC<AddStudentProps> = (props) => (
  <StudentFormShell {...props} mode="add" />
);
