import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface DeleteConfirmationProps {
  title: string;
  description: string;
  error?: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  title,
  description,
  error,
  isDeleting = false,
  onCancel,
  onConfirm,
}) => (
  <section className="w-full bg-white dark:bg-zinc-900">
    <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onCancel}
        disabled={isDeleting}
        className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Cancel
      </button>
    </header>
    <div className="p-6">
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{description}</p>
      <div className="mt-6 flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" /> {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </section>
);
