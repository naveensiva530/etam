import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useInstitution } from '@/context/InstitutionContext';
import { StaffInput, StaffRecord } from '@/features/shared';
import { getStaffApiError } from '@/features/staff/api';

interface BulkStaffRow {
  data: StaffInput;
  errors: string[];
  valid: boolean;
}

interface BulkStaffUploadProps {
  existingStaffIds: string[];
  onSaveBulkStaff: (staffList: StaffInput[]) => Promise<StaffRecord[]>;
  onClose: () => void;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === ',' && !inQuotes) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value.trim());
  return values;
}

function parseList(value: string | undefined): string[] {
  return value ? value.split(';').map((item) => item.trim()).filter(Boolean) : [];
}

function getScopeSummary(scope: StaffInput['teachingScope']): string {
  if (!scope) return '';
  if (scope.institution === 'School') {
    return [scope.teachingWing, ...scope.eligibleClasses, ...scope.skillTags].filter(Boolean).join(' • ');
  }
  if (scope.institution === 'College') {
    return [scope.department, ...scope.teachingYears, ...scope.specializations].filter(Boolean).join(' • ');
  }
  return [scope.track, ...scope.activeBatches, ...scope.modules].filter(Boolean).join(' • ');
}

export const BulkStaffUpload: React.FC<BulkStaffUploadProps> = ({
  existingStaffIds,
  onSaveBulkStaff,
  onClose,
}) => {
  const { institutionType, config } = useInstitution();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkStaffRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const headers = [
      'Staff ID',
      'Full Name',
      'Designation / Role',
      'Staff Type',
      'Highest Qualification',
      'Email',
      'Mobile',
      'Date of Joining (YYYY-MM-DD)',
      'Status',
    ];

    const scopeHeaders: Record<typeof institutionType, string[]> = {
      School: ['Teaching Wing', 'Eligible Classes (semicolon-separated)', 'Skill Tags (semicolon-separated)', 'Class Teacher Eligible (true/false)'],
      College: ['Teaching Department', 'Teaching Years (semicolon-separated)', 'Specializations (semicolon-separated)'],
      Training: ['Track / Domain', 'Active Batches (semicolon-separated)', 'Modules / Topics (semicolon-separated)'],
    };
    const scopeSamples: Record<typeof institutionType, string[][]> = {
      School: [
        ['Primary Wing (Class 1 - 5)', 'Class 1;Class 2;Class 3', 'Mathematics;Tamil', 'true'],
        ['', '', '', ''],
      ],
      College: [
        ['Department of Computer Science', '1st Year;2nd Year;3rd Year', 'Data Structures;AI/ML'],
        ['', '', ''],
      ],
      Training: [
        ['Full Stack Web Development (Batch 26)', 'MERN Cohort 12;Weekend FastTrack', 'React;TypeScript;Docker'],
        ['', '', ''],
      ],
    };
    const samples: Record<typeof institutionType, string[][]> = {
      School: [
        ['STF-2026-001', 'Dr. Rajesh Raman', 'Senior Teacher', 'Teaching', 'M.Sc, B.Ed', 'rajesh.r@school.edu', '9876501234', '2026-01-10', 'Active'],
        ['STF-2026-002', 'Meenakshi Sundaram', 'Headmistress', 'Teaching', 'M.Sc, M.Ed', 'meena.s@school.edu', '8765401235', '2026-03-01', 'Active'],
      ],
      College: [
        ['STF-2026-001', 'Dr. Rajesh Raman', 'Department Head', 'Teaching', 'Ph.D in AI & Systems', 'rajesh.r@college.edu', '9876501234', '2026-01-10', 'Active'],
        ['STF-2026-002', 'Karthik Varma', 'Assistant Professor', 'Teaching', 'M.E in Software Engg', 'karthik.v@college.edu', '9123456789', '2025-08-15', 'Probation'],
      ],
      Training: [
        ['STF-2026-001', 'Dr. Rajesh Raman', 'Lead Technical Mentor', 'Teaching', 'Ph.D in Computer Science', 'rajesh.r@training.edu', '9876501234', '2026-01-10', 'Active'],
        ['STF-2026-002', 'Karthik Varma', 'Senior Instructor', 'Teaching', 'M.Tech in Cloud Systems', 'karthik.v@training.edu', '9123456789', '2025-08-15', 'Active'],
      ],
    };

    const content = [
      [...headers, ...scopeHeaders[institutionType]].map((value) => `"${value}"`).join(','),
      ...samples[institutionType].map((row, index) =>
        [...row, ...scopeSamples[institutionType][index]].map((value) => `"${value.replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`;
    link.download = `${institutionType.toLowerCase()}_staff_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result;
      if (typeof text !== 'string') return;
      const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) {
        setError('CSV file is empty or only contains headers.');
        setRows([]);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const parsedRows = lines.slice(1).map((line, index): BulkStaffRow => {
        const values = parseCsvLine(line);
        const [
          staffId = '',
          name = '',
          role = 'Senior Teacher',
          staffType = '',
          qualification = 'M.Sc',
          email = '',
          mobile = '',
          dateOfJoining = today,
          status = 'Active',
        ] = values;

        const rowErrors: string[] = [];
        const scopeValues = values.slice(9);
        const hasScopeValues = scopeValues.some((value) => value.trim() !== '');
        let teachingScope: StaffInput['teachingScope'];
        let department: string | undefined;

        if (hasScopeValues && institutionType === 'School') {
          const [teachingWing = '', eligibleClasses = '', skillTags = '', classTeacherEligible = ''] = scopeValues;
          const normalizedEligibility = classTeacherEligible.trim().toLowerCase();
          if (normalizedEligibility && !['true', 'false', 'yes', 'no'].includes(normalizedEligibility)) {
            rowErrors.push('Class Teacher Eligible must be true, false, yes, or no.');
          }
          teachingScope = {
            institution: 'School',
            teachingWing: teachingWing || undefined,
            eligibleClasses: parseList(eligibleClasses),
            skillTags: parseList(skillTags),
            classTeacherEligible: ['true', 'yes'].includes(normalizedEligibility),
          };
        } else if (hasScopeValues && institutionType === 'College') {
          const [scopeDepartment = '', teachingYears = '', specializations = ''] = scopeValues;
          department = scopeDepartment || undefined;
          teachingScope = {
            institution: 'College',
            department,
            teachingYears: parseList(teachingYears),
            specializations: parseList(specializations),
          };
        } else if (hasScopeValues && institutionType === 'Training') {
          const [track = '', activeBatches = '', modules = ''] = scopeValues;
          department = track || undefined;
          teachingScope = {
            institution: 'Training',
            track: track || undefined,
            activeBatches: parseList(activeBatches),
            modules: parseList(modules),
          };
        }

        if (!staffId) rowErrors.push('Staff ID is required.');
        if (!name) rowErrors.push('Name is required.');
        if (!role) rowErrors.push('Role is required.');
        if (!['Teaching', 'Non-Teaching', 'Other'].includes(staffType)) {
          rowErrors.push('Staff Type must be Teaching, Non-Teaching, or Other.');
        }
        if (!qualification) rowErrors.push('Qualification is required.');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          rowErrors.push('Valid email is required.');
        }
        if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
          rowErrors.push('Valid 10-digit mobile is required.');
        }
        if (!dateOfJoining || dateOfJoining > today) {
          rowErrors.push('Valid past or today joining date is required.');
        }

        const normalizedStaffId = staffId.toLowerCase();
        if (existingStaffIds.map((id) => id.toLowerCase()).includes(normalizedStaffId)) {
          rowErrors.push(`Staff ID ${staffId} already exists in database.`);
        }

        const duplicateInCsv = lines.slice(1).some((otherLine, otherIdx) => {
          if (otherIdx === index) return false;
          const otherStaffId = (parseCsvLine(otherLine)[0] || '').trim().toLowerCase();
          return otherStaffId === normalizedStaffId;
        });
        if (duplicateInCsv) {
          rowErrors.push(`Duplicate staff ID in CSV.`);
        }

        return {
          data: {
            staffId,
            name,
            role,
            institution: institutionType,
            staffType: staffType as StaffInput['staffType'],
            department,
            teachingScope,
            qualification,
            email: email.toLowerCase(),
            mobile,
            dateOfJoining,
            status: (status === 'Probation' || status === 'Archived' ? status : 'Active'),
          },
          errors: rowErrors,
          valid: rowErrors.length === 0,
        };
      });

      setRows(parsedRows);
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async () => {
    const validStaff = rows.filter((row) => row.valid).map((row) => row.data);
    if (validStaff.length === 0) {
      setError('No valid staff records found in CSV file.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSaveBulkStaff(validStaff);
      onClose();
    } catch (err) {
      setError(getStaffApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = rows.filter((row) => row.valid).length;

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {/* CSV Template Box */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40 sm:flex-row sm:items-center">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{config.editionTitle} • CSV Template</h4>
          <p className="mt-0.5 text-xs text-gray-500">Download the pre-formatted CSV template tailored exclusively for {institutionType} staff profiles.</p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" /> Download {institutionType} Sample CSV
        </button>
      </div>

      {/* Drag & Drop File Upload */}
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-colors hover:border-gray-500 dark:border-gray-700 dark:bg-gray-900">
        <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {fileName ? `Uploaded: ${fileName}` : `Select or drop your ${institutionType} staff CSV file here`}
        </h4>
        <p className="mb-4 mt-1 text-xs text-gray-400">Standard comma-delimited (.csv) records up to 10MB</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv, text/csv"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Upload className="h-3.5 w-3.5" /> Browse CSV File
        </button>
      </div>

      {/* Rows validation preview */}
      {!!rows.length && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
            <span>
              Total Parsed: <strong>{rows.length}</strong> records ({validCount} valid, {rows.length - validCount} with errors)
            </span>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                setFileName('');
              }}
              className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Clear
            </button>
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto text-xs">
            {rows.map((row, index) => (
              <div
                key={`${row.data.staffId || 'row'}-${index}`}
                className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
                    {row.valid ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    )}
                    {row.valid ? 'Valid' : 'Error'}
                  </span>
                  <span className="font-mono">{row.data.staffId || '-'}</span>
                </div>
                <p className="mt-1 font-medium">{row.data.name || '-'}</p>
                <p className="mt-0.5 text-gray-500">
                  {row.data.department || '-'} • {row.data.role || '-'}
                </p>
                {row.data.teachingScope && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Teaching scope: {getScopeSummary(row.data.teachingScope) || 'No scope details'}
                    {row.data.teachingScope.institution === 'School' && row.data.teachingScope.classTeacherEligible && ' • Class teacher eligible'}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-gray-500">
                  {row.errors.length ? row.errors.join(' • ') : 'Ready to import'}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-gray-200 pt-3 dark:border-gray-800">
            <button
              type="button"
              onClick={() => void handleUploadSubmit()}
              disabled={isSubmitting || validCount === 0}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {isSubmitting ? 'Importing...' : `Import ${validCount} Valid Staff`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
