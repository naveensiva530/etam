import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Department } from '../api';

interface DepartmentListProps {
  departments: Department[];
  loading: boolean;
  saving: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
}

/**
 * Renders a bordered list of departments with Edit and Delete action buttons.
 */
export const DepartmentList: React.FC<DepartmentListProps> = ({
  departments,
  loading,
  saving,
  onEdit,
  onDelete,
}) => (
  <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
    <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      Department Name
    </div>
    <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
      {loading ? (
        <p className="px-3 py-4 text-sm text-zinc-500">Loading departments…</p>
      ) : departments.length > 0 ? (
        departments.map((dept) => (
          <div
            key={dept.id}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm text-zinc-800 dark:text-zinc-200">
              {dept.name}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={saving}
                aria-label={`Edit ${dept.name}`}
                title="Edit department"
                onClick={() => onEdit(dept)}
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={saving}
                aria-label={`Delete ${dept.name}`}
                title="Delete department"
                onClick={() => onDelete(dept)}
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="px-3 py-4 text-sm text-zinc-500">No departments added yet.</p>
      )}
    </div>
  </div>
);
