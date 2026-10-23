import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useInstitution } from '@/context/InstitutionContext';
import { BloodGroupType, GenderType, StudentInput, StudentRecord } from '@/features/shared';
import { getStudentApiError } from '@/features/students/api';

interface BulkRow {
  data: StudentInput;
  errors: string[];
  valid: boolean;
}

interface BulkStudentUploadProps {
  existingAdmissionIds: string[];
  onSaveBulkStudents: (students: StudentInput[]) => Promise<StudentRecord[]>;
  onClose: () => void;
}

const ageAtDate = (birthDate: string) => {
  if (!birthDate) return 0;
  return Math.abs(new Date(Date.now() - new Date(birthDate).getTime()).getUTCFullYear() - 1970);
};

const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && inQuotes && line[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === ',' && !inQuotes) {
      fields.push(field.trim());
      field = '';
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error('CSV row contains an unclosed quoted field.');
  fields.push(field.trim());
  return fields;
};

export const BulkStudentUpload: React.FC<BulkStudentUploadProps> = ({
  existingAdmissionIds,
  onSaveBulkStudents,
  onClose,
}) => {
  const { institutionType, config } = useInstitution();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const headers = [
      'Register Number',
      config.studentIdLabel,
      'Full name',
      config.classFieldLabel,
      'Academic year',
      'Gender',
      'Date of joining (YYYY-MM-DD)',
      'Parent/Guardian name',
      'Parent/Guardian number',
      'Student mobile',
      'Date of birth (YYYY-MM-DD)',
      'Blood group',
      institutionType === 'School' ? 'Class' : institutionType === 'Training' ? 'Course' : 'Category',
      ...(institutionType === 'College' ? ['Subcategory'] : []),
      'Residence type',
      'Communication address',
      'PIN/ZIP',
      'Student status',
    ];
    const sampleRows: Record<typeof institutionType, string[][]> = {
      School: [
        ['REG-2026-001', 'SCH-10-A01', 'Aarav Sharma', 'Class 10 - Section A', '2026-2027', 'Male', '2026-06-01', 'Ramesh Sharma', '9876543210', '9876543211', '2010-04-12', 'O+', 'General', 'Day Scholar', '12 Main Road', '600001', 'Active'],
        ['REG-2026-002', 'SCH-12-S08', 'Sneha Venkatesh', 'Class 12 - Science', '2026-2027', 'Female', '2026-06-05', 'Venkatesh Prasad', '9443210987', '9443210988', '2008-02-18', 'AB+', 'BC', 'Hosteller', '22 Lake Street', '600002', 'Active'],
      ],
      College: [
        ['REG-2026-001', 'COL-CS-042', 'Ananya Krishnan', 'B.Tech - Computer Science & Engg', '2026-2027', 'Female', '2026-07-15', 'Krishnan Nair', '8765432109', '8765432109', '2005-09-22', 'B+', 'General', '', 'Day Scholar', '15 College Road', '641001', 'Active'],
        ['REG-2026-002', 'COL-DS-014', 'Rohan Mehta', 'B.Sc - Data Science & AI', '2026-2027', 'Male', '2026-07-20', '', '', '9789012345', '2004-12-10', 'O-', 'SC', '', 'Hosteller', 'College Hostel', '641002', 'Pending'],
      ],
      Training: [
        ['REG-2026-001', 'TRN-FSD-019', 'Mohammed Faisal', 'Full Stack Web Development (Batch 26)', '2026-2027', 'Male', '2026-08-01', '', '', '9123456780', '2002-11-05', 'A+', 'Full Stack Development', 'Day Scholar', '8 Training Lane', '500001', 'Active'],
        ['REG-2026-002', 'TRN-AIML-004', 'Tanvi Joshi', 'AI & Machine Learning Bootcamp (Cohort 4)', '2026-2027', 'Female', '2026-08-05', 'Sunil Joshi', '9811223344', '9811223345', '2009-03-14', 'B+', 'AI & Machine Learning', 'Hosteller', 'Training Hostel', '500002', 'Pending'],
      ],
    };
    const samples = sampleRows[institutionType];
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const content = [headers.join(','), ...samples.map((row) => row.map(escapeCsv).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`;
    link.download = `${institutionType.toLowerCase()}_students_template.csv`;
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
      const parsedRows = lines.slice(1).map((line, index): BulkRow => {
        let values: string[];
        let parseError = '';
        try {
          values = parseCsvLine(line);
        } catch (parseFailure) {
          values = [];
          parseError = parseFailure instanceof Error ? parseFailure.message : 'CSV row is malformed.';
        }
        const [
          admissionId = '', studentId = '', studentName = '', department = '',
          academicYear = '', gender = 'Male', dateOfJoining = today,
          parentName = '', parentMobile = '', studentMobile = '', dob = '', bloodGroup = 'O+',
        ] = values;
        const category = values[12] ?? '';
        const subcategory = institutionType === 'College' ? values[13] ?? '' : '';
        const residenceIndex = institutionType === 'College' ? 14 : 13;
        const residenceType = values[residenceIndex] || 'Day Scholar';
        const communicationAddress = values[residenceIndex + 1] ?? '';
        const pinZip = values[residenceIndex + 2] ?? '';
        const status = values[residenceIndex + 3] || 'Active';

        const errors: string[] = parseError ? [parseError] : [];
        if (!admissionId) errors.push('Register number is missing');
        if (existingAdmissionIds.includes(admissionId)) errors.push(`Duplicate register number: ${admissionId}`);
        if (!studentId) errors.push(`${config.studentIdLabel} is missing`);
        if (!studentName || studentName.length > 100 || !/^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u.test(studentName)) errors.push('Enter a valid full name (maximum 100 characters)');
        if (!department) errors.push(`${config.classFieldLabel} is missing`);
        if (dateOfJoining > today) errors.push('Date of joining cannot be future');

        const under18 = dob ? ageAtDate(dob) < 18 : false;
        if (institutionType === 'School' || (institutionType === 'Training' && under18)) {
          if (!parentName) errors.push('Parent name required');
          if (!parentMobile || !/^[6-9]\d{9}$/.test(parentMobile)) errors.push('Parent mobile must be 10 digits starting 6-9');
        }
        if ((institutionType === 'College' || institutionType === 'Training') && (!studentMobile || !/^[6-9]\d{9}$/.test(studentMobile))) {
          errors.push('Student mobile must be 10 digits starting 6-9');
        }
        if ((institutionType === 'School' || institutionType === 'Training') && !dob) errors.push('Date of birth required');
        if (institutionType === 'School' && !bloodGroup) errors.push('Blood group required for School');
        if (residenceType && residenceType !== 'Day Scholar' && residenceType !== 'Hosteller') {
          errors.push('Residence type must be Day Scholar or Hosteller');
        }
        if (status !== 'Active' && status !== 'Pending' && status !== 'Inactive') {
          errors.push('Student status must be Active, Pending, or Inactive');
        }

        return {
          data: {
            admissionId, studentId, studentName, department, academicYear,
            gender: (gender === 'Female' || gender === 'Other' ? gender : 'Male') as GenderType,
            dateOfJoining, parentName: parentName || undefined, parentMobile: parentMobile || undefined,
            studentMobile: studentMobile || undefined, dob: dob || undefined,
            category: category || undefined,
            subcategory: subcategory || undefined,
            residenceType: residenceType as 'Day Scholar' | 'Hosteller',
            communicationAddress: communicationAddress || undefined,
            pinZip: pinZip || undefined,
            bloodGroup: (bloodGroup as BloodGroupType) || undefined, institution: institutionType,
            status: status as StudentInput['status'],
          },
          errors,
          valid: errors.length === 0,
        };
      });
      setRows(parsedRows);
    };
    reader.onerror = () => setError('Unable to read the selected CSV file.');
    reader.readAsText(file);
  };

  const importValidRows = async () => {
    const validStudents = rows.filter((row) => row.valid).map((row) => row.data);
    if (!validStudents.length) {
      setError('No valid records to import.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onSaveBulkStudents(validStudents);
      onClose();
    } catch (saveError) {
      setError(getStudentApiError(saveError));
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
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40 sm:flex-row sm:items-center">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{config.editionTitle} • CSV Template</h4>
          <p className="mt-0.5 text-xs text-gray-500">Download the pre-formatted CSV template tailored exclusively for {institutionType} admissions.</p>
        </div>
        <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 sm:self-auto">
          <Download className="h-3.5 w-3.5" /> Download {institutionType} Sample CSV
        </button>
      </div>
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-colors hover:border-gray-500 dark:border-gray-700 dark:bg-gray-900">
        <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fileName ? `Uploaded: ${fileName}` : `Select or drop your ${institutionType} CSV file here`}</h4>
        <p className="mb-4 mt-1 text-xs text-gray-400">Standard comma-delimited (.csv) records up to 10MB</p>
        <input ref={fileInputRef} type="file" accept=".csv, text/csv" onChange={handleFileChange} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
          <Upload className="h-3.5 w-3.5" /> Browse CSV File
        </button>
      </div>
      {!!rows.length && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
            <span>Total Parsed: <strong>{rows.length}</strong> records ({validCount} valid, {rows.length - validCount} with errors)</span>
            <button type="button" onClick={() => { setRows([]); setFileName(''); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">Clear</button>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto text-xs">
            {rows.map((row, index) => (
              <div key={`${row.data.admissionId || 'row'}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
                    {row.valid ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {row.valid ? 'Valid' : 'Error'}
                  </span>
                  <span className="font-mono">{row.data.admissionId || '-'}</span>
                </div>
                <p className="mt-1 font-medium">{row.data.studentName || '-'}</p>
                <p className="mt-0.5 text-gray-500">{row.data.department || '-'}</p>
                <p className="mt-1 text-[11px] text-gray-500">{row.errors.length ? row.errors.join(' • ') : 'Ready to import'}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-gray-200 pt-3 dark:border-gray-800">
            <button type="button" onClick={() => void importValidRows()} disabled={isSubmitting || validCount === 0} className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
              {isSubmitting ? 'Importing...' : `Import ${validCount} Valid Students`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
