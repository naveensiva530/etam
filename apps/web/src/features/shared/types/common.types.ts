/**
 * Shared types used across Student and Staff features.
 *
 * @module shared/types/common.types
 */

export type InstitutionType = 'School' | 'College' | 'Training';

export type GenderType = 'Male' | 'Female' | 'Other';

export type BloodGroupType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type StudentStatus = 'Active' | 'Pending' | 'Inactive';

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

export type StaffType = 'Teaching' | 'Non-Teaching' | 'Other';

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
