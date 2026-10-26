import React, { useState, useMemo, useEffect } from 'react';
import { Zap, X, Check, Sparkles, UserRound, BookOpen, AlertCircle } from 'lucide-react';
import type {
  DayOfWeek,
  PeriodAllocation,
  TeachingStaffOption,
  SubjectOption,
  BreakItem,
} from '../types/timetable.types';
import { DAYS_OF_WEEK } from '../types/timetable.types';
import { calculatePeriodSlots } from '../utils/timetable-time-calc';

interface QuickFillPanelProps {
  totalPeriods: number;
  periodDurationMinutes?: number;
  startTime?: string;
  breaks?: BreakItem[];
  allocations: PeriodAllocation[];
  teachingStaff: TeachingStaffOption[];
  availableSubjects: SubjectOption[];
  onAssign: (allocations: PeriodAllocation[]) => void;
  onClose: () => void;
}

export const QuickFillPanel: React.FC<QuickFillPanelProps> = ({
  totalPeriods,
  periodDurationMinutes = 30,
  startTime = '09:30 AM',
  breaks = [],
  allocations,
  teachingStaff,
  availableSubjects,
  onAssign,
  onClose,
}) => {
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(
    availableSubjects[0]?.name || ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  // Slot calculations
  const slots = useMemo(() => {
    return calculatePeriodSlots(startTime, periodDurationMinutes, totalPeriods, breaks);
  }, [startTime, periodDurationMinutes, totalPeriods, breaks]);

  // Existing allocations lookup
  const allocationMap = useMemo(() => {
    const map = new Map<string, PeriodAllocation>();
    allocations.forEach((a) => {
      map.set(`${a.dayOfWeek}_${a.periodNumber}`, a);
    });
    return map;
  }, [allocations]);

  // Auto-fill teacher when subject changes
  useEffect(() => {
    if (!selectedSubjectName) return;

    const subject = availableSubjects.find((s) => s.name === selectedSubjectName);
    if (subject?.faculty) {
      const facultyNameClean = subject.faculty.trim().toLowerCase();
      const match = teachingStaff.find(
        (t) =>
          t.name.trim().toLowerCase() === facultyNameClean ||
          t.name.trim().toLowerCase().includes(facultyNameClean) ||
          facultyNameClean.includes(t.name.trim().toLowerCase())
      );

      if (match) {
        setSelectedTeacherId(match.staffId);
        setIsAutoFilled(true);
        return;
      }
    }

    // Default to first teacher if none matches
    if (!selectedTeacherId && teachingStaff.length > 0) {
      setSelectedTeacherId(teachingStaff[0].staffId);
      setIsAutoFilled(false);
    }
  }, [selectedSubjectName, availableSubjects, teachingStaff]);

  const selectedSubject = availableSubjects.find((s) => s.name === selectedSubjectName);
  const selectedTeacher = teachingStaff.find((t) => t.staffId === selectedTeacherId);

  // Toggle slot selection
  const toggleSlot = (day: DayOfWeek, period: number) => {
    const key = `${day}_${period}`;
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Select all days for a specific period
  const toggleRowPeriod = (period: number) => {
    const allSelected = DAYS_OF_WEEK.every((day) => selectedSlots.has(`${day}_${period}`));
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      DAYS_OF_WEEK.forEach((day) => {
        const key = `${day}_${period}`;
        if (allSelected) {
          next.delete(key);
        } else {
          next.add(key);
        }
      });
      return next;
    });
  };

  // Check if any selected slots will overwrite another subject
  const overwriteCount = useMemo(() => {
    let count = 0;
    selectedSlots.forEach((key) => {
      const existing = allocationMap.get(key);
      if (existing && existing.subjectName !== selectedSubjectName) {
        count++;
      }
    });
    return count;
  }, [selectedSlots, allocationMap, selectedSubjectName]);

  const handleApply = () => {
    if (!selectedSubjectName || !selectedTeacherId || selectedSlots.size === 0) return;

    const newAllocations: PeriodAllocation[] = [];

    selectedSlots.forEach((key) => {
      const [dayStr, periodStr] = key.split('_');
      const day = dayStr as DayOfWeek;
      const periodNumber = parseInt(periodStr, 10);

      // Find timing for this period
      const slotTiming = slots.find((s) => s.periodNumber === periodNumber);
      const existing = allocationMap.get(key);

      newAllocations.push({
        dayOfWeek: day,
        periodNumber,
        startTime: existing?.startTime || slotTiming?.startTime || '09:30 AM',
        endTime: existing?.endTime || slotTiming?.endTime || '10:00 AM',
        subjectName: selectedSubjectName,
        subjectCode: selectedSubject?.code || '',
        teacherId: selectedTeacherId,
        teacherName: selectedTeacher?.name || '',
        teacherAvatar: selectedTeacher?.photoUrl,
      });
    });

    onAssign(newAllocations);
    setSelectedSlots(new Set());
    onClose();
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-md dark:border-blue-900/60 dark:bg-zinc-900 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Quick Fill — Assign by Subject
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Multi-slot bulk assign
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Select a subject and teacher, then click the timetable cells to allocate multiple periods at once.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Subject & Teacher Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
        {/* Subject Dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            1. Select Subject <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedSubjectName}
              onChange={(e) => setSelectedSubjectName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            >
              {availableSubjects.map((sub) => (
                <option key={`${sub.code}-${sub.name}`} value={sub.name}>
                  {sub.name} {sub.code ? `(${sub.code})` : ''} {sub.faculty ? `— ${sub.faculty}` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedSubject?.type && (
            <span className="inline-block mt-1 text-[10px] text-zinc-500 font-medium">
              Type: {selectedSubject.type}
            </span>
          )}
        </div>

        {/* Teacher Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              2. Teaching Faculty <span className="text-red-500">*</span>
            </label>
            {isAutoFilled && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                <Sparkles className="w-2.5 h-2.5" />
                Auto-assigned
              </span>
            )}
          </div>
          <select
            value={selectedTeacherId}
            onChange={(e) => {
              setSelectedTeacherId(e.target.value);
              setIsAutoFilled(false);
            }}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
          >
            {teachingStaff.map((teacher) => (
              <option key={teacher.staffId} value={teacher.staffId}>
                {teacher.name} {teacher.department ? `(${teacher.department})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Picker */}
      <div className="py-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            3. Click the period slots to assign:
          </span>
          {selectedSlots.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSlots(new Set())}
              className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Clear selected ({selectedSlots.size})
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 font-bold select-none">
                <th className="py-2.5 px-3 w-16 text-center text-[10px] uppercase">Period</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day} className="py-2.5 px-2 uppercase font-bold text-center text-[10px]">
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalPeriods }, (_, i) => i + 1).map((period) => (
                <tr
                  key={`p-${period}`}
                  className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20"
                >
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => toggleRowPeriod(period)}
                      title={`Select/Deselect Period ${period} for all days`}
                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      P{period}
                    </button>
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const key = `${day}_${period}`;
                    const isSelected = selectedSlots.has(key);
                    const existing = allocationMap.get(key);
                    const isSameSubject = existing?.subjectName === selectedSubjectName;

                    return (
                      <td key={key} className="p-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSlot(day, period)}
                          className={`w-full h-11 rounded-lg text-[10px] font-medium transition-all flex flex-col items-center justify-center p-1 border ${isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/50'
                              : isSameSubject
                                ? 'bg-blue-50/70 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-300'
                                : existing
                                  ? 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:bg-zinc-800/30 dark:border-zinc-800 dark:text-zinc-400'
                                  : 'bg-white border-dashed border-zinc-200 text-zinc-400 hover:border-blue-400 hover:text-blue-600 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-blue-600'
                            }`}
                        >
                          {isSelected ? (
                            <div className="flex items-center gap-1 font-bold">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Selected</span>
                            </div>
                          ) : isSameSubject ? (
                            <>
                              <span className="font-bold truncate max-w-[70px]">Already Assigned</span>
                              <span className="text-[8px] opacity-75 truncate max-w-[70px]">
                                {existing?.teacherName?.split(' ')[0]}
                              </span>
                            </>
                          ) : existing ? (
                            <>
                              <span className="truncate max-w-[70px] font-semibold text-zinc-700 dark:text-zinc-300">
                                {existing.subjectName}
                              </span>
                              <span className="text-[8px] text-zinc-400 truncate max-w-[70px]">
                                {existing.teacherName?.split(' ')[0]}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-bold">+</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {overwriteCount > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-[10px] dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>
              {overwriteCount} slot{overwriteCount === 1 ? '' : 's'} already have a different subject and will be overwritten.
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Selected slots:{' '}
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {selectedSlots.size}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedSlots.size === 0 || !selectedSubjectName || !selectedTeacherId}
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Assign {selectedSlots.size} Slot{selectedSlots.size === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
};
