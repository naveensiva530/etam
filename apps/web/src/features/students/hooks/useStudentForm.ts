import { useCallback, useEffect, useState } from 'react';
import { useInstitution } from '@/context/InstitutionContext';
import { getStudentApiError } from '@/features/students/api';
import { BloodGroupType, GenderType, StudentInput, StudentRecord, StudentStatus } from '@/features/shared';

export type StudentFormMode = 'add' | 'edit';

export const BLOOD_GROUPS: BloodGroupType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const ACADEMIC_YEARS: string[] = [];

export interface UseStudentFormOptions {
  mode: StudentFormMode;
  initialStudent?: StudentRecord;
  existingAdmissionIds: string[];
  onSaveStudent: (student: StudentInput) => Promise<StudentRecord>;
  onClose: () => void;
}

export interface UseStudentFormReturn {
  // field values
  admissionId: string;
  studentId: string;
  studentName: string;
  department: string;
  academicYear: string;
  gender: GenderType;
  dateOfJoining: string;
  parentName: string;
  parentMobile: string;
  studentMobile: string;
  dob: string;
  category: string;
  subcategory: string;
  additionalDepartment: string;
  residenceType: 'Day Scholar' | 'Hosteller';
  communicationAddress: string;
  pinZip: string;
  bloodGroup: BloodGroupType;
  status: StudentStatus;

  // field setters
  setAdmissionId: (v: string) => void;
  setStudentId: (v: string) => void;
  setStudentName: (v: string) => void;
  setDepartment: (v: string) => void;
  setAcademicYear: (v: string) => void;
  setGender: (v: GenderType) => void;
  setDateOfJoining: (v: string) => void;
  setParentName: (v: string) => void;
  setParentMobile: (v: string) => void;
  setStudentMobile: (v: string) => void;
  setDob: (v: string) => void;
  setCategory: (v: string) => void;
  setSubcategory: (v: string) => void;
  setAdditionalDepartment: (v: string) => void;
  setResidenceType: (v: 'Day Scholar' | 'Hosteller') => void;
  setCommunicationAddress: (v: string) => void;
  setPinZip: (v: string) => void;
  setBloodGroup: (v: BloodGroupType) => void;
  setStatus: (v: StudentStatus) => void;

  // validation rules derived from institutionType + dob
  isParentNameRequired: boolean;
  isParentMobileRequired: boolean;
  isStudentMobileRequired: boolean;
  isDobRequired: boolean;
  // submit state
  errors: Record<string, string>;
  clearFieldError: (field: string) => void;
  isSubmitting: boolean;
  submitError: string;

  // actions
  handleSubmitSingle: (
    e: React.FormEvent,
    photoUrl: string,
  ) => Promise<void>;
  resetForm: () => void;
}

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

function buildDefaultForm(institutionType: string, initialStudent?: StudentRecord) {
  return {
    admissionId: initialStudent?.admissionId ?? '',
    studentId: initialStudent?.studentId ?? '',
    studentName: initialStudent?.studentName ?? '',
    department: initialStudent?.department ?? '',
    academicYear: initialStudent?.academicYear ?? '',
    gender: (initialStudent?.gender ?? 'Male') as GenderType,
    dateOfJoining:
      initialStudent?.dateOfJoining ?? new Date().toISOString().split('T')[0],
    parentName: initialStudent?.parentName ?? '',
    parentMobile: initialStudent?.parentMobile ?? '',
    studentMobile: initialStudent?.studentMobile ?? '',
    dob: initialStudent?.dob ?? '',
    bloodGroup: (initialStudent?.bloodGroup ?? 'O+') as BloodGroupType,
    category: initialStudent?.category ?? '',
    subcategory: initialStudent?.subcategory ?? '',
    additionalDepartment: initialStudent?.additionalDepartment ?? '',
    residenceType: initialStudent?.residenceType ?? 'Day Scholar',
    communicationAddress: initialStudent?.communicationAddress ?? '',
    pinZip: initialStudent?.pinZip ?? '',
    status: initialStudent?.status === 'Archived' ? 'Active' : (initialStudent?.status ?? 'Active'),
  };
}

export function useStudentForm({
  mode,
  initialStudent,
  existingAdmissionIds,
  onSaveStudent,
  onClose,
}: UseStudentFormOptions): UseStudentFormReturn {
  const { institutionType, config } = useInstitution();

  const defaultForm = buildDefaultForm(institutionType, initialStudent);

  const [admissionId, setAdmissionId] = useState(defaultForm.admissionId);
  const [studentId, setStudentId] = useState(defaultForm.studentId);
  const [studentName, setStudentName] = useState(defaultForm.studentName);
  const [department, setDepartment] = useState(defaultForm.department);
  const [academicYear, setAcademicYear] = useState(defaultForm.academicYear);
  const [gender, setGender] = useState<GenderType>(defaultForm.gender);
  const [dateOfJoining, setDateOfJoining] = useState(defaultForm.dateOfJoining);
  const [parentName, setParentName] = useState(defaultForm.parentName);
  const [parentMobile, setParentMobile] = useState(defaultForm.parentMobile);
  const [studentMobile, setStudentMobile] = useState(defaultForm.studentMobile);
  const [dob, setDob] = useState(defaultForm.dob);
  const [bloodGroup, setBloodGroup] = useState<BloodGroupType>(defaultForm.bloodGroup);
  const [category, setCategory] = useState(defaultForm.category);
  const [subcategory, setSubcategory] = useState(defaultForm.subcategory);
  const [additionalDepartment, setAdditionalDepartment] = useState(defaultForm.additionalDepartment);
  const [residenceType, setResidenceType] = useState<'Day Scholar' | 'Hosteller'>(defaultForm.residenceType);
  const [communicationAddress, setCommunicationAddress] = useState(defaultForm.communicationAddress);
  const [pinZip, setPinZip] = useState(defaultForm.pinZip);
  const [status, setStatus] = useState<StudentStatus>(defaultForm.status);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Re-populate fields when entering edit mode or when initialStudent changes
  useEffect(() => {
    if (mode === 'edit' && initialStudent) {
      setAdmissionId(initialStudent.admissionId);
      setStudentId(initialStudent.studentId);
      setStudentName(initialStudent.studentName);
      setDepartment(initialStudent.department);
      setAcademicYear(initialStudent.academicYear);
      setGender(initialStudent.gender);
      setDateOfJoining(initialStudent.dateOfJoining);
      setParentName(initialStudent.parentName ?? '');
      setParentMobile(initialStudent.parentMobile ?? '');
      setStudentMobile(initialStudent.studentMobile ?? '');
      setDob(initialStudent.dob ?? '');
      setBloodGroup(initialStudent.bloodGroup ?? 'O+');
      setCategory(initialStudent.category ?? '');
      setSubcategory(initialStudent.subcategory ?? '');
      setAdditionalDepartment(initialStudent.additionalDepartment ?? '');
      setResidenceType(initialStudent.residenceType ?? 'Day Scholar');
      setCommunicationAddress(initialStudent.communicationAddress ?? '');
      setPinZip(initialStudent.pinZip ?? '');
      setStatus(initialStudent.status === 'Archived' ? 'Active' : initialStudent.status);
      setErrors({});
      setSubmitError('');
    }
  }, [mode, initialStudent]);

  // Derived validation rules
  const isUnder18 = dob ? calculateAge(dob) < 18 : false;
  const isParentNameRequired =
    institutionType === 'School' || (institutionType === 'Training' && isUnder18);
  const isParentMobileRequired =
    institutionType === 'School' || (institutionType === 'Training' && isUnder18);
  const isStudentMobileRequired =
    institutionType === 'College' || institutionType === 'Training';
  const isDobRequired =
    institutionType === 'School' || institutionType === 'Training';
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validateSingleForm = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const todayStr = new Date().toISOString().split('T')[0];

    if (!admissionId.trim()) {
      errs.admissionId = 'Register number is mandatory';
    } else if (
      existingAdmissionIds.includes(admissionId.trim()) &&
      admissionId.trim() !== initialStudent?.admissionId
    ) {
      errs.admissionId = 'Register number must be unique (duplicate detected)';
    }

    if (!studentName.trim()) {
      errs.studentName = 'Student name is mandatory';
    } else if (studentName.trim().length > 100 || !/^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u.test(studentName.trim())) {
      errs.studentName = 'Enter a valid full name (maximum 100 characters)';
    }

    if (!department) {
      errs.department = `${config.classFieldLabel} is mandatory`;
    }

    if (!academicYear) {
      errs.academicYear = 'Academic year is mandatory';
    }

    if (!dateOfJoining) {
      errs.dateOfJoining = 'Date of joining is mandatory';
    } else if (dateOfJoining > todayStr) {
      errs.dateOfJoining = 'Date of joining cannot be in the future';
    }

    if (isParentNameRequired && !parentName.trim()) {
      errs.parentName = `Parent name is mandatory${institutionType === 'Training' ? ' (Candidate is under 18)' : ''}`;
    } else if (parentName && (parentName.trim().length > 100 || !/^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u.test(parentName.trim()))) {
      errs.parentName = 'Enter a valid parent / guardian name (maximum 100 characters)';
    }

    if (isParentMobileRequired && !parentMobile.trim()) {
      errs.parentMobile = `Parent mobile is mandatory${institutionType === 'Training' ? ' (Candidate is under 18)' : ''}`;
    } else if (parentMobile && !/^[6-9]\d{9}$/.test(parentMobile.trim())) {
      errs.parentMobile = 'Must be a 10-digit number starting with 6-9';
    }

    if (isStudentMobileRequired && !studentMobile.trim()) {
      errs.studentMobile = 'Student mobile is mandatory';
    } else if (studentMobile && !/^[6-9]\d{9}$/.test(studentMobile.trim())) {
      errs.studentMobile = 'Must be a 10-digit number starting with 6-9';
    }

    if (isDobRequired && !dob) {
      errs.dob = 'Date of birth is mandatory';
    } else if (dob && dob >= todayStr) {
      errs.dob = 'Date of birth must be in the past';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [
    admissionId, studentId, studentName, department, academicYear,
    dateOfJoining, parentName, parentMobile, studentMobile, dob, bloodGroup,
    existingAdmissionIds, initialStudent, config,
    isParentNameRequired, isParentMobileRequired, isStudentMobileRequired,
    isDobRequired, institutionType,
  ]);

  const handleSubmitSingle = useCallback(async (
    e: React.FormEvent,
    photoUrl: string,
  ) => {
    e.preventDefault();
    if (!validateSingleForm()) return;

    const payload: StudentInput = {
      admissionId: admissionId.trim(),
      studentId: studentId.trim() || admissionId.trim(),
      studentName: studentName.trim(),
      institution: institutionType,
      department,
      academicYear,
      gender,
      photoUrl: photoUrl || undefined,
      dateOfJoining,
      parentName: parentName.trim() || undefined,
      parentMobile: parentMobile.trim() || undefined,
      studentMobile: studentMobile.trim() || undefined,
      dob: dob || undefined,
      bloodGroup: bloodGroup || undefined,
      category: category.trim() || undefined,
      subcategory: subcategory.trim() || undefined,
      additionalDepartment: additionalDepartment.trim() || undefined,
      residenceType,
      communicationAddress: communicationAddress.trim() || undefined,
      pinZip: pinZip.trim() || undefined,
      status,
    };

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSaveStudent(payload);
      onClose();
    } catch (error) {
      setSubmitError(getStudentApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateSingleForm, admissionId, studentId, studentName, institutionType,
    department, academicYear, gender, dateOfJoining, parentName, parentMobile,
    studentMobile, dob, bloodGroup, category, subcategory, additionalDepartment, residenceType,
    communicationAddress, pinZip, status, initialStudent, onSaveStudent, onClose,
  ]);

  const resetForm = useCallback(() => {
    const defaults = buildDefaultForm(institutionType, undefined);
    setAdmissionId(defaults.admissionId);
    setStudentId(defaults.studentId);
    setStudentName(defaults.studentName);
    setDepartment(defaults.department);
    setAcademicYear(defaults.academicYear);
    setGender(defaults.gender);
    setDateOfJoining(defaults.dateOfJoining);
    setParentName(defaults.parentName);
    setParentMobile(defaults.parentMobile);
    setStudentMobile(defaults.studentMobile);
    setDob(defaults.dob);
    setBloodGroup(defaults.bloodGroup);
    setCategory(defaults.category);
    setSubcategory(defaults.subcategory);
    setAdditionalDepartment(defaults.additionalDepartment);
    setResidenceType(defaults.residenceType);
    setCommunicationAddress(defaults.communicationAddress);
    setPinZip(defaults.pinZip);
    setStatus(defaults.status);
    setErrors({});
    setSubmitError('');
  }, [institutionType]);

  return {
    admissionId, studentId, studentName, department, academicYear, gender,
    dateOfJoining, parentName, parentMobile, studentMobile, dob, bloodGroup,
    category, subcategory, additionalDepartment, residenceType, communicationAddress, pinZip, status,
    setAdmissionId, setStudentId, setStudentName, setDepartment, setAcademicYear,
    setGender, setDateOfJoining, setParentName, setParentMobile, setStudentMobile,
    setDob, setCategory, setSubcategory, setAdditionalDepartment, setResidenceType, setCommunicationAddress,
    setPinZip, setBloodGroup, setStatus,
    isParentNameRequired, isParentMobileRequired, isStudentMobileRequired,
    isDobRequired,
    errors, clearFieldError, isSubmitting, submitError,
    handleSubmitSingle, resetForm,
  };
}
