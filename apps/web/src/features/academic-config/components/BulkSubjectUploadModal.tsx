import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { parseConfigCsvRow } from '../utils/csv-parser';
import { createSubjectMasterRecords } from '../api';
import type { SubjectMasterRecord, SubjectTypeOption } from '../types';

interface BulkSubjectUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: SubjectMasterRecord[]) => void;
  types: SubjectTypeOption[];
}

export const BulkSubjectUploadModal: React.FC<BulkSubjectUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  types,
}) => {
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCsvText(reader.result);
        setError('');
      }
    };
    reader.onerror = () => setError('Unable to read selected file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);
    setError('');

    const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      setError('Provide at least one header row and one subject row.');
      setIsUploading(false);
      return;
    }

    try {
      const headers = parseConfigCsvRow(lines[0]).map((h) => h.toLowerCase());
      const codeIdx = headers.indexOf('code');
      const nameIdx = headers.indexOf('name');
      const typeIdx = headers.indexOf('type');
      const statusIdx = headers.indexOf('status');

      if (codeIdx < 0 || nameIdx < 0 || typeIdx < 0 || statusIdx < 0) {
        setError('CSV must include "Code", "Name", "Type", and "Status" columns.');
        setIsUploading(false);
        return;
      }

      const rows = lines.slice(1).map((line, idx) => {
        const values = parseConfigCsvRow(line);
        const code = values[codeIdx]?.trim() || '';
        const name = values[nameIdx]?.trim() || '';
        const rawType = values[typeIdx]?.trim() || '';
        const rawStatus = values[statusIdx]?.trim() || '';

        if (!code || !name || !rawType || !rawStatus) {
          throw new Error(`Row ${idx + 2}: Code, Name, Type, and Status are required.`);
        }

        const matchedType = types.find((item) => item.name.toLowerCase() === rawType.toLowerCase());
        if (!matchedType) {
          throw new Error(`Row ${idx + 2}: Type "${rawType}" is not in the subject type list.`);
        }
        const type = matchedType.name;
        if (rawStatus !== 'Active' && rawStatus !== 'Inactive') {
          throw new Error(`Row ${idx + 2}: Status must be Active or Inactive.`);
        }
        const status: SubjectMasterRecord['status'] = rawStatus === 'Active' ? 'Active' : 'Inactive';

        return { code, name, type, status };
      });

      const created = await createSubjectMasterRecords(rows);
      onSuccess(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Check format and try again.');
    } finally {
      setIsUploading(false);
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
          className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl p-6 space-y-4 font-sans"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-2xs">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Bulk Upload Subjects
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Upload CSV or paste comma-separated subject records
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

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Choose CSV File
              </button>
              <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                Code, Name, Type, Status
              </span>
            </div>

            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setError('');
              }}
              placeholder={'Code,Name,Type,Status\nMAT101,Mathematics,Core,Active\nART101,Visual Arts,Elective,Active\nLAB101,Computing Lab,Practical,Active'}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-400"
            />

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">
                {error}
              </p>
            )}
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
              type="button"
              disabled={isUploading || !csvText.trim()}
              onClick={handleUpload}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 shadow-2xs transition-all"
            >
              {isUploading ? 'Uploading...' : 'Upload Subjects'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
