import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { createSubjectType, deleteSubjectType, renameSubjectType } from '../api';
import type { SubjectTypeOption } from '../types';

interface SubjectTypeManagerModalProps {
  isOpen: boolean;
  types: SubjectTypeOption[];
  onClose: () => void;
  onTypesChange: (types: SubjectTypeOption[]) => void;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
};

export const SubjectTypeManagerModal: React.FC<SubjectTypeManagerModalProps> = ({
  isOpen,
  types,
  onClose,
  onTypesChange,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      setErrorMessage('Enter a type name.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      const created = await createSubjectType(name);
      onTypesChange([...types, created].sort((left, right) => left.name.localeCompare(right.name)));
      setNewName('');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to create subject type.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRename = async (id: string) => {
    const name = editName.trim();
    if (!name) {
      setErrorMessage('Enter a type name.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      const updated = await renameSubjectType(id, name);
      onTypesChange(
        types
          .map((type) => (type.id === id ? updated : type))
          .sort((left, right) => left.name.localeCompare(right.name)),
      );
      setEditingId(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to rename subject type.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: SubjectTypeOption) => {
    if (!window.confirm(`Delete subject type "${type.name}"?`)) return;
    setIsSaving(true);
    setErrorMessage('');
    try {
      await deleteSubjectType(type.id);
      onTypesChange(types.filter((item) => item.id !== type.id));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to delete subject type.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subject-type-manager-title"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 id="subject-type-manager-title" className="text-sm font-bold">Manage Types</h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">Add, rename, or remove subject types.</p>
            </div>
            <button
              type="button"
              aria-label="Close Manage Types"
              disabled={isSaving}
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {errorMessage && (
            <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </p>
          )}

          <div className="mb-4 max-h-52 space-y-1 overflow-y-auto">
            {types.map((type) => (
              <div key={type.id} className="flex items-center gap-2 rounded-lg border border-zinc-100 px-2.5 py-2 dark:border-zinc-800">
                {editingId === type.id ? (
                  <>
                    <input
                      autoFocus
                      aria-label={`Rename ${type.name}`}
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      maxLength={50}
                      className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                    <button
                      type="button"
                      aria-label={`Save ${type.name}`}
                      disabled={isSaving}
                      onClick={() => void handleRename(type.id)}
                      className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-950"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancel rename"
                      disabled={isSaving}
                      onClick={() => setEditingId(null)}
                      className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{type.name}</span>
                    <button
                      type="button"
                      aria-label={`Edit ${type.name}`}
                      disabled={isSaving}
                      onClick={() => {
                        setErrorMessage('');
                        setEditingId(type.id);
                        setEditName(type.name);
                      }}
                      className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${type.name}`}
                      disabled={isSaving || types.length <= 1}
                      onClick={() => void handleDelete(type)}
                      className="rounded-md p-1 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleCreate} className="flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={50}
              placeholder="New type name"
              aria-label="New type name"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
