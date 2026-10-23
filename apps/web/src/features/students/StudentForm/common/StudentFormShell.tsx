import React, { useState } from 'react';
import { ArrowLeft, FileSpreadsheet, FileText, User, X } from 'lucide-react';
import { StudentRecord, StudentInput } from '@/features/shared';
import { useStudentForm, StudentFormMode } from '../../hooks/useStudentForm';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import { StudentFieldsGrid } from '../../components/StudentFieldsGrid';

const BulkStudentUpload = React.lazy(
  () => import('./BulkStudentUpload').then((m) => ({ default: m.BulkStudentUpload })),
);

export interface StudentFormShellProps {
  mode: StudentFormMode;
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: StudentInput) => Promise<StudentRecord>;
  onSaveBulkStudents: (students: StudentInput[]) => Promise<StudentRecord[]>;
  existingAdmissionIds: string[];
  /** Pre-filled student data (required when mode = 'edit') */
  initialStudent?: StudentRecord;
  /** When true, renders inline (no modal overlay) */
  inline?: boolean;
  /** Initial tab to show — 'single' or 'bulk' (default: 'single') */
  initialMode?: 'single' | 'bulk';
}

/**
 * Thin orchestrator — wires hooks to UI.
 * Contains only layout/header/tabs/action-buttons (~80 lines of JSX).
 * All business logic lives in useStudentForm and usePhotoUpload.
 */
export const StudentFormShell: React.FC<StudentFormShellProps> = ({
  mode,
  isOpen,
  onClose,
  onSaveStudent,
  onSaveBulkStudents,
  existingAdmissionIds,
  initialStudent,
  inline = false,
  initialMode = 'single',
}) => {
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>(initialMode);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const form = useStudentForm({
    mode,
    initialStudent,
    existingAdmissionIds,
    onSaveStudent,
    onClose,
  });

  const photo = usePhotoUpload(initialStudent?.photoUrl ?? '');

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit Student Details' : 'Student Onboarding';

  // ── Derived ──────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => form.handleSubmitSingle(e, photo.photoUrl);

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
          className={`bg-white dark:bg-zinc-900 w-full flex flex-col overflow-hidden ${
            inline
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
                <User className="w-5 h-5" /> {title}
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
                  { key: 'single', icon: <FileText className="w-4 h-4" />, label: 'Single Student Form' },
                  { key: 'bulk', icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Bulk CSV Upload' },
                ] as const
              ).map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setUploadMode(key)}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                    uploadMode === key
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
                <StudentFieldsGrid
                  // Values
                  admissionId={form.admissionId}
                  dateOfJoining={form.dateOfJoining}
                  studentName={form.studentName}
                  department={form.department}
                  academicYear={form.academicYear}
                  gender={form.gender}
                  photoUrl={photo.photoUrl}
                  parentName={form.parentName}
                  parentMobile={form.parentMobile}
                  studentMobile={form.studentMobile}
                  dob={form.dob}
                  subcategory={form.subcategory}
                  additionalDepartment={form.additionalDepartment}
                  residenceType={form.residenceType}
                  communicationAddress={form.communicationAddress}
                  pinZip={form.pinZip}
                  status={form.status}
                  // Setters
                  setAdmissionId={form.setAdmissionId}
                  setDateOfJoining={form.setDateOfJoining}
                  setStudentName={form.setStudentName}
                  setDepartment={form.setDepartment}
                  setAcademicYear={form.setAcademicYear}
                  setGender={form.setGender}
                  setParentName={form.setParentName}
                  setParentMobile={form.setParentMobile}
                  setStudentMobile={form.setStudentMobile}
                  setDob={form.setDob}
                  setSubcategory={form.setSubcategory}
                  setAdditionalDepartment={form.setAdditionalDepartment}
                  setResidenceType={form.setResidenceType}
                  setCommunicationAddress={form.setCommunicationAddress}
                  setPinZip={form.setPinZip}
                  setStatus={form.setStatus}
                  // Validation
                  errors={form.errors}
                  clearFieldError={form.clearFieldError}
                  isParentNameRequired={form.isParentNameRequired}
                  isParentMobileRequired={form.isParentMobileRequired}
                  isStudentMobileRequired={form.isStudentMobileRequired}
                  isDobRequired={form.isDobRequired}
                  // Photo
                  photoError={photo.photoError}
                  fileInputRef={photo.fileInputRef}
                  onPhotoUpload={photo.handlePhotoUpload}
                  onRemovePhoto={photo.handleRemovePhoto}
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
                    {form.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Save & Onboard Student'}
                  </button>
                </div>
              </form>
            ) : (
              <React.Suspense
                fallback={<div className="p-4 text-sm text-gray-500">Loading bulk upload…</div>}
              >
                <BulkStudentUpload
                  existingAdmissionIds={existingAdmissionIds}
                  onSaveBulkStudents={onSaveBulkStudents}
                  onClose={onClose}
                />
              </React.Suspense>
            )}
          </div>
        </div>
      </div>

    </>
  );
};
