export type AcademicStatus = 'Active' | 'Inactive';

export type SubjectType = string;

export interface SubjectTypeOption {
  id: string;
  name: SubjectType;
}

export interface SectionSubject {
  id: string;
  code: string;
  name: string;
  type: SubjectType;
  credits: number;
  faculty?: string;
}

export interface AcademicConfigItem {
  id: string;
  academicYear: string;       // Mandatory (M)
  className: string;          // Mandatory (M)
  subCategory?: string;       // Sub-category (e.g. Primary, Secondary, Higher Secondary, UG, PG)
  status: AcademicStatus;     // Mandatory (M)
  sections: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface SectionSubject {
  id: string;
  code: string;
  name: string;
  type: SubjectType;
  credits: number;
  faculty?: string;
}

export interface AcademicConfigAllocations {
  studentSections: Record<string, string>;
  sectionSubjects: Record<string, SectionSubject[]>;
}

export interface SubjectMasterRecord {
  id: string;
  code: string;
  name: string;
  type: SubjectType;
  status: AcademicStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAcademicConfigDto {
  academicYear: string;       // Mandatory (M)
  className: string;          // Mandatory (M)
  subCategory?: string;       // Sub-category
  status: AcademicStatus;     // Mandatory (M)
  sections?: string[];
}

export interface UpdateAcademicConfigDto {
  academicYear?: string;
  className?: string;
  subCategory?: string;
  status?: AcademicStatus;
  sections?: string[];
}

export interface CreateSubjectMasterDto {
  code: string;
  name: string;
  type: SubjectType;
  status: AcademicStatus;
  description?: string;
}
