import React, { Suspense, lazy, useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useInstitution } from '@/context/InstitutionContext';
import { useStudentList } from './hooks/useStudentList';
import type { StudentRecord, StudentInput } from './types';
import { StudentTable } from './components/StudentTable';
import { MemberManagementToolbar } from '@/features/shared';

// Lazy loaded modal/dialog views
const AddStudent = lazy(() =>
  import('./StudentForm/AddStudent').then((m) => ({ default: m.AddStudent })),
);
const EditStudent = lazy(() =>
  import('./StudentForm/EditStudent').then((m) => ({ default: m.EditStudent })),
);
const ViewStudent = lazy(() =>
  import('./ViewStudent/ViewStudent').then((m) => ({ default: m.ViewStudent })),
);
const DeleteStudent = lazy(() =>
  import('./DeleteStudent/DeleteStudent').then((m) => ({ default: m.DeleteStudent })),
);

export type StudentPanelViewMode =
  | 'table'
  | 'student-onboard'
  | 'student-view'
  | 'student-delete';

export const StudentManagementPage: React.FC = () => {
  const { institutionType, config } = useInstitution();

  const {
    students,
    recycledStudents,
    filteredStudents,
    paginatedStudents,
    loading,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    totalStudents,
    activeStudents,
    inactiveStudents,
    addStudent,
    updateStudent,
    bulkAddStudents,
    deleteStudent,
    restoreStudent,
    purgeStudent,
  } = useStudentList({ institutionType });

  // UI state
  const [panelViewMode, setPanelViewMode] = useState<StudentPanelViewMode>('table');
  const [modalMode, setModalMode] = useState<'single' | 'bulk'>('single');
  const [editingStudent, setEditingStudent] = useState<StudentRecord | undefined>();
  const [selectedStudentForView, setSelectedStudentForView] = useState<StudentRecord | null>(null);
  const [studentPendingDelete, setStudentPendingDelete] = useState<StudentRecord | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const existingAdmissionIds = useMemo(
    () => students.map((s) => s.admissionId),
    [students],
  );

  const isFilterActive = statusFilter !== 'all' || searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  // Dialog navigation helpers
  const openAddStudent = (mode: 'single' | 'bulk') => {
    setModalMode(mode);
    setEditingStudent(undefined);
    setPanelViewMode('student-onboard');
  };

  const openEditStudent = (student: StudentRecord) => {
    setEditingStudent(student);
    setPanelViewMode('student-onboard');
  };

  const openViewStudent = (student: StudentRecord) => {
    setSelectedStudentForView(student);
    setPanelViewMode('student-view');
  };

  const openDeleteStudent = (student: StudentRecord) => {
    setStudentPendingDelete(student);
    setDeleteError('');
    setPanelViewMode('student-delete');
  };

  const closeDialogs = () => {
    setEditingStudent(undefined);
    setSelectedStudentForView(null);
    setStudentPendingDelete(null);
    setDeleteError('');
    setPanelViewMode('table');
  };

  const confirmDelete = async () => {
    if (!studentPendingDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteStudent(studentPendingDelete.id);
      closeDialogs();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearRecycleBin = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all archived students?')) return;
    try {
      for (const student of recycledStudents) {
        await purgeStudent(student.id);
      }
    } catch (err) {
      console.error('Failed to clear recycle bin', err);
    }
  };

  const handleRestoreAll = async () => {
    try {
      for (const student of recycledStudents) {
        await restoreStudent(student.id);
      }
    } catch (err) {
      console.error('Failed to restore all', err);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-white dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100">
      {panelViewMode === 'table' && (
        <>
          {/* ─── 1. PAGE TITLE ─── */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Student Management
            </h1>
          </div>

          {/* ─── 2. STAT CARDS (Compact Width & Height — Pure White, Black, and Gray) ─── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Total Students Card */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${
                statusFilter === 'all'
                  ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
                  Total Students
                </p>
                <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                  {String(totalStudents).padStart(2, '0')}
                </p>
              </div>
            </button>

            {/* Active Students Card */}
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${
                statusFilter === 'active'
                  ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
                  Active Students
                </p>
                <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                  {String(activeStudents).padStart(2, '0')}
                </p>
              </div>
            </button>

            {/* Inactive Students Card */}
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${
                statusFilter === 'inactive'
                  ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0">
                <UserX className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
                  Inactive Students
                </p>
                <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                  {String(inactiveStudents).padStart(2, '0')}
                </p>
              </div>
            </button>
          </div>

          {/* ─── 3. TOOLBAR ROW (Search on left, actions on right) ─── */}
          <div className="pt-2">
            <MemberManagementToolbar
              managementType="students"
              onOpenStudentOnboard={openAddStudent}
              onOpenStaffOnboard={() => {}}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              memberTypeFilter="students"
              onMemberTypeFilterChange={() => {}}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onResetFilters={resetAllFilters}
              isFilterActive={isFilterActive}
              recycledStudents={recycledStudents}
              recycledStaff={[]}
              onRestoreStudent={restoreStudent}
              onRestoreStaff={() => {}}
              onRestoreAll={handleRestoreAll}
              onClearRecycleBin={handleClearRecycleBin}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-400 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <span>{error}</span>
              <button
                onClick={refresh}
                disabled={loading}
                className="font-semibold underline disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Filter Indicator */}
          {(isFilterActive || searchQuery) && (
            <div className="pt-2 flex items-center justify-between relative z-30">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md font-medium">
                {filteredStudents.length} records shown
              </span>
            </div>
          )}

          {/* Student Table */}
          <StudentTable
            students={paginatedStudents}
            loading={loading}
            classFieldLabel={config.classFieldLabel || 'Department'}
            onEdit={openEditStudent}
            onView={openViewStudent}
            onDelete={openDeleteStudent}
            isFilterActive={isFilterActive}
            onResetFilters={resetAllFilters}
          />
        </>
      )}

      {/* Onboarding View (Add / Edit) */}
      {panelViewMode === 'student-onboard' && (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading student form...</div>}>
          {editingStudent ? (
            <EditStudent
              isOpen
              inline
              onClose={closeDialogs}
              onSaveStudent={async (student: StudentInput) => {
                const saved = await updateStudent(editingStudent.id, student);
                closeDialogs();
                return saved;
              }}
              onSaveBulkStudents={bulkAddStudents}
              existingAdmissionIds={existingAdmissionIds}
              student={editingStudent}
            />
          ) : (
            <AddStudent
              isOpen
              inline
              onClose={closeDialogs}
              onSaveStudent={async (student: StudentInput) => {
                const saved = await addStudent(student);
                closeDialogs();
                return saved;
              }}
              onSaveBulkStudents={async (bulk: StudentInput[]) => {
                const saved = await bulkAddStudents(bulk);
                closeDialogs();
                return saved;
              }}
              existingAdmissionIds={existingAdmissionIds}
              initialMode={modalMode}
            />
          )}
        </Suspense>
      )}

      {/* View Student Details View */}
      {panelViewMode === 'student-view' && selectedStudentForView && (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading student details...</div>}>
          <ViewStudent student={selectedStudentForView} onClose={closeDialogs} />
        </Suspense>
      )}

      {/* Delete Student Confirmation View */}
      {panelViewMode === 'student-delete' && studentPendingDelete && (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading delete confirmation...</div>}>
          <DeleteStudent
            student={studentPendingDelete}
            error={deleteError}
            isDeleting={isDeleting}
            onCancel={closeDialogs}
            onConfirm={() => void confirmDelete()}
          />
        </Suspense>
      )}
    </div>
  );
};
