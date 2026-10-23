import type { InstitutionType, GenderType, BloodGroupType, StudentStatus } from '@/features/shared';

export type { InstitutionType, GenderType, BloodGroupType, StudentStatus };

export interface StudentRecord {
  id: string;
  admissionId: string;
  studentId: string; // Roll number
  studentName: string;
  institution: InstitutionType;
  department: string; // Class for School, Department for College, Course for Training
  academicYear: string;
  gender: GenderType;
  photoUrl?: string;
  dateOfJoining: string;
  parentName?: string;
  parentMobile?: string;
  studentMobile?: string;
  dob?: string;
  category?: string;
  subcategory?: string;
  additionalDepartment?: string;
  residenceType?: 'Day Scholar' | 'Hosteller';
  communicationAddress?: string;
  pinZip?: string;
  bloodGroup?: BloodGroupType;
  status: StudentStatus | 'Archived';
  createdAt: string;
}

export type StudentInput = Omit<StudentRecord, 'id' | 'createdAt'>;
