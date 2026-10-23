import React from 'react';
import { StaffFormShell, StaffFormShellProps } from './common/StaffFormShell';

export type AddStaffProps = Omit<StaffFormShellProps, 'mode' | 'initialStaff'>;

/**
 * AddStaff — entry point for onboarding new faculty & staff.
 * Defaults to mode="add".
 */
export const AddStaff: React.FC<AddStaffProps> = (props) => {
  return <StaffFormShell {...props} mode="add" />;
};
