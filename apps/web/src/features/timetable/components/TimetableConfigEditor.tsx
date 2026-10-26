import React, { useState } from 'react';
import { ArrowLeft, Check, Search, UserRound, X } from 'lucide-react';
import type {
  DepartmentTimetableItem,
  TimetableConfig,
  BreakItem,
  PeriodAllocation,
  DayOfWeek,
  TeachingStaffOption,
  SubjectOption,
} from '../types/timetable.types';
import { BreakConfigurator } from './BreakConfigurator';
import { PeriodGrid } from './PeriodGrid';
import { PeriodAssignModal } from './PeriodAssignModal';
import { TimetableConfirmationModal } from './TimetableConfirmationModal';

interface TimetableConfigEditorProps {
  department: DepartmentTimetableItem;
  initialConfig?: TimetableConfig | null;
  teachingStaff: TeachingStaffOption[];
  availableSubjects: SubjectOption[];
  isSaving: boolean;
  onBack: () => void;
  onSave: (config: Partial<TimetableConfig>) => Promise<void>;
}

const getDefaultShiftStartTime = (selectedShift: string) => {
  switch (selectedShift) {
    case 'Afternoon':
      return '13:30';
    case 'Evening':
      return '17:00';
    case 'Morning':
    default:
      return '09:30';
  }
};

const normalizeTimeInput = (value?: string) => {
  if (!value) return '09:30';

  const match = value.match(/(\d{1,2}):(\d{2})/i);
  if (!match) return '09:30';

  const hours = Number(match[1]);
  const minutes = match[2];
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const formatTimeForDisplay = (timeValue: string) => {
  if (!timeValue) return '09:30 AM';

  const [hoursStr, minutesStr] = timeValue.split(':');
  const hours = Number(hoursStr);
  const minutes = minutesStr || '00';
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;

  return `${twelveHour}:${minutes} ${suffix}`;
};

export const TimetableConfigEditor: React.FC<TimetableConfigEditorProps> = ({
  department,
  initialConfig,
  teachingStaff,
  availableSubjects,
  isSaving,
  onBack,
  onSave,
}) => {
  const [shift, setShift] = useState(initialConfig?.shift || 'Morning');
  const [periodStartTime, setPeriodStartTime] = useState(
    initialConfig?.startTime
      ? normalizeTimeInput(initialConfig.startTime)
      : getDefaultShiftStartTime(initialConfig?.shift || 'Morning')
  );
  const [totalPeriods, setTotalPeriods] = useState<number>(initialConfig?.totalPeriods || 8);
  const [periodDurationMinutes, setPeriodDurationMinutes] = useState<number>(
    initialConfig?.periodDurationMinutes || 30
  );
  const [subCategory, setSubCategory] = useState(
    initialConfig?.subCategory || department.sections[0] || 'A Section'
  );
  const [classTeacherId, setClassTeacherId] = useState(initialConfig?.classTeacherId || '');
  const [isClassTeacherModalOpen, setIsClassTeacherModalOpen] = useState(false);
  const [classTeacherSearch, setClassTeacherSearch] = useState('');
  const [periodStartTimeError, setPeriodStartTimeError] = useState('');

  const [breaks, setBreaks] = useState<BreakItem[]>(
    initialConfig?.breaksConfig && initialConfig.breaksConfig.length > 0
      ? initialConfig.breaksConfig
      : [
        {
          id: 'break-1',
          name: 'Break 1',
          time: '00:15:00',
          durationMinutes: 15,
          inBetween: '2 to 3',
        },
      ]
  );

  const [allocations, setAllocations] = useState<PeriodAllocation[]>(
    initialConfig?.allocations || []
  );

  const [activeSlot, setActiveSlot] = useState<{
    day: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleShiftChange = (nextShift: string) => {
    setShift(nextShift);

    setPeriodStartTime((currentTime) => {
      const previousDefault = getDefaultShiftStartTime(shift);

      if (!currentTime || currentTime === previousDefault) {
        return getDefaultShiftStartTime(nextShift);
      }

      return currentTime;
    });

    setPeriodStartTimeError('');
  };

  const handleSelectSlot = (
    day: DayOfWeek,
    periodNumber: number,
    startTime: string,
    endTime: string
  ) => {
    setActiveSlot({ day, periodNumber, startTime, endTime });
  };

  const handleSavePeriod = (newAlloc: PeriodAllocation) => {
    setAllocations((prev) => {
      const filtered = prev.filter(
        (a) => !(a.dayOfWeek === newAlloc.dayOfWeek && a.periodNumber === newAlloc.periodNumber)
      );
      return [...filtered, newAlloc];
    });
  };

  const handleRemovePeriod = (day: DayOfWeek, periodNumber: number) => {
    setAllocations((prev) =>
      prev.filter((a) => !(a.dayOfWeek === day && a.periodNumber === periodNumber))
    );
  };

  const handleConfirmSave = async () => {
    if (!periodStartTime || !periodStartTime.trim()) {
      setPeriodStartTimeError('Period start time is required.');
      return;
    }

    const classTeacher = teachingStaff.find((s) => s.staffId === classTeacherId);

    const payload: Partial<TimetableConfig> & {
      academicConfigurationId: string;
      departmentName: string;
      subCategory: string;
    } = {
      academicConfigurationId: department.id,
      departmentName: department.departmentName,
      academicYear: department.academicYear,
      subCategory,
      shift,
      totalPeriods,
      periodDurationMinutes,
      startTime: formatTimeForDisplay(periodStartTime),
      classTeacherId,
      classTeacherName: classTeacher?.name || '',
      breaksConfig: breaks,
      allocations,
    };

    await onSave(payload);
    setShowConfirmModal(false);
  };

  const currentAllocation = activeSlot
    ? allocations.find(
      (a) => a.dayOfWeek === activeSlot.day && a.periodNumber === activeSlot.periodNumber
    )
    : undefined;

  const selectedClassTeacher = teachingStaff.find((staff) => staff.staffId === classTeacherId);
  const filteredClassTeachers = teachingStaff.filter((staff) => {
    const query = classTeacherSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      staff.name.toLowerCase().includes(query) ||
      staff.department?.toLowerCase().includes(query) ||
      staff.role?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {department.departmentName}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Shift <span className="text-red-500">*</span>
              </label>
              <select
                value={shift}
                onChange={(e) => handleShiftChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                No of session/ Period <span className="text-red-500">*</span>
              </label>
              <select
                value={totalPeriods}
                onChange={(e) => setTotalPeriods(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {String(num).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Period Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={periodStartTime}
                required
                onChange={(e) => {
                  setPeriodStartTime(e.target.value);
                  if (e.target.value) {
                    setPeriodStartTimeError('');
                  }
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${periodStartTimeError ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
              />
              {periodStartTimeError && (
                <p className="mt-1 text-[10px] text-red-500">{periodStartTimeError}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Sub Category <span className="text-red-500">*</span>
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {department.sections.length > 0 ? (
                  department.sections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="A Section">A Section</option>
                    <option value="B Section">B Section</option>
                  </>
                )}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Period Time <span className="text-red-500">*</span>
              </label>
              <select
                value={periodDurationMinutes}
                onChange={(e) => setPeriodDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} mins
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Class Teacher Assign <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsClassTeacherModalOpen(true)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-medium text-zinc-900 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {selectedClassTeacher ? (
                  <div className="flex items-center gap-2.5">
                    {selectedClassTeacher.photoUrl ? (
                      <img
                        src={selectedClassTeacher.photoUrl}
                        alt={selectedClassTeacher.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                        {selectedClassTeacher.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{selectedClassTeacher.name}</div>
                      {selectedClassTeacher.department && (
                        <div className="truncate text-[10px] text-zinc-500">
                          {selectedClassTeacher.department}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-zinc-500">Select Staff</span>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <BreakConfigurator
              breaks={breaks}
              onChange={setBreaks}
              totalPeriods={totalPeriods}
            />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <PeriodGrid
            totalPeriods={totalPeriods}
            periodDurationMinutes={periodDurationMinutes}
            startTime={formatTimeForDisplay(periodStartTime)}
            breaks={breaks}
            allocations={allocations}
            onSelectSlot={handleSelectSlot}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-7 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>

      {isClassTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Select Class Teacher</h3>
                <p className="text-[11px] text-zinc-500">Choose the staff member for this class.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClassTeacherModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={classTeacherSearch}
                  onChange={(e) => setClassTeacherSearch(e.target.value)}
                  placeholder="Search staff by name, department or role"
                  className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {filteredClassTeachers.length > 0 ? (
                  filteredClassTeachers.map((staff) => (
                    <button
                      key={staff.staffId}
                      type="button"
                      onClick={() => {
                        setClassTeacherId(staff.staffId);
                        setClassTeacherSearch('');
                        setIsClassTeacherModalOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${classTeacherId === staff.staffId
                          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-800'
                        }`}
                    >
                      {staff.photoUrl ? (
                        <img src={staff.photoUrl} alt={staff.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {staff.name}
                        </div>
                        <div className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                          {staff.role || 'Teaching Staff'}
                          {staff.department ? ` • ${staff.department}` : ''}
                        </div>
                      </div>

                      {classTeacherId === staff.staffId && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                          <UserRound className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    No staff match your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSlot && (
        <PeriodAssignModal
          isOpen={Boolean(activeSlot)}
          onClose={() => setActiveSlot(null)}
          day={activeSlot.day}
          periodNumber={activeSlot.periodNumber}
          startTime={activeSlot.startTime}
          endTime={activeSlot.endTime}
          currentAllocation={currentAllocation}
          teachingStaff={teachingStaff}
          availableSubjects={availableSubjects}
          onSave={handleSavePeriod}
          onRemove={handleRemovePeriod}
        />
      )}

      <TimetableConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
        title="Confirmation"
        message="Are you sure you want Save this Time table Configuration ?"
      />
    </div>
  );
};
