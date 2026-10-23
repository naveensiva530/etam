import React from 'react';
import { GraduationCap } from 'lucide-react';
import { StudentRecord } from '@/features/shared';
import { MemberReadOnlyForm } from '@/features/shared';

interface ViewStudentProps {
  student: StudentRecord;
  onClose: () => void;
}

/** Read-only view of the student onboarding fields in their form order. */
export const ViewStudent: React.FC<ViewStudentProps> = ({ student, onClose }) => {
  return (
    <MemberReadOnlyForm
      title={`View Student Details (${student.admissionId})`}
      icon={<GraduationCap className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />}
      onClose={onClose}
      alignedPhotoFields
      fields={[
        { label: 'Admission Number', value: student.admissionId },
        { label: 'Admission Date', value: student.dateOfJoining },
        { label: 'Academic Year', value: student.academicYear },
        { label: 'Student Full Name', value: student.studentName },
        { label: 'Date of Birth', value: student.dob || 'Not Provided' },
        { label: 'Gender', value: student.gender },
        { label: 'Photo', imageUrl: student.photoUrl },
        { label: 'Residence Type', value: student.residenceType || 'Not Provided' },
        { label: 'Class / Course / Dept', value: student.department },
        { label: 'Sub-Category', value: student.subcategory || student.additionalDepartment || 'Not Provided' },
        { label: 'Parent / Guardian Name', value: student.parentName || 'Not Applicable' },
        { label: 'Parent / Guardian Mobile', value: student.parentMobile || 'Not Applicable' },
        { label: 'Student Mobile', value: student.studentMobile || 'Not Applicable' },
        { label: 'Communication Address', value: student.communicationAddress || 'Not Provided' },
        { label: 'PIN / ZIP', value: student.pinZip || 'Not Provided' },
        { label: 'Admission Status', value: student.status },
      ]}
    />
  );
};
