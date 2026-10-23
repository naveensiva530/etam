import React from 'react';

interface DepartmentFormProps {
  nameInput: string;
  isEditing: boolean;
  saving: boolean;
  error: string;
  onNameChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * Inline form for adding or editing a department name.
 * Controlled by the parent (DepartmentManager) via props.
 */
export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  nameInput,
  isEditing,
  saving,
  error,
  onNameChange,
  onSubmit,
  onCancel,
}) => (
  <form
    onSubmit={onSubmit}
    className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
  >
    <label
      htmlFor="department-name"
      className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
    >
      Department Name <span className="text-red-600">*</span>
    </label>
    <input
      id="department-name"
      type="text"
      autoFocus
      required
      maxLength={100}
      value={nameInput}
      onChange={(e) => onNameChange(e.target.value)}
      placeholder="Enter department name"
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    />
    {error && (
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    )}
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 disabled:opacity-60"
      >
        {saving ? 'Saving…' : isEditing ? 'Save' : 'Add'}
      </button>
    </div>
  </form>
);
