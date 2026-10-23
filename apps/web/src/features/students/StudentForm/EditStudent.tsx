import React from 'react';
import { StudentRecord } from '@/features/shared';
import { StudentFormShell, StudentFormShellProps } from './common/StudentFormShell';

type EditStudentProps = Omit<StudentFormShellProps, 'mode' | 'initialStudent'> & {
  /** The existing student record to edit — required for edit mode */
  student: StudentRecord;
};

/**
 * Entry point for editing an existing student.
 * Sets mode='edit' and passes the student as initialStudent.
 */
export const EditStudent: React.FC<EditStudentProps> = ({ student, ...props }) => (
  <StudentFormShell {...props} mode="edit" initialStudent={student} />
);
