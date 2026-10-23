import React from 'react';
import { Briefcase } from 'lucide-react';
import { StaffRecord } from '@/features/shared';
import { useInstitution } from '@/context/InstitutionContext';
import { MemberReadOnlyForm } from '@/features/shared';

interface ViewStaffProps {
  staff: StaffRecord;
  onClose: () => void;
}

/**
 * Read-only staff details follow the same field order and photo layout as Add Staff.
 */
export const ViewStaff: React.FC<ViewStaffProps> = ({ staff, onClose }) => {
  const { config } = useInstitution();

  return (
    <MemberReadOnlyForm
      title={`Staff Profile (${staff.staffId})`}
      icon={<Briefcase className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
      onClose={onClose}
      fields={[
        { label: 'Staff ID', value: staff.staffId },
        { label: 'Full Name', value: staff.name },
        { label: 'Designation / Role', value: staff.role },
        { label: config.classFieldLabel || 'Department', value: staff.department },
        { label: 'Qualification', value: staff.qualification },
        { label: 'Official Email', value: staff.email },
        { label: 'Photo', imageUrl: staff.photoUrl },
        { label: 'Mobile Number', value: staff.mobile },
        { label: 'Date of Joining', value: staff.dateOfJoining },
        { label: 'Blood Group', value: staff.bloodGroup || 'Not Specified' },
        { label: 'Employment Status', value: staff.status },
      ]}
    />
  );
};
