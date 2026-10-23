import React, { useEffect, useRef, useState } from 'react';
import { FormField, PhotoUploadField, SearchableDropdown } from '@/features/shared';
import type { DropdownOption, GenderType } from '@/features/shared';
import { getAcademicConfigurations } from '@/features/academic-config/api';
import type { AcademicConfigItem } from '@/features/academic-config/types';

export interface StudentFieldsGridProps {
  // Field values
  admissionId: string;
  dateOfJoining: string;
  studentName: string;
  department: string;
  academicYear: string;
  gender: GenderType;
  photoUrl: string;
  parentName: string;
  parentMobile: string;
  studentMobile: string;
  dob: string;
  subcategory: string;
  additionalDepartment: string;
  residenceType: 'Day Scholar' | 'Hosteller';
  communicationAddress: string;
  pinZip: string;
  status: 'Active' | 'Pending' | 'Inactive';

  // Field setters
  setAdmissionId: (v: string) => void;
  setDateOfJoining: (v: string) => void;
  setStudentName: (v: string) => void;
  setDepartment: (v: string) => void;
  setAcademicYear: (v: string) => void;
  setGender: (v: GenderType) => void;
  setParentName: (v: string) => void;
  setParentMobile: (v: string) => void;
  setStudentMobile: (v: string) => void;
  setDob: (v: string) => void;
  setSubcategory: (v: string) => void;
  setAdditionalDepartment: (v: string) => void;
  setResidenceType: (v: 'Day Scholar' | 'Hosteller') => void;
  setCommunicationAddress: (v: string) => void;
  setPinZip: (v: string) => void;
  setStatus: (v: 'Active' | 'Pending' | 'Inactive') => void;

  // Validation
  errors: Record<string, string>;
  clearFieldError: (field: string) => void;

  // Conditional requirements
  isParentNameRequired: boolean;
  isParentMobileRequired: boolean;
  isStudentMobileRequired: boolean;
  isDobRequired: boolean;

  // Photo upload
  photoError?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto?: () => void;

}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 ' +
  'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 ' +
  'focus:ring-gray-900 dark:focus:ring-gray-100';

const SELECT_CLASS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 ' +
  'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none';

/**
 * Renders the student form fields in a responsive 3-column grid.
 * Pure presentational — no internal state. All values and handlers come from hooks above.
 */
export const StudentFieldsGrid: React.FC<StudentFieldsGridProps> = ({
  admissionId, dateOfJoining, studentName, department, academicYear, gender,
  photoUrl, parentName, parentMobile, studentMobile, dob,
  subcategory, additionalDepartment,
  residenceType, communicationAddress, pinZip, status,
  setAdmissionId, setDateOfJoining, setStudentName, setDepartment, setAcademicYear,
  setGender, setParentName, setParentMobile, setStudentMobile,
  setDob, setSubcategory, setAdditionalDepartment, setResidenceType, setCommunicationAddress,
  setPinZip, setStatus,
  errors, clearFieldError,
  isParentNameRequired, isParentMobileRequired, isStudentMobileRequired,
  isDobRequired,
  photoError, fileInputRef, onPhotoUpload, onRemovePhoto,
}) => {
  const [academicConfigs, setAcademicConfigs] = useState<AcademicConfigItem[]>([]);
  const [isAcademicConfigsLoading, setIsAcademicConfigsLoading] = useState(true);
  const [academicConfigsError, setAcademicConfigsError] = useState('');

  useEffect(() => {
    let mounted = true;
    getAcademicConfigurations()
      .then((configs) => {
        if (mounted) setAcademicConfigs(configs);
      })
      .catch((error: unknown) => {
        if (mounted) {
          setAcademicConfigsError(
            error instanceof Error ? error.message : 'Unable to load academic configurations.',
          );
        }
      })
      .finally(() => {
        if (mounted) setIsAcademicConfigsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const availableConfigs = React.useMemo(
    () => academicConfigs.filter((item) =>
      item.status === 'Active' ||
      (item.academicYear === academicYear && item.className === department),
    ),
    [academicConfigs, academicYear, department],
  );

  const academicYearOptions: DropdownOption[] = React.useMemo(
    () => Array.from(new Set(availableConfigs.map((item) => item.academicYear)))
      .map((year) => ({ value: year, label: year })),
    [availableConfigs],
  );

  const classOptions: DropdownOption[] = React.useMemo(
    () => Array.from(new Set(
      availableConfigs
        .filter((item) => item.academicYear === academicYear)
        .map((item) => item.className),
    )).map((className) => ({ value: className, label: className })),
    [availableConfigs, academicYear],
  );

  const selectedAcademicConfig = availableConfigs.find(
    (item) => item.academicYear === academicYear && item.className === department,
  );
  const configuredSubCategory = selectedAcademicConfig?.subCategory?.trim() || '';
  const currentSubCategory = subcategory || additionalDepartment;

  // Academic year dropdown state
  const [acYearOpen, setAcYearOpen] = React.useState(false);
  const [acYearSearch, setAcYearSearch] = React.useState('');
  const acYearRef = useRef<HTMLDivElement>(null);

  // Class/Course dropdown state
  const [classMenuOpen, setClassMenuOpen] = React.useState(false);
  const [classSearch, setClassSearch] = React.useState('');
  const classDropdownRef = useRef<HTMLDivElement>(null);

  const requiredStar = <span className="text-red-600 dark:text-red-400 font-bold">*</span>;
  const optional = <span className="text-gray-400 font-normal"> [O]</span>;

  return (
    <div className="space-y-4">
      {/* ── Student onboarding fields in the requested order ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label={<>Admission Number {requiredStar}</>} error={errors.admissionId}>
          <input
            type="text"
            id="admissionId"
            value={admissionId}
            onChange={(e) => { setAdmissionId(e.target.value); clearFieldError('admissionId'); }}
            placeholder="Enter admission number"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label={<>Admission Date {requiredStar}</>} error={errors.dateOfJoining}>
          <input
            type="date"
            id="dateOfJoining"
            value={dateOfJoining}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setDateOfJoining(e.target.value); clearFieldError('dateOfJoining'); }}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label={<>Academic Year {requiredStar}</>} error={errors.academicYear}>
          <div ref={acYearRef}>
            <SearchableDropdown
              value={academicYear}
              onChange={(v) => {
                setAcademicYear(v);
                setDepartment('');
                setSubcategory('');
                setAdditionalDepartment('');
                clearFieldError('academicYear');
                clearFieldError('department');
              }}
              options={academicYearOptions}
              placeholder={isAcademicConfigsLoading ? 'Loading Academic Years...' : 'Choose Academic Year'}
              loading={isAcademicConfigsLoading}
              disabled={isAcademicConfigsLoading || Boolean(academicConfigsError)}
              listboxLabel="Academic Year"
              isOpen={acYearOpen}
              onOpen={() => { setAcYearSearch(''); setAcYearOpen(true); }}
              onClose={() => setAcYearOpen(false)}
              search={acYearSearch}
              onSearchChange={setAcYearSearch}
              emptyText="No active academic years found in Academic & Subject Configuration."
            />
          </div>
          {academicConfigsError && (
            <p role="alert" className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
              Academic configuration could not be loaded: {academicConfigsError}
            </p>
          )}
        </FormField>

        <FormField label={<>Student Full Name {requiredStar}</>} error={errors.studentName}>
          <input
            type="text"
            id="studentName"
            value={studentName}
            onChange={(e) => { setStudentName(e.target.value); clearFieldError('studentName'); }}
            placeholder="Enter full name"
            maxLength={100}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField
          label={<>Date of Birth {isDobRequired ? requiredStar : optional}</>}
          error={errors.dob}
        >
          <input
            type="date"
            id="dob"
            value={dob}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setDob(e.target.value); clearFieldError('dob'); }}
            className={INPUT_CLASS}
          />
        </FormField>

        {/* Gender */}
        <FormField label={<>Gender {requiredStar}</>}>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as GenderType)}
            className={SELECT_CLASS}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </FormField>
      </div>

      {/* Let fields flow beside the photo first, then use the space below it. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <FormField
          className="md:row-span-3"
          label={<>Student Photo{optional} <span className="text-gray-400 font-normal">[JPG/PNG max 2MB]</span></>}
        >
          <PhotoUploadField
            photoUrl={photoUrl}
            error={photoError}
            fileInputRef={fileInputRef}
            onUpload={onPhotoUpload}
            onRemove={onRemovePhoto}
          />
        </FormField>

        <FormField label={<>Residence Type {requiredStar}</>}>
          <select
            id="residenceType"
            required
            value={residenceType}
            onChange={(e) => setResidenceType(e.target.value as 'Day Scholar' | 'Hosteller')}
            className={SELECT_CLASS}
          >
            <option value="Day Scholar">Day Scholar</option>
            <option value="Hosteller">Hosteller</option>
          </select>
        </FormField>

        <FormField
          label={<>Class / Course / Dept {requiredStar}</>}
          error={errors.department}
        >
          <div ref={classDropdownRef}>
            <SearchableDropdown
              value={department}
              onChange={(v) => {
                const selected = availableConfigs.find(
                  (item) => item.academicYear === academicYear && item.className === v,
                );
                setDepartment(v);
                setSubcategory(selected?.subCategory?.trim() || '');
                setAdditionalDepartment('');
                clearFieldError('department');
              }}
              options={classOptions}
              placeholder={!academicYear ? 'Choose Academic Year First' : 'Choose Class / Course / Dept'}
              disabled={!academicYear || isAcademicConfigsLoading || Boolean(academicConfigsError)}
              listboxLabel="Class / Course / Dept"
              isOpen={classMenuOpen}
              onOpen={() => { setClassSearch(''); setClassMenuOpen(true); }}
              onClose={() => setClassMenuOpen(false)}
              search={classSearch}
              onSearchChange={setClassSearch}
              emptyText="No classes or departments found for this academic year."
            />
          </div>
        </FormField>

        <FormField label={<>Sub-Category{optional}</>}>
          <select
            id="subcategory"
            value={currentSubCategory}
            onChange={(event) => {
              setSubcategory(event.target.value);
              setAdditionalDepartment('');
            }}
            disabled={!selectedAcademicConfig}
            className={SELECT_CLASS}
          >
            <option value="">{selectedAcademicConfig ? 'Choose Sub-Category' : 'Choose Class / Course / Dept First'}</option>
            {configuredSubCategory && (
              <option value={configuredSubCategory}>{configuredSubCategory}</option>
            )}
            {currentSubCategory && currentSubCategory !== configuredSubCategory && (
              <option value={currentSubCategory}>{currentSubCategory}</option>
            )}
          </select>
        </FormField>

        <FormField
          label={<>Parent / Guardian Name {isParentNameRequired ? requiredStar : optional}</>}
          error={errors.parentName}
        >
          <input
            type="text"
            id="parentName"
            value={parentName}
            onChange={(e) => { setParentName(e.target.value); clearFieldError('parentName'); }}
            placeholder="Enter parent / guardian name"
            maxLength={100}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField
          label={<>Parent / Guardian Mobile {isParentMobileRequired ? requiredStar : optional}</>}
          error={errors.parentMobile}
        >
          <input
            type="tel"
            id="parentMobile"
            value={parentMobile}
            onChange={(e) => { setParentMobile(e.target.value); clearFieldError('parentMobile'); }}
            placeholder="10 digits starting with 6-9"
            maxLength={10}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField
          label={<>Student Mobile {isStudentMobileRequired ? requiredStar : optional}</>}
          error={errors.studentMobile}
        >
          <input
            type="tel"
            id="studentMobile"
            value={studentMobile}
            onChange={(e) => { setStudentMobile(e.target.value); clearFieldError('studentMobile'); }}
            placeholder="10 digits starting with 6-9"
            maxLength={10}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Communication Address">
          <textarea
            id="communicationAddress"
            value={communicationAddress}
            onChange={(e) => { setCommunicationAddress(e.target.value); clearFieldError('communicationAddress'); }}
            rows={1}
            maxLength={2000}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="PIN / ZIP">
          <input
            type="text"
            id="pinZip"
            value={pinZip}
            onChange={(e) => { setPinZip(e.target.value); clearFieldError('pinZip'); }}
            maxLength={20}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label={<>Admission Status {requiredStar}</>}>
          <select
            id="status"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value as 'Active' | 'Pending' | 'Inactive')}
            className={SELECT_CLASS}
          >
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </FormField>
      </div>
    </div>
  );
};
