import type { InstitutionType, BloodGroupType, StaffType } from '@/features/shared';

export type { InstitutionType, BloodGroupType, StaffType };

export interface StaffRecord {
  id: string;
  staffId: string;
  name: string;
  role: string;
  institution: InstitutionType;
  staffType?: StaffType;
  department?: string;
  email: string;
  mobile: string;
  dateOfJoining: string;
  qualification: string;
  photoUrl?: string;
  bloodGroup?: BloodGroupType;
  status: 'Active' | 'Probation' | 'Archived';
  createdAt: string;
}

export type StaffInput = Omit<StaffRecord, 'id' | 'createdAt' | 'staffType'> & {
  staffType: StaffType;
};
