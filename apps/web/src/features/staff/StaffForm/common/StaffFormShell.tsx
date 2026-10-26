import React, { useState } from 'react';
import { ArrowLeft, Briefcase, FileSpreadsheet, FileText, X } from 'lucide-react';
import { StaffRecord, StaffInput } from '@/features/shared';
import { useStaffForm, StaffFormMode } from '../../hooks/useStaffForm';
import { StaffFieldsGrid } from '../../components/StaffFieldsGrid';
import { usePhotoUpload } from '@/features/students/hooks/usePhotoUpload';
import { useStaffRoles } from '../../hooks/useStaffRoles';
import { useStaffSkills } from '../../hooks/useStaffSkills';
import { RoleManager } from '../../components/RoleManager';
import { SkillManager } from '../../components/SkillManager';

const BulkStaffUpload = React.lazy(
  () => import('./BulkStaffUpload').then((m) => ({ default: m.BulkStaffUpload })),
);

export interface StaffFormShellProps {
  mode: StaffFormMode;
  isOpen: boolean;
  onClose: () => void;
  onSaveStaff: (staff: StaffInput) => Promise<StaffRecord>;
  onSaveBulkStaff: (staffList: StaffInput[]) => Promise<StaffRecord[]>;
  existingStaffIds: string[];
  /** Pre-filled staff data (required when mode = 'edit') */
  initialStaff?: StaffRecord;
  /** When true, renders inline (no modal overlay) */
  inline?: boolean;
  /** Initial tab to show — 'single' or 'bulk' (default: 'single') */
  initialMode?: 'single' | 'bulk';
}

/**
 * Thin orchestrator for Staff Onboarding/Edit — identical format to StudentFormShell.
 * Wires hooks to UI with consistent layout, headers, tabs, and action buttons.
 */
export const StaffFormShell: React.FC<StaffFormShellProps> = ({
  mode,
  isOpen,
  onClose,
  onSaveStaff,
  onSaveBulkStaff,
  existingStaffIds,
  initialStaff,
  inline = false,
  initialMode = 'single',
}) => {
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>(initialMode);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const form = useStaffForm({
    mode,
    initialStaff,
    existingStaffIds,
    onSaveStaff,
    onClose,
  });

  const staffRoles = useStaffRoles();
  const staffSkills = useStaffSkills();
  const photo = usePhotoUpload(initialStaff?.photoUrl ?? '');
  const handleSubmit = (event: React.FormEvent) =>
    form.handleSubmitSingle(event, photo.photoUrl);
  const handleRemoveRole = async (role: string) => {
    const removed = await staffRoles.removeRole(role);
    if (removed && form.role === role) {
      form.setRole('');
      form.clearFieldError('role');
    }
  };
  const updateSelectedSkill = (oldSkill: string, newSkill?: string) => {
    const scope = form.teachingScope;
    if (scope.institution === 'School') {
      form.setTeachingScope({
        ...scope,
        skillTags: scope.skillTags.flatMap((skill) => skill === oldSkill ? (newSkill ? [newSkill] : []) : [skill]),
      });
    } else if (scope.institution === 'College') {
      form.setTeachingScope({
        ...scope,
        specializations: scope.specializations.flatMap((skill) => skill === oldSkill ? (newSkill ? [newSkill] : []) : [skill]),
      });
    } else {
      form.setTeachingScope({
        ...scope,
        modules: scope.modules.flatMap((skill) => skill === oldSkill ? (newSkill ? [newSkill] : []) : [skill]),
      });
    }
  };
  const handleRenameSkill = async (skill: string, newSkill: string) => {
    const renamed = await staffSkills.renameSkill(skill, newSkill);
    if (renamed) updateSelectedSkill(skill, newSkill.trim());
    return renamed;
  };
  const handleRemoveSkill = async (skill: string) => {
    if (await staffSkills.removeSkill(skill)) updateSelectedSkill(skill);
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit Staff Details' : 'Staff Onboarding';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={
          inline
            ? 'w-full'
            : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto'
        }
      >
        <div
          className={`bg-white dark:bg-zinc-900 w-full flex flex-col overflow-hidden ${inline
              ? 'shadow-xs'
              : 'border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-4xl max-h-[92vh] shadow-2xl my-6'
            }`}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              {inline && (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> {title}
              </h2>
            </div>

            {!inline ? (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* ── Mode Tabs (Single / Bulk) — modal only ─────────────────── */}
          {!inline && (
            <div className="px-6 pt-3 border-b border-zinc-200 dark:border-zinc-800 flex gap-4 bg-white dark:bg-zinc-900">
              {(
                [
                  { key: 'single', icon: <FileText className="w-4 h-4" />, label: 'Single Staff Form' },
                  { key: 'bulk', icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Bulk CSV Upload' },
                ] as const
              ).map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setUploadMode(key)}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${uploadMode === key
                      ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
                      : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="p-6 overflow-y-auto flex-1">
            {form.submitError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
              >
                {form.submitError}
              </div>
            )}

            {uploadMode === 'single' ? (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <StaffFieldsGrid
                  staffId={form.staffId}
                  name={form.name}
                  role={form.role}
                  staffType={form.staffType}
                  qualification={form.qualification}
                  email={form.email}
                  mobile={form.mobile}
                  dateOfJoining={form.dateOfJoining}
                  status={form.status}
                  teachingScope={form.teachingScope}
                  photoUrl={photo.photoUrl}
                  setStaffId={form.setStaffId}
                  setName={form.setName}
                  setRole={form.setRole}
                  setStaffType={form.setStaffType}
                  setQualification={form.setQualification}
                  setEmail={form.setEmail}
                  setMobile={form.setMobile}
                  setDateOfJoining={form.setDateOfJoining}
                  setStatus={form.setStatus}
                  setTeachingScope={form.setTeachingScope}
                  photoError={photo.photoError}
                  fileInputRef={photo.fileInputRef}
                  onPhotoUpload={photo.handlePhotoUpload}
                  onRemovePhoto={photo.handleRemovePhoto}
                  errors={form.errors}
                  clearFieldError={form.clearFieldError}
                  staffRoles={staffRoles.roles}
                  rolesLoading={staffRoles.loading}
                  onOpenRoleManager={staffRoles.openManager}
                  staffSkills={staffSkills.skills}
                  skillsLoading={staffSkills.loading}
                  onOpenSkillManager={staffSkills.openManager}
                />

                {/* ── Form Actions ─────────────────────────────────────── */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={form.isSubmitting}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={form.isSubmitting}
                    className="px-5 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 shadow-sm transition-colors disabled:opacity-60"
                  >
                    {form.isSubmitting
                      ? 'Saving…'
                      : isEdit
                        ? 'Save Changes'
                        : 'Save & Onboard Staff'}
                  </button>
                </div>
              </form>
            ) : (
              <React.Suspense
                fallback={<div className="p-4 text-sm text-gray-500">Loading bulk upload…</div>}
              >
                <BulkStaffUpload
                  existingStaffIds={existingStaffIds}
                  onSaveBulkStaff={onSaveBulkStaff}
                  onClose={onClose}
                />
              </React.Suspense>
            )}
          </div>
        </div>
      </div>

      <RoleManager
        isOpen={staffRoles.isManagerOpen}
        onClose={staffRoles.closeManager}
        roles={staffRoles.roles}
        loading={staffRoles.loading}
        saving={staffRoles.saving}
        error={staffRoles.error}
        roleNameInput={staffRoles.roleNameInput}
        onRoleNameChange={staffRoles.setRoleNameInput}
        onAddRole={staffRoles.addRole}
        onRemoveRole={handleRemoveRole}
      />
      <SkillManager
        isOpen={staffSkills.isManagerOpen}
        onClose={staffSkills.closeManager}
        skills={staffSkills.skills}
        loading={staffSkills.loading}
        saving={staffSkills.saving}
        error={staffSkills.error}
        skillNameInput={staffSkills.skillNameInput}
        onSkillNameChange={staffSkills.setSkillNameInput}
        onAddSkill={() => void staffSkills.addSkill()}
        onRemoveSkill={(skill) => void handleRemoveSkill(skill)}
        onRenameSkill={handleRenameSkill}
      />
    </>
  );
};
