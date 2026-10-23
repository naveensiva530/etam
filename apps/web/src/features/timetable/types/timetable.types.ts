export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface DepartmentTimetableItem {
  id: string; // Academic Configuration ID
  departmentId: string; // Formatted ID e.g. N0021
  departmentName: string; // e.g. B.com 1st year, Bio-Technology 2nd year
  className: string;
  subCategory: string;
  academicYear: string;
  sections: string[];
  status: 'Created' | 'Not Created';
  timetableId: string | null;
}

export interface BreakItem {
  id: string;
  name: string; // e.g. 'Break 1'
  time: string; // formatted e.g. '00:15:00' or '15 mins'
  durationMinutes: number;
  inBetween: string; // e.g. '2 to 3'
}

export interface PeriodAllocation {
  id?: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string; // e.g. '9:30 am'
  endTime: string; // e.g. '10:00 am'
  subjectCode?: string;
  subjectName: string;
  teacherId?: string;
  teacherName: string;
  teacherAvatar?: string;
}

export interface TimetableConfig {
  id?: string;
  academicConfigurationId: string;
  departmentName: string;
  academicYear: string;
  category: string;
  subCategory: string;
  shift: string;
  totalPeriods: number;
  periodDurationMinutes: number;
  startTime: string;
  classTeacherId: string;
  classTeacherName: string;
  breaksConfig: BreakItem[];
  status: 'Created' | 'Not Created';
  allocations: PeriodAllocation[];
}

export interface TeachingStaffOption {
  staffId: string;
  name: string;
  photoUrl?: string;
  role?: string;
  department?: string;
}

export interface SubjectOption {
  code: string;
  name: string;
  type?: string;
  faculty?: string;
}

export interface TimetableOptionsResponse {
  teachingStaff: TeachingStaffOption[];
  allocatedSubjects: SubjectOption[];
  masterSubjects: SubjectOption[];
}
