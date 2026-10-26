import React, { useState } from 'react';
import { Copy, X, Check, AlertTriangle } from 'lucide-react';
import type { DayOfWeek } from '../types/timetable.types';

interface CopyDayPopoverProps {
  sourceDay: DayOfWeek;
  allDays: DayOfWeek[];
  allocationsPerDay: Map<DayOfWeek, number>;
  onApply: (targetDays: DayOfWeek[]) => void;
  onClose: () => void;
}

export const CopyDayPopover: React.FC<CopyDayPopoverProps> = ({
  sourceDay,
  allDays,
  allocationsPerDay,
  onApply,
  onClose,
}) => {
  const otherDays = allDays.filter((d) => d !== sourceDay);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectAll = () => {
    setSelectedDays([...otherDays]);
  };

  const deselectAll = () => {
    setSelectedDays([]);
  };

  const sourceCount = allocationsPerDay.get(sourceDay) || 0;

  const handleApply = () => {
    if (selectedDays.length === 0) return;
    onApply(selectedDays);
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/70 dark:border-amber-900/40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
            <Copy className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Copy <span className="text-amber-600 dark:text-amber-400">{sourceDay}</span>'s Schedule
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {sourceCount} period{sourceCount === 1 ? '' : 's'} will be duplicated
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-400 hover:bg-amber-200/50 hover:text-zinc-700 dark:hover:bg-amber-900/50 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
            Select target days:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-[10px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Select All
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-[10px] font-semibold text-zinc-500 hover:underline dark:text-zinc-400"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {otherDays.map((day) => {
            const isSelected = selectedDays.includes(day);
            const currentDayCount = allocationsPerDay.get(day) || 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 shadow-sm ring-1 ring-amber-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {day}
                  </span>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-md text-[10px] ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'border border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>

                <span className="text-[9px] mt-1 text-zinc-500 dark:text-zinc-400">
                  {currentDayCount > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Overwrites {currentDayCount} slot{currentDayCount === 1 ? '' : 's'}
                    </span>
                  ) : (
                    'Empty day'
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {selectedDays.some((d) => (allocationsPerDay.get(d) || 0) > 0) && (
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100/70 text-amber-800 text-[10px] dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Target days with existing periods will be completely replaced.</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/70 dark:border-amber-900/40">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={selectedDays.length === 0}
          onClick={handleApply}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 text-xs font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          Apply to {selectedDays.length} Day{selectedDays.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  );
};
