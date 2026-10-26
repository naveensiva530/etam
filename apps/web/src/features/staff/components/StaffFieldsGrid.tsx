import React, { useRef, useState } from 'react';
import { FormField, PhotoUploadField, SearchableDropdown } from '@/features/shared';
import type { DropdownOption, StaffRecord, StaffTeachingScope } from '@/features/shared';
import { useInstitution } from '@/context/InstitutionContext';
import { MultiSkillDropdown } from './MultiSkillDropdown';

export interface StaffFieldsGridProps {
  // Field values
  staffId: string;
  name: string;
  role: string;
  staffType: string;
  qualification: string;
  email: string;
  mobile: string;
  dateOfJoining: string;
  status: StaffRecord['status'];
  photoUrl: string;
  teachingScope: StaffTeachingScope;

  // Field setters
  setStaffId: (v: string) => void;
  setName: (v: string) => void;
  setRole: (v: string) => void;
  setStaffType: (v: string) => void;
  setQualification: (v: string) => void;
  setEmail: (v: string) => void;
  setMobile: (v: string) => void;
  setDateOfJoining: (v: string) => void;
  setStatus: (v: StaffRecord['status']) => void;
  setTeachingScope: (v: StaffTeachingScope) => void;
  photoError?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;

  // Validation
  errors: Record<string, string>;
  clearFieldError: (field: string) => void;

  staffRoles: string[];
  rolesLoading: boolean;
  onOpenRoleManager: () => void;
  staffSkills: string[];
  skillsLoading: boolean;
  onOpenSkillManager: () => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 ' +
  'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 ' +
  'focus:ring-gray-900 dark:focus:ring-gray-100';
const SELECT_CLASS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 ' +
  'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none';

/**
 * Renders the staff form fields in a responsive 3-column grid matching StudentFieldsGrid.
 */
export const StaffFieldsGrid: React.FC<StaffFieldsGridProps> = ({
  staffId,
  name,
  role,
  staffType,
  qualification,
  email,
  mobile,
  dateOfJoining,
  status,
  photoUrl,
  teachingScope,

  setStaffId,
  setName,
  setRole,
  setStaffType,
  setQualification,
  setEmail,
  setMobile,
  setDateOfJoining,
  setStatus,
  setTeachingScope,
  photoError,
  fileInputRef,
  onPhotoUpload,
  onRemovePhoto,

  errors,
  clearFieldError,

  staffRoles,
  rolesLoading,
  onOpenRoleManager,
  staffSkills,
  skillsLoading,
  onOpenSkillManager,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const { institutionType, config } = useInstitution();
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const roleOptions: DropdownOption[] = staffRoles.map((availableRole) => ({
    value: availableRole,
    label: availableRole,
  }));
  if (role && !roleOptions.some((option) => option.value === role)) {
    roleOptions.unshift({ value: role, label: role });
  }

  const requiredStar = <span className="text-red-600 dark:text-red-400 font-bold">*</span>;
  const optional = <span className="text-gray-400 font-normal"> [O]</span>;
  const updateScope = (updates: Partial<StaffTeachingScope>) => {
    setTeachingScope({ ...teachingScope, ...updates } as StaffTeachingScope);
  };
  const multiChoiceField = (
    label: string,
    options: string[],
    values: string[],
    onChange: (nextValues: string[]) => void,
  ) => (
    <FormField label={`${label} [O]`}>
      <div className="space-y-2">
        <select
          value=""
          onChange={(event) => {
            const selected = event.target.value;
            if (selected && !values.includes(selected)) onChange([...values, selected]);
          }}
          className={INPUT_CLASS}
        >
          <option value="">Choose {label.toLowerCase()}</option>
          {options.filter((option) => !values.includes(option)).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {values.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <span key={value} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
                {value}
                <button
                  type="button"
                  aria-label={`Remove ${value}`}
                  onClick={() => onChange(values.filter((item) => item !== value))}
                  className="text-gray-500 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </FormField>
  );
  const skillField = (
    label: string,
    values: string[],
    onChange: (nextValues: string[]) => void,
  ) => (
    <FormField label={`${label} [O]`}>
      <MultiSkillDropdown
        value={values}
        options={staffSkills}
        loading={skillsLoading}
        onChange={onChange}
        onManageSkills={onOpenSkillManager}
        label={label}
      />
    </FormField>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Staff ID */}
        <FormField label={<>Staff ID {requiredStar}</>} error={errors.staffId}>
          <input
            type="text"
            id="staffId"
            value={staffId}
            placeholder="e.g. STF-2026-001"
            onChange={(e) => {
              setStaffId(e.target.value.toUpperCase());
              clearFieldError('staffId');
            }}
            className={INPUT_CLASS}
          />
        </FormField>

        {/* Full Name */}
        <FormField label={<>Full Name {requiredStar}</>} error={errors.name}>
          <input
            type="text"
            id="staffName"
            value={name}
            placeholder="Letters only, 2-100 chars"
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError('name');
            }}
            className={INPUT_CLASS}
          />
        </FormField>

        {/* Role / Designation */}
        <FormField label={<>Designation / Role {requiredStar}</>} error={errors.role}>
          <SearchableDropdown
            value={role}
            onChange={(value) => {
              setRole(value);
              clearFieldError('role');
            }}
            options={roleOptions}
            placeholder={rolesLoading ? 'Loading roles…' : 'Choose designation / role'}
            loading={rolesLoading}
            loadingText="Loading roles…"
            listboxLabel="Designation / Role"
            isOpen={roleMenuOpen}
            onOpen={() => {
              setRoleSearch('');
              setRoleMenuOpen(true);
            }}
            onClose={() => setRoleMenuOpen(false)}
            search={roleSearch}
            onSearchChange={setRoleSearch}
            containerRef={roleDropdownRef}
            footerAction={{
              label: 'Manage Roles',
              onClick: () => {
                setRoleMenuOpen(false);
                onOpenRoleManager();
              },
            }}
            emptyText="No roles found."
          />
        </FormField>

        {/* Staff Type */}
        <FormField label={<>Staff Type {requiredStar}</>} error={errors.staffType}>
          <select
            id="staffType"
            value={staffType}
            onChange={(event) => {
              setStaffType(event.target.value);
              clearFieldError('staffType');
            }}
            className={INPUT_CLASS}
          >
            <option value="">Choose Staff Type</option>
            <option value="Teaching">Teaching</option>
            <option value="Non-Teaching">Non-Teaching</option>
            <option value="Other">Other</option>
          </select>
        </FormField>

        {/* Highest Qualification */}
        <FormField label={<>Highest Qualification {requiredStar}</>} error={errors.qualification}>
          <input
            type="text"
            id="staffQualification"
            value={qualification}
            placeholder="e.g. Ph.D, M.Tech, M.Sc, B.Ed"
            onChange={(e) => {
              setQualification(e.target.value);
              clearFieldError('qualification');
            }}
            className={INPUT_CLASS}
          />
        </FormField>

        {/* Official Email */}
        <FormField label={<>Official Email {requiredStar}</>} error={errors.email}>
          <input
            type="email"
            id="staffEmail"
            value={email}
            placeholder="staff.name@institution.edu"
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            className={INPUT_CLASS}
          />
        </FormField>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <FormField
          className="md:row-span-3"
          label={<>Photo{optional} <span className="text-gray-400 font-normal">[JPG/PNG max 2MB]</span></>}
        >
          <PhotoUploadField
            photoUrl={photoUrl}
            error={photoError}
            fileInputRef={fileInputRef}
            onUpload={onPhotoUpload}
            onRemove={onRemovePhoto}
          />
        </FormField>

        <FormField label={<>Mobile Number {requiredStar}</>} error={errors.mobile}>
          <input
            type="tel"
            id="staffMobile"
            maxLength={10}
            value={mobile}
            placeholder="10 digits starting with 6-9"
            onChange={(e) => {
              setMobile(e.target.value.replace(/\D/g, ''));
              clearFieldError('mobile');
            }}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label={<>Date of Joining {requiredStar}</>} error={errors.dateOfJoining}>
          <input
            type="date"
            id="staffDateOfJoining"
            value={dateOfJoining}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              setDateOfJoining(e.target.value);
              clearFieldError('dateOfJoining');
            }}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label={<>Employment Status {requiredStar}</>} error={errors.status}>
          <select
            id="staffStatus"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StaffRecord['status']);
              clearFieldError('status');
            }}
            className={SELECT_CLASS}
          >
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Archived">Archived</option>
          </select>
        </FormField>

        {institutionType === 'School' && teachingScope.institution === 'School' && (
          <>
            <FormField label="Teaching Wing [O]">
              <select value={teachingScope.teachingWing ?? ''} onChange={(event) => updateScope({ teachingWing: event.target.value || undefined })} className={INPUT_CLASS}>
                <option value="">Choose wing</option>
                {['Primary Wing (Class 1 - 5)', 'Middle Wing (Class 6 - 8)', 'Secondary Wing (Class 9 - 10)', 'Higher Secondary (Class 11 - 12)'].map((wing) => <option key={wing}>{wing}</option>)}
              </select>
            </FormField>
            <FormField className="md:col-start-2 md:row-start-3" label="Class Teacher Eligibility [O]">
              <select
                value={teachingScope.classTeacherEligible ? 'yes' : 'no'}
                onChange={(event) => updateScope({ classTeacherEligible: event.target.value === 'yes' })}
                className={INPUT_CLASS}
              >
                <option value="yes">Eligible</option>
                <option value="no">Not eligible</option>
              </select>
            </FormField>
            {skillField('Skill Tags', teachingScope.skillTags, (skillTags) => updateScope({ skillTags }))}
            <div className="md:col-start-1 md:row-start-4">
              <FormField label="Eligible Classes [O]">
                <MultiSkillDropdown
                  value={teachingScope.eligibleClasses}
                  options={Array.from({ length: 12 }, (_, index) => `Class ${index + 1}`)}
                  loading={false}
                  onChange={(eligibleClasses) => updateScope({ eligibleClasses })}
                  label="Eligible Classes"
                />
              </FormField>
            </div>
          </>
        )}

        {institutionType === 'College' && teachingScope.institution === 'College' && (
          <>
            <FormField label="Department [O]">
              <select value={teachingScope.department ?? ''} onChange={(event) => updateScope({ department: event.target.value || undefined })} className={INPUT_CLASS}>
                <option value="">Choose department</option>
                {teachingScope.department && !config.departmentsList.includes(teachingScope.department) && <option>{teachingScope.department}</option>}
                {config.departmentsList.map((department) => <option key={department}>{department}</option>)}
              </select>
            </FormField>
            {multiChoiceField(
              'Teaching Years',
              ['1st Year', '2nd Year', '3rd Year', '4th Year'],
              teachingScope.teachingYears,
              (teachingYears) => updateScope({ teachingYears }),
            )}
            {skillField('Specializations', teachingScope.specializations, (specializations) => updateScope({ specializations }))}
          </>
        )}

        {institutionType === 'Training' && teachingScope.institution === 'Training' && (
          <>
            <FormField label="Track / Domain [O]">
              <select value={teachingScope.track ?? ''} onChange={(event) => updateScope({ track: event.target.value || undefined })} className={INPUT_CLASS}>
                <option value="">Choose track / domain</option>
                {config.classesList.map((track) => <option key={track}>{track}</option>)}
              </select>
            </FormField>
            {multiChoiceField(
              'Active Batches',
              config.classesList,
              teachingScope.activeBatches,
              (activeBatches) => updateScope({ activeBatches }),
            )}
            {skillField('Modules / Topics', teachingScope.modules, (modules) => updateScope({ modules }))}
          </>
        )}
      </div>
    </div>
  );
};
