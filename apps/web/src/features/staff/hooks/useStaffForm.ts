import { useCallback, useEffect, useState } from 'react';
import { useInstitution } from '@/context/InstitutionContext';
import { getStaffApiError } from '@/features/staff/api';
import { BloodGroupType, StaffInput, StaffRecord } from '@/features/shared';

export type StaffFormMode = 'add' | 'edit';

export const BLOOD_GROUPS: BloodGroupType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DEFAULT_STAFF_ROLES: Record<string, string[]> = {
  School: [
    'Senior Teacher',
    'Primary Teacher',
    'Headmistress',
    'Vice Principal',
    'Physical Education Teacher',
    'Special Educator',
    'Lab Assistant',
    'Librarian',
  ],
  College: [
    'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Department Head',
    'Dean',
    'Lab Instructor',
    'Research Associate',
    'Visiting Faculty',
  ],
  Training: [
    'Lead Technical Mentor',
    'Senior Instructor',
    'Corporate Trainer',
    'Curriculum Lead',
    'Bootcamp Coach',
    'Lab Administrator',
  ],
};

export interface UseStaffFormOptions {
  mode: StaffFormMode;
  initialStaff?: StaffRecord;
  existingStaffIds: string[];
  onSaveStaff: (staff: StaffInput) => Promise<StaffRecord>;
  onClose: () => void;
}

export interface UseStaffFormReturn {
  // field values
  staffId: string;
  name: string;
  role: string;
  staffType: string;
  qualification: string;
  email: string;
  mobile: string;
  dateOfJoining: string;
  status: StaffRecord['status'];

  // field setters
  setStaffId: (v: string) => void;
  setName: (v: string) => void;
  setRole: (v: string) => void;
  setStaffType: (v: string) => void;
  setQualification: (v: string) => void;
  setEmail: (v: string) => void;
  setMobile: (v: string) => void;
  setDateOfJoining: (v: string) => void;
  setStatus: (v: StaffRecord['status']) => void;

  // submit state
  errors: Record<string, string>;
  clearFieldError: (field: string) => void;
  isSubmitting: boolean;
  submitError: string;

  // actions
  handleSubmitSingle: (e: React.FormEvent, photoUrl: string) => Promise<void>;
  resetForm: () => void;
}

function getDefaultRole(institutionType: string): string {
  if (institutionType === 'School') return 'Senior Teacher';
  if (institutionType === 'College') return 'Assistant Professor';
  return 'Lead Technical Mentor';
}

function buildDefaultForm(institutionType: string, initialStaff?: StaffRecord) {
  return {
    staffId: initialStaff?.staffId ?? '',
    name: initialStaff?.name ?? '',
    role: initialStaff?.role ?? getDefaultRole(institutionType),
    staffType: initialStaff?.staffType ?? '',
    qualification: initialStaff?.qualification ?? '',
    email: initialStaff?.email ?? '',
    mobile: initialStaff?.mobile ?? '',
    dateOfJoining: initialStaff?.dateOfJoining ?? new Date().toISOString().split('T')[0],
    status: (initialStaff?.status ?? 'Active') as StaffRecord['status'],
  };
}

export function useStaffForm({
  mode,
  initialStaff,
  existingStaffIds,
  onSaveStaff,
  onClose,
}: UseStaffFormOptions): UseStaffFormReturn {
  const { institutionType } = useInstitution();

  const defaultForm = buildDefaultForm(institutionType, initialStaff);

  const [staffId, setStaffId] = useState(defaultForm.staffId);
  const [name, setName] = useState(defaultForm.name);
  const [role, setRole] = useState(defaultForm.role);
  const [staffType, setStaffType] = useState(defaultForm.staffType);
  const [qualification, setQualification] = useState(defaultForm.qualification);
  const [email, setEmail] = useState(defaultForm.email);
  const [mobile, setMobile] = useState(defaultForm.mobile);
  const [dateOfJoining, setDateOfJoining] = useState(defaultForm.dateOfJoining);
  const [status, setStatus] = useState<StaffRecord['status']>(defaultForm.status);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Sync when initialStaff changes
  useEffect(() => {
    if (initialStaff) {
      setStaffId(initialStaff.staffId);
      setName(initialStaff.name);
      setRole(initialStaff.role);
      setStaffType(initialStaff.staffType ?? '');
      setQualification(initialStaff.qualification);
      setEmail(initialStaff.email);
      setMobile(initialStaff.mobile);
      setDateOfJoining(initialStaff.dateOfJoining);
      setStatus(initialStaff.status);
      setErrors({});
      setSubmitError('');
    }
  }, [initialStaff]);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const todayStr = new Date().toISOString().split('T')[0];

    if (!staffId.trim()) {
      errs.staffId = 'Staff ID is required';
    } else if (
      mode === 'add' &&
      existingStaffIds.map((id) => id.toLowerCase()).includes(staffId.trim().toLowerCase())
    ) {
      errs.staffId = 'Staff ID already exists';
    }

    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (!/^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u.test(name.trim())) {
      errs.name = 'Name contains invalid characters';
    }

    if (!role.trim()) {
      errs.role = 'Role / Designation is required';
    }

    if (!staffType.trim()) {
      errs.staffType = 'Staff type is required';
    }

    if (!qualification.trim()) {
      errs.qualification = 'Highest qualification is required';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (!mobile.trim()) {
      errs.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      errs.mobile = 'Enter a valid 10-digit Indian mobile number';
    }

    if (!dateOfJoining) {
      errs.dateOfJoining = 'Date of joining is required';
    } else if (dateOfJoining > todayStr) {
      errs.dateOfJoining = 'Joining date cannot be in the future';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [
    staffId,
    mode,
    existingStaffIds,
    name,
    role,
    staffType,
    qualification,
    email,
    mobile,
    dateOfJoining,
  ]);

  const handleSubmitSingle = async (e: React.FormEvent, photoUrl: string) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: StaffInput = {
        staffId: staffId.trim(),
        name: name.trim(),
        role: role.trim(),
        institution: institutionType,
        staffType: staffType.trim() as StaffInput['staffType'],
        department: initialStaff?.department,
        qualification: qualification.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        dateOfJoining,
        photoUrl: photoUrl || undefined,
        bloodGroup: initialStaff?.bloodGroup,
        status,
      };

      await onSaveStaff(payload);
      onClose();
    } catch (err) {
      setSubmitError(getStaffApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = useCallback(() => {
    const fresh = buildDefaultForm(institutionType, initialStaff);
    setStaffId(fresh.staffId);
    setName(fresh.name);
    setRole(fresh.role);
    setStaffType(fresh.staffType);
    setQualification(fresh.qualification);
    setEmail(fresh.email);
    setMobile(fresh.mobile);
    setDateOfJoining(fresh.dateOfJoining);
    setStatus(fresh.status);
    setErrors({});
    setSubmitError('');
  }, [institutionType, initialStaff]);

  return {
    staffId,
    name,
    role,
    staffType,
    qualification,
    email,
    mobile,
    dateOfJoining,
    status,

    setStaffId,
    setName,
    setRole,
    setStaffType,
    setQualification,
    setEmail,
    setMobile,
    setDateOfJoining,
    setStatus,

    errors,
    clearFieldError,
    isSubmitting,
    submitError,

    handleSubmitSingle,
    resetForm,
  };
}
