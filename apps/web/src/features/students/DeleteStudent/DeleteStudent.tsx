import React from 'react';
import { StudentRecord } from '@/features/shared';
import { DeleteConfirmation } from '@/features/shared';

interface DeleteStudentProps {
  student: StudentRecord;
  error?: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation dialog for moving a student to the recycle bin.
 * Uses the shared DeleteConfirmation layout.
 */
export const DeleteStudent: React.FC<DeleteStudentProps> = ({
  student,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}) => (
  <DeleteConfirmation
    title={`Delete Student (${student.admissionId})`}
    description={`Are you sure you want to move ${student.studentName} to the recycle bin?`}
    error={error}
    isDeleting={isDeleting}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);
