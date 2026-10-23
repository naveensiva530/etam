import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, Search, Settings, X } from 'lucide-react';
import { createSubjectMasterRecord, updateSubjectMasterRecord } from '../api';
import type { SubjectMasterRecord, SubjectTypeOption } from '../types';
import { SubjectTypeManagerModal } from './SubjectTypeManagerModal';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subject: SubjectMasterRecord) => void;
  existingSubjects: SubjectMasterRecord[];
  types: SubjectTypeOption[];
  onTypesChange: (types: SubjectTypeOption[]) => void;
  subject?: SubjectMasterRecord | null;
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingSubjects,
  types,
  onTypesChange,
  subject = null,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<SubjectMasterRecord['status'] | ''>('');
  const [errors, setErrors] = useState<{ code?: string; name?: string; type?: string; status?: string }>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [typeSearchQuery, setTypeSearchQuery] = useState('');
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCode(subject?.code || '');
    setName(subject?.name || '');
    setType(subject?.type || '');
    setStatus(subject?.status || '');
    setErrors({});
    setFormError('');
  }, [isOpen, subject]);

  useEffect(() => {
    if (!isTypeDropdownOpen) return;
    const close = (event: MouseEvent) => {
      if (!typeDropdownRef.current?.contains(event.target as Node)) setIsTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isTypeDropdownOpen]);

  if (!isOpen) return null;

  const filteredTypes = types.filter((item) =>
    item.name.toLowerCase().includes(typeSearchQuery.trim().toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { code?: string; name?: string; type?: string; status?: string } = {};

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) newErrors.code = 'Subject Code is required';
    if (!trimmedName) newErrors.name = 'Subject Name is required';
    const selectedType = types.find((item) => item.name === type);
    if (!selectedType) newErrors.type = 'Subject Type is required';
    if (!status) newErrors.status = 'Status is required';

    if (existingSubjects.some((s) => s.id !== subject?.id && s.code.toUpperCase() === trimmedCode)) {
      newErrors.code = `Subject code "${trimmedCode}" already exists.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (!selectedType || !status) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const dto = {
        code: trimmedCode,
        name: trimmedName,
        type: selectedType.name,
        status,
      };
      const saved = subject
        ? await updateSubjectMasterRecord(subject.id, dto)
        : await createSubjectMasterRecord(dto);
      onSuccess(saved);
      setCode('');
      setName('');
      setType('');
      setStatus('');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : `Unable to ${subject ? 'update' : 'create'} subject.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl p-6 space-y-4 font-sans"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-2xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {subject ? 'Edit Subject' : 'Add New Subject'}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {subject ? 'Update subject details in the institutional catalog' : 'Register a subject in the institutional catalog'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MAT101"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setErrors((prev) => ({ ...prev, code: '' }));
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono outline-none focus:ring-1 ${
                  errors.code ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-zinc-400'
                }`}
              />
              {errors.code && <p className="text-[11px] text-red-500 mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Advanced Mathematics"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 ${
                  errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-zinc-400'
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={typeDropdownRef}>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isTypeDropdownOpen}
                    aria-required="true"
                    aria-invalid={Boolean(errors.type)}
                    aria-describedby={errors.type ? 'subject-type-error' : undefined}
                    onClick={() => {
                      setTypeSearchQuery('');
                      setIsTypeDropdownOpen((open) => !open);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-left text-xs outline-none focus:ring-1 focus:ring-zinc-400 dark:bg-zinc-900 ${
                      errors.type
                        ? 'border-red-500 text-zinc-900 dark:border-red-500 dark:text-zinc-100'
                        : 'border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    <span className={type ? '' : 'text-zinc-400'}>{type || 'Select type'}</span>
                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isTypeDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                      <div className="border-b border-zinc-100 p-2 dark:border-zinc-800">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="search"
                            autoFocus
                            aria-label="Search subject types"
                            placeholder="Search..."
                            value={typeSearchQuery}
                            onChange={(event) => setTypeSearchQuery(event.target.value)}
                            className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-2 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto py-1" role="listbox" aria-label="Subject types">
                        {filteredTypes.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            role="option"
                            aria-selected={type === item.name}
                            onClick={() => {
                              setType(item.name);
                              setErrors((current) => ({ ...current, type: undefined }));
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                              type === item.name ? 'font-semibold text-zinc-950 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {item.name}
                          </button>
                        ))}
                        {filteredTypes.length === 0 && (
                          <p className="px-3 py-3 text-xs text-zinc-500">
                            {types.length === 0 ? 'No types added.' : 'No matching types.'}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTypeDropdownOpen(false);
                          setIsTypeManagerOpen(true);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <Settings className="h-3.5 w-3.5" /> Manage Types
                      </button>
                    </div>
                  )}
                </div>
                {errors.type && <p id="subject-type-error" className="mt-1 text-[11px] text-red-500">{errors.type}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  required
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={errors.status ? 'subject-status-error' : undefined}
                  onChange={(e) => {
                    setStatus(e.target.value as SubjectMasterRecord['status'] | '');
                    setErrors((current) => ({ ...current, status: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-400 ${
                    errors.status ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <option value="">Select status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && <p id="subject-status-error" className="mt-1 text-[11px] text-red-500">{errors.status}</p>}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 shadow-2xs transition-all"
              >
                {isSubmitting ? (subject ? 'Saving...' : 'Creating...') : (subject ? 'Save Changes' : 'Create Subject')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      <SubjectTypeManagerModal
        isOpen={isTypeManagerOpen}
        types={types}
        onClose={() => setIsTypeManagerOpen(false)}
        onTypesChange={(nextTypes) => {
          const currentType = types.find((item) => item.name === type);
          const updatedCurrent = currentType && nextTypes.find((item) => item.id === currentType.id);
          const selected = updatedCurrent || nextTypes.find((item) => item.name === type);
          setType(selected?.name || '');
          onTypesChange(nextTypes);
        }}
      />
    </AnimatePresence>
  );
};
