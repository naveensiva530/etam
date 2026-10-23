import React from 'react';
import { StaffRecord } from '@/features/shared';
import { DeleteConfirmation } from '@/features/shared';

interface DeleteStaffProps {
  staff: StaffRecord;
  error?: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation dialog for moving a staff member to the recycle bin.
 * Uses the shared DeleteConfirmation layout.
 */
export const DeleteStaff: React.FC<DeleteStaffProps> = ({
  staff,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}) => (
  <DeleteConfirmation
    title={`Delete Staff Member (${staff.staffId})`}
    description={`Are you sure you want to move ${staff.name} to the recycle bin?`}
    error={error}
    isDeleting={isDeleting}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);
