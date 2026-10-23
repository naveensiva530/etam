import React from 'react';
import { ArrowLeft, Download, Edit3 } from 'lucide-react';
import type { TimetableConfig, DayOfWeek } from '../types/timetable.types';
import { DAYS_OF_WEEK } from '../types/timetable.types';
import { exportTimetableToCsv } from '../utils/timetable-export';

interface TimetableViewMatrixProps {
  config: TimetableConfig;
  onBack: () => void;
  onEdit: () => void;
}

export const TimetableViewMatrix: React.FC<TimetableViewMatrixProps> = ({
  config,
  onBack,
  onEdit,
}) => {
  const handleDownload = () => {
    exportTimetableToCsv(config);
  };

  // Group allocations by day
  const allocationsByDay = React.useMemo(() => {
    const map = new Map<DayOfWeek, typeof config.allocations>();
    DAYS_OF_WEEK.forEach((d) => {
      const items = (config.allocations || [])
        .filter((a) => a.dayOfWeek === d)
        .sort((a, b) => a.periodNumber - b.periodNumber);
      map.set(d, items);
    });
    return map;
  }, [config.allocations]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {config.departmentName}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Time table</span>
        </button>
      </div>

      {/* Main Schedule Matrix */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 font-bold text-zinc-700 dark:text-zinc-300">
              <th className="py-3 px-6 w-32 border-r border-zinc-200 dark:border-zinc-800 text-left">
                Day
              </th>
              <th className="py-3 px-6 text-center">
                Time table
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {DAYS_OF_WEEK.map((day) => {
              const dayAllocations = allocationsByDay.get(day) || [];

              return (
                <tr key={day} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20">
                  {/* Left Column: Day Label */}
                  <td className="py-6 px-6 font-bold text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800 align-middle text-left bg-zinc-50/30 dark:bg-zinc-900/30">
                    {day}
                  </td>

                  {/* Right Column: 3 Sub-Rows for Time, Subject, Teacher */}
                  <td className="p-4 align-top">
                    {dayAllocations.length === 0 ? (
                      <p className="text-zinc-400 py-4 text-center font-medium">
                        No periods scheduled for {day}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="flex gap-2.5 min-w-max pb-2">
                          {/* Row Labels (Time, Subject, Teacher) */}
                          <div className="flex flex-col gap-2 font-bold text-zinc-500 dark:text-zinc-400 text-[11px] justify-between pr-3 pt-2 select-none text-right w-16 shrink-0">
                            <span className="h-8 flex items-center justify-end">Time</span>
                            <span className="h-8 flex items-center justify-end">Subject</span>
                            <span className="h-8 flex items-center justify-end">Teacher</span>
                          </div>

                          {/* Period Columns */}
                          {dayAllocations.map((alloc, idx) => (
                            <div
                              key={alloc.id || idx}
                              className="flex flex-col gap-2 shrink-0 w-32"
                            >
                              {/* Time Pill */}
                              <div className="h-8 px-2.5 flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                                {alloc.startTime} - {alloc.endTime}
                              </div>

                              {/* Subject Pill */}
                              <div className="h-8 px-2.5 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-900 dark:text-zinc-100 text-[11px] truncate">
                                {alloc.subjectName}
                              </div>

                              {/* Teacher Pill */}
                              <div className="h-8 px-2.5 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-600 dark:text-zinc-400 text-[11px] truncate">
                                {alloc.teacherName}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Actions */}
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
          onClick={onEdit}
          className="px-7 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
};
