import React from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { Department } from '../api';
import { DepartmentForm } from './DepartmentForm';
import { DepartmentList } from './DepartmentList';

interface DepartmentManagerProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  onClose: () => void;

  /** List state */
  departments: Department[];
  loading: boolean;
  saving: boolean;

  /** Inline form state */
  isFormOpen: boolean;
  nameInput: string;
  editingDepartment: Department | null;
  error: string;

  /** Handlers */
  onOpenAddForm: () => void;
  onEditDepartment: (dept: Department) => void;
  onDeleteDepartment: (dept: Department) => void;
  onNameChange: (v: string) => void;
  onFormSubmit: (e: React.FormEvent) => void;
  onFormCancel: () => void;
}

/**
 * Portal-based modal that wraps DepartmentList + DepartmentForm.
 * Rendered into document.body to escape any overflow:hidden parents.
 */
export const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  isOpen,
  onClose,
  departments,
  loading,
  saving,
  isFormOpen,
  nameInput,
  editingDepartment,
  error,
  onOpenAddForm,
  onEditDepartment,
  onDeleteDepartment,
  onNameChange,
  onFormSubmit,
  onFormCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-manager-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 id="department-manager-title" className="text-base font-bold">
            Manage Departments
          </h2>
          <button
            type="button"
            aria-label="Close department manager"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 overflow-y-auto p-5">
          {/* Add Department button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onOpenAddForm}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <Plus className="h-4 w-4" /> Department
            </button>
          </div>

          {/* Inline add/edit form */}
          {isFormOpen && (
            <DepartmentForm
              nameInput={nameInput}
              isEditing={editingDepartment !== null}
              saving={saving}
              error={error}
              onNameChange={onNameChange}
              onSubmit={onFormSubmit}
              onCancel={onFormCancel}
            />
          )}

          {/* Error shown outside form (e.g. delete error) */}
          {!isFormOpen && error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <DepartmentList
            departments={departments}
            loading={loading}
            saving={saving}
            onEdit={onEditDepartment}
            onDelete={onDeleteDepartment}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};
