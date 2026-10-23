import React, { Suspense, lazy, useState, useMemo } from 'react';
import {
  Briefcase,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useInstitution } from '@/context/InstitutionContext';
import { useStaffList } from './hooks/useStaffList';
import type { StaffRecord, StaffInput } from './types';
import { StaffTable } from './components/StaffTable';
import { MemberManagementToolbar } from '@/features/shared';

// Lazy loaded modal/dialog views
const AddStaff = lazy(() =>
  import('./StaffForm/AddStaff').then((m) => ({ default: m.AddStaff })),
);
const EditStaff = lazy(() =>
  import('./StaffForm/EditStaff').then((m) => ({ default: m.EditStaff })),
);
const ViewStaff = lazy(() =>
  import('./ViewStaff/ViewStaff').then((m) => ({ default: m.ViewStaff })),
);
const DeleteStaff = lazy(() =>
  import('./DeleteStaff/DeleteStaff').then((m) => ({ default: m.DeleteStaff })),
);

export type StaffPanelViewMode =
  | 'table'
  | 'staff-onboard'
  | 'staff-view'
  | 'staff-delete';

export const StaffManagementPage: React.FC = () => {
  const { institutionType } = useInstitution();

  const {
    staffList,
    recycledStaff,
    filteredStaff,
    paginatedStaff,
    loading,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    totalStaff,
    activeStaff,
    inactiveStaff,
    addStaff,
    updateStaff,
    bulkAddStaff,
    deleteStaff,
    restoreStaff,
    purgeStaff,
  } = useStaffList({ institutionType });

  // UI state
  const [panelViewMode, setPanelViewMode] = useState<StaffPanelViewMode>('table');
  const [modalMode, setModalMode] = useState<'single' | 'bulk'>('single');
  const [editingStaff, setEditingStaff] = useState<StaffRecord | undefined>();
  const [selectedStaffForView, setSelectedStaffForView] = useState<StaffRecord | null>(null);
  const [staffPendingDelete, setStaffPendingDelete] = useState<StaffRecord | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const existingStaffIds = useMemo(
    () => staffList.map((s) => s.staffId),
    [staffList],
  );

  const isFilterActive = statusFilter !== 'all' || searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  // Dialog navigation helpers
  const openAddStaff = (mode: 'single' | 'bulk') => {
    setModalMode(mode);
    setEditingStaff(undefined);
    setPanelViewMode('staff-onboard');
  };

  const openEditStaff = (staff: StaffRecord) => {
    setEditingStaff(staff);
    setPanelViewMode('staff-onboard');
  };

  const openViewStaff = (staff: StaffRecord) => {
    setSelectedStaffForView(staff);
    setPanelViewMode('staff-view');
  };

  const openDeleteStaff = (staff: StaffRecord) => {
    setStaffPendingDelete(staff);
    setDeleteError('');
    setPanelViewMode('staff-delete');
  };

  const closeDialogs = () => {
    setEditingStaff(undefined);
    setSelectedStaffForView(null);
    setStaffPendingDelete(null);
    setDeleteError('');
    setPanelViewMode('table');
  };

  const confirmDelete = async () => {
    if (!staffPendingDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteStaff(staffPendingDelete.id);
      closeDialogs();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete staff member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearRecycleBin = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all archived staff?')) return;
    try {
      for (const staff of recycledStaff) {
        await purgeStaff(staff.id);
      }
    } catch (err) {
      console.error('Failed to clear recycle bin', err);
    }
  };

  const handleRestoreAll = async () => {
    try {
      for (const staff of recycledStaff) {
        await restoreStaff(staff.id);
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
              Staff Management
            </h1>
          </div>

          {/* ─── 2. STAT CARDS (Compact Width & Height — Pure White, Black, and Gray) ─── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Total Staff Card */}
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
                <Briefcase className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
                  Total Staff
                </p>
                <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                  {String(totalStaff).padStart(2, '0')}
                </p>
              </div>
            </button>

            {/* Active Staff Card */}
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
                  Active Staff
                </p>
                <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                  {String(activeStaff).padStart(2, '0')}
                </p>
              </div>
            </button>

            {/* Inactive Staff Card */}
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
                  Inactive Staff
                </p>
                <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                  {String(inactiveStaff).padStart(2, '0')}
                </p>
              </div>
            </button>
          </div>

          {/* ─── 3. TOOLBAR ROW (Search on left, actions on right) ─── */}
          <div className="pt-2">
            <MemberManagementToolbar
              managementType="staff"
              onOpenStudentOnboard={() => {}}
              onOpenStaffOnboard={openAddStaff}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              memberTypeFilter="staff"
              onMemberTypeFilterChange={() => {}}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onResetFilters={resetAllFilters}
              isFilterActive={isFilterActive}
              recycledStudents={[]}
              recycledStaff={recycledStaff}
              onRestoreStudent={() => {}}
              onRestoreStaff={restoreStaff}
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
                {filteredStaff.length} records shown
              </span>
            </div>
          )}

          {/* Staff Table */}
          <StaffTable
            staffList={paginatedStaff}
            loading={loading}
            onEdit={openEditStaff}
            onView={openViewStaff}
            onDelete={openDeleteStaff}
            isFilterActive={isFilterActive}
            onResetFilters={resetAllFilters}
          />
        </>
      )}

      {/* Onboarding View (Add / Edit) */}
      {panelViewMode === 'staff-onboard' && (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading staff form...</div>}>
          {editingStaff ? (
            <EditStaff
              isOpen
              inline
              onClose={closeDialogs}
              onSaveStaff={async (staff: StaffInput) => {
                const saved = await updateStaff(editingStaff.id, staff);
                closeDialogs();
                return saved;
              }}
              onSaveBulkStaff={bulkAddStaff}
              existingStaffIds={existingStaffIds.filter((id) => id !== editingStaff.staffId)}
              staff={editingStaff}
            />
          ) : (
            <AddStaff
              isOpen
              inline
              onClose={closeDialogs}
              onSaveStaff={async (staff: StaffInput) => {
                const saved = await addStaff(staff);
                closeDialogs();
                return saved;
              }}
              onSaveBulkStaff={async (bulk: StaffInput[]) => {
                const saved = await bulkAddStaff(bulk);
                closeDialogs();
                return saved;
              }}
              existingStaffIds={existingStaffIds}
              initialMode={modalMode}
            />
          )}
        </Suspense>
      )}

      {/* View Staff Details View */}
      {panelViewMode === 'staff-view' && selectedStaffForView && (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading staff profile...</div>}>
          <ViewStaff staff={selectedStaffForView} onClose={closeDialogs} />
        </Suspense>
      )}

      {/* Delete Staff Confirmation View */}
      {panelViewMode === 'staff-delete' && staffPendingDelete && (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading delete confirmation...</div>}>
          <DeleteStaff
            staff={staffPendingDelete}
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
