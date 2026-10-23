import React from 'react';
import { StaffRecord } from '@/features/shared';
import { StaffFormShell, StaffFormShellProps } from './common/StaffFormShell';

export type EditStaffProps = Omit<StaffFormShellProps, 'mode' | 'initialStaff'> & {
  staff: StaffRecord;
};

/**
 * EditStaff — entry point for editing existing staff members.
 * Requires `staff` prop.
 */
export const EditStaff: React.FC<EditStaffProps> = ({ staff, ...props }) => {
  return <StaffFormShell {...props} mode="edit" initialStaff={staff} />;
};
