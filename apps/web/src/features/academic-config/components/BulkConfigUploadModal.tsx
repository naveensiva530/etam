import React, { useRef, useState } from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import { parseConfigCsvRow } from '../utils/csv-parser';
import { createAcademicConfiguration } from '../api';
import type { AcademicConfigItem, CreateAcademicConfigDto } from '../types';

interface BulkConfigUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: AcademicConfigItem[]) => void;
  existingConfigs: AcademicConfigItem[];
}

export const BulkConfigUploadModal: React.FC<BulkConfigUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingConfigs,
}) => {
  const [bulkCsv, setBulkCsv] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('Unable to read the selected CSV file.');
        return;
      }
      setBulkCsv(reader.result);
      setError('');
    };
    reader.onerror = () => setError('Unable to read the selected CSV file.');
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);
    setError('');

    const lines = bulkCsv.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      setError('Choose a CSV file with a header and at least one configuration row.');
      setIsUploading(false);
      return;
    }

    try {
      const headers = parseConfigCsvRow(lines[0]).map((h) => h.trim().toLowerCase());
      const yearIndex = headers.indexOf('academicyear');
      const classIndex = headers.indexOf('classname');
      const subCategoryIndex = headers.indexOf('subcategory');
      const statusIndex = headers.indexOf('status');

      if (yearIndex < 0 || classIndex < 0) {
        setError('CSV must contain academicYear and className columns.');
        setIsUploading(false);
        return;
      }

      const rows: CreateAcademicConfigDto[] = lines.slice(1).map((line, index) => {
        const values = parseConfigCsvRow(line);
        const academicYear = values[yearIndex]?.trim() ?? '';
        const className = values[classIndex]?.trim() ?? '';
        const subCategory = subCategoryIndex < 0 ? '' : values[subCategoryIndex]?.trim() ?? '';
        const rawStatus = statusIndex < 0 ? 'Active' : values[statusIndex]?.trim() || 'Active';

        if (!/^\d{4}-\d{4}$/.test(academicYear)) {
          throw new Error(`Row ${index + 2}: academicYear must use YYYY-YYYY format.`);
        }
        const [startYear, endYear] = academicYear.split('-').map(Number);
        if (endYear !== startYear + 1) {
          throw new Error(`Row ${index + 2}: end year must be the year immediately after start year.`);
        }
        if (!className) throw new Error(`Row ${index + 2}: className is required.`);
        if (rawStatus !== 'Active' && rawStatus !== 'Inactive') {
          throw new Error(`Row ${index + 2}: status must be Active or Inactive.`);
        }

        return {
          academicYear,
          className,
          subCategory,
          status: rawStatus === 'Inactive' ? 'Inactive' : 'Active',
          sections: [],
        };
      });

      const batchKeys = new Set<string>();
      for (const row of rows) {
        const key = `${row.academicYear.toLowerCase()}::${row.className.toLowerCase()}`;
        if (
          batchKeys.has(key) ||
          existingConfigs.some(
            (c) =>
              c.academicYear.toLowerCase() === row.academicYear.toLowerCase() &&
              c.className.toLowerCase() === row.className.toLowerCase()
          )
        ) {
          throw new Error(`Configuration already exists for ${row.className} (${row.academicYear}).`);
        }
        batchKeys.add(key);
      }

      const createdItems: AcademicConfigItem[] = [];
      for (const row of rows) {
        const created = await createAcademicConfiguration(row);
        createdItems.push(created);
      }

      onSuccess(createdItems);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to bulk upload configurations.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-config-title"
        className="w-full max-w-xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="bulk-config-title" className="text-sm font-bold">
              Bulk Upload Configurations
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Upload a CSV with academic year, class, optional sub-category, and status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bulk upload"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Choose CSV
          </button>
          <button
            type="button"
            onClick={() => {
              const link = document.createElement('a');
              link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(
                'academicYear,className,subCategory,status\n2026-2027,Class 10,General,Active'
              )}`;
              link.download = 'academic-configurations-template.csv';
              link.click();
            }}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Download template
          </button>
        </div>

        <textarea
          value={bulkCsv}
          onChange={(event) => {
            setBulkCsv(event.target.value);
            setError('');
          }}
          placeholder="academicYear,className,subCategory,status&#10;2026-2027,Grade 1,General,Active"
          rows={6}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-950 outline-none focus:ring-1 focus:ring-zinc-400"
        />

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isUploading || !bulkCsv.trim()}
            onClick={handleUpload}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
          >
            {isUploading ? 'Uploading...' : 'Upload Configurations'}
          </button>
        </div>
      </div>
    </div>
  );
};
