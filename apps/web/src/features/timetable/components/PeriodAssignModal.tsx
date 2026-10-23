import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type {
  DayOfWeek,
  PeriodAllocation,
  TeachingStaffOption,
  SubjectOption,
} from '../types/timetable.types';

interface PeriodAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  currentAllocation?: PeriodAllocation;
  teachingStaff: TeachingStaffOption[];
  availableSubjects: SubjectOption[];
  onSave: (allocation: PeriodAllocation) => void;
  onRemove: (day: DayOfWeek, periodNumber: number) => void;
}

export const PeriodAssignModal: React.FC<PeriodAssignModalProps> = ({
  isOpen,
  onClose,
  day,
  periodNumber,
  startTime,
  endTime,
  currentAllocation,
  teachingStaff,
  availableSubjects,
  onSave,
  onRemove,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedTeacherId(currentAllocation?.teacherId || '');
      setSelectedSubjectName(currentAllocation?.subjectName || '');
    }
  }, [isOpen, currentAllocation]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubjectName) return;

    const teacher = teachingStaff.find((t) => t.staffId === selectedTeacherId);
    const subject = availableSubjects.find((s) => s.name === selectedSubjectName);

    onSave({
      dayOfWeek: day,
      periodNumber,
      startTime,
      endTime,
      teacherId: teacher?.staffId,
      teacherName: teacher?.name || 'Assigned Staff',
      teacherAvatar: teacher?.photoUrl || '',
      subjectCode: subject?.code || '',
      subjectName: selectedSubjectName,
    });
    onClose();
  };

  const handleRemove = () => {
    onRemove(day, periodNumber);
    onClose();
  };

  const selectedTeacher = teachingStaff.find((t) => t.staffId === selectedTeacherId);

  // Helper for ordinal suffix: 1st, 2nd, 3rd, 4th...
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {day} {getOrdinal(periodNumber)} Period
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Teacher Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Teacher <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                {selectedTeacher?.photoUrl ? (
                  <img
                    src={selectedTeacher.photoUrl}
                    alt={selectedTeacher.name}
                    className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 absolute left-2 pointer-events-none"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 absolute left-2 pointer-events-none">
                    {selectedTeacher ? selectedTeacher.name.charAt(0) : '?'}
                  </div>
                )}
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  <option value="">Select Teaching Staff</option>
                  {teachingStaff.map((staff) => (
                    <option key={staff.staffId} value={staff.staffId}>
                      {staff.name} {staff.department ? `(${staff.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSubjectName}
                onChange={(e) => setSelectedSubjectName(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="">Select Subject</option>
                {availableSubjects.map((subject, idx) => (
                  <option key={subject.code || idx} value={subject.name}>
                    {subject.name} {subject.code ? `[${subject.code}]` : ''}{' '}
                    {subject.type ? `(${subject.type})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              {currentAllocation && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60 transition-colors"
                >
                  Remove Period
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTeacherId || !selectedSubjectName}
                className="px-6 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
