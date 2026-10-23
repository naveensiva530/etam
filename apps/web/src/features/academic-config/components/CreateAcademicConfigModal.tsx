import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { BookmarkPlus, X } from 'lucide-react';
import type { AcademicStatus } from '../types';

export interface AcademicConfigFormErrors {
  academicYear?: string;
  className?: string;
  status?: string;
}

interface CreateAcademicConfigModalProps {
  isOpen: boolean;
  mode?: 'create' | 'edit';
  academicYear: string;
  className: string;
  subCategory: string;
  status: AcademicStatus;
  errors: AcademicConfigFormErrors;
  onAcademicYearChange: (value: string) => void;
  onClassNameChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onStatusChange: (value: AcademicStatus) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export const CreateAcademicConfigModal: React.FC<CreateAcademicConfigModalProps> = ({
  isOpen,
  mode = 'create',
  academicYear,
  className,
  subCategory,
  status,
  errors,
  onAcademicYearChange,
  onClassNameChange,
  onSubCategoryChange,
  onStatusChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl p-6 space-y-5 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-academic-config-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 id="create-academic-config-title" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {mode === 'edit' ? 'Edit Academic Configuration' : 'Create Academic Configuration'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Register an academic year and class/course mapping
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close configuration form"
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="academic-year" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Academic Year <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              id="academic-year"
              type="text"
              value={academicYear}
              onChange={(event) => onAcademicYearChange(event.target.value)}
              placeholder="e.g. 2026-2027"
              aria-invalid={Boolean(errors.academicYear)}
              aria-describedby={errors.academicYear ? 'academic-year-error' : undefined}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 ${
                errors.academicYear
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-zinc-200 dark:border-zinc-800 focus:ring-zinc-400'
              }`}
            />
            {errors.academicYear && (
              <p id="academic-year-error" className="text-[11px] text-red-500 font-medium mt-1">{errors.academicYear}</p>
            )}
          </div>

          <div>
            <label htmlFor="academic-class-name" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Class / Course / Dept <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              id="academic-class-name"
              type="text"
              value={className}
              onChange={(event) => onClassNameChange(event.target.value)}
              placeholder="e.g. Class 10 or B.Tech CSE"
              aria-invalid={Boolean(errors.className)}
              aria-describedby={errors.className ? 'academic-class-error' : undefined}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 ${
                errors.className
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-zinc-200 dark:border-zinc-800 focus:ring-zinc-400'
              }`}
            />
            {errors.className && (
              <p id="academic-class-error" className="text-[11px] text-red-500 font-medium mt-1">{errors.className}</p>
            )}
          </div>

          <div>
            <label htmlFor="academic-subcategory" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Sub-Category
            </label>
            <input
              id="academic-subcategory"
              type="text"
              value={subCategory}
              onChange={(event) => onSubCategoryChange(event.target.value)}
              placeholder="e.g. Primary, Secondary, UG, PG"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              Optional sub-tier or educational category
            </p>
          </div>

          <div>
            <label htmlFor="academic-config-status" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Status <span className="text-red-500 font-bold">*</span>
            </label>
            <select
              id="academic-config-status"
              value={status}
              onChange={(event) => onStatusChange(event.target.value as AcademicStatus)}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 ${
                errors.status
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-zinc-200 dark:border-zinc-800 focus:ring-zinc-400'
              }`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-[11px] text-red-500 font-medium mt-1">{errors.status}</p>
            )}
          </div>

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
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-2xs transition-all"
            >
              {mode === 'edit' ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body,
  );
};
