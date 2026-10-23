import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
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

export const TimetableConfigEditor: React.FC<TimetableConfigEditorProps> = ({
  department,
  initialConfig,
  teachingStaff,
  availableSubjects,
  isSaving,
  onBack,
  onSave,
}) => {
  // Form State
  const [shift, setShift] = useState(initialConfig?.shift || 'Morning');
  const [totalPeriods, setTotalPeriods] = useState<number>(initialConfig?.totalPeriods || 8);
  const [periodDurationMinutes, setPeriodDurationMinutes] = useState<number>(
    initialConfig?.periodDurationMinutes || 30
  );
  const [category, setCategory] = useState(
    initialConfig?.category || department.subCategory || 'General'
  );
  const [subCategory, setSubCategory] = useState(
    initialConfig?.subCategory || department.sections[0] || 'A Section'
  );
  const [classTeacherId, setClassTeacherId] = useState(
    initialConfig?.classTeacherId || ''
  );

  // Breaks State
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

  // Allocations State
  const [allocations, setAllocations] = useState<PeriodAllocation[]>(
    initialConfig?.allocations || []
  );

  // Modal State
  const [activeSlot, setActiveSlot] = useState<{
    day: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Slot assignment handlers
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
        (a) =>
          !(a.dayOfWeek === newAlloc.dayOfWeek && a.periodNumber === newAlloc.periodNumber)
      );
      return [...filtered, newAlloc];
    });
  };

  const handleRemovePeriod = (day: DayOfWeek, periodNumber: number) => {
    setAllocations((prev) =>
      prev.filter(
        (a) => !(a.dayOfWeek === day && a.periodNumber === periodNumber)
      )
    );
  };

  // Submit Handler
  const handleConfirmSave = async () => {
    const classTeacher = teachingStaff.find((s) => s.staffId === classTeacherId);

    const payload: Partial<TimetableConfig> & {
      academicConfigurationId: string;
      departmentName: string;
      subCategory: string;
    } = {
      academicConfigurationId: department.id,
      departmentName: department.departmentName,
      academicYear: department.academicYear,
      category,
      subCategory,
      shift,
      totalPeriods,
      periodDurationMinutes,
      startTime: shift === 'Morning' ? '09:30 AM' : shift === 'Afternoon' ? '01:30 PM' : '05:00 PM',
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
        (a) =>
          a.dayOfWeek === activeSlot.day,
      )
    : undefined;

  return (
    <div className="space-y-6">
      {/* Top Header */}
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

      {/* Main Grid: Left Settings + Right Schedule Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Settings (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Shift */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Shift <span className="text-red-500">*</span>
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>

            {/* Total Periods */}
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

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Second Year"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            {/* Sub Category (Section) */}
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

          <div className="grid grid-cols-2 gap-4">
            {/* Period Duration */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Period Time <span className="text-red-500">*</span>
              </label>
              <select
                value={periodDurationMinutes}
                onChange={(e) => setPeriodDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value={30}>30 mins</option>
                <option value={40}>40 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
              </select>
            </div>

            {/* Class Teacher Assign */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Class Teacher Assign <span className="text-red-500">*</span>
              </label>
              <select
                value={classTeacherId}
                onChange={(e) => setClassTeacherId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="">Select Staff</option>
                {teachingStaff.map((staff) => (
                  <option key={staff.staffId} value={staff.staffId}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Break Configuration */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <BreakConfigurator
              breaks={breaks}
              onChange={setBreaks}
              totalPeriods={totalPeriods}
            />
          </div>
        </div>

        {/* Right Column: Interactive Schedule Matrix (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <PeriodGrid
            totalPeriods={totalPeriods}
            periodDurationMinutes={periodDurationMinutes}
            startTime={shift === 'Morning' ? '09:30 AM' : shift === 'Afternoon' ? '01:30 PM' : '05:00 PM'}
            breaks={breaks}
            allocations={allocations}
            onSelectSlot={handleSelectSlot}
          />

          {/* Bottom Footer Actions */}
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

      {/* Period Assign Modal */}
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

      {/* Save Confirmation Modal */}
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
