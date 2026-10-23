import React from 'react';
import { Clock, Check } from 'lucide-react';
import type {
  DayOfWeek,
  PeriodAllocation,
  BreakItem,
} from '../types/timetable.types';
import { DAYS_OF_WEEK } from '../types/timetable.types';
import { calculatePeriodSlots } from '../utils/timetable-time-calc';

interface PeriodGridProps {
  totalPeriods: number;
  periodDurationMinutes: number;
  startTime: string;
  breaks: BreakItem[];
  allocations: PeriodAllocation[];
  onSelectSlot: (day: DayOfWeek, periodNumber: number, slotStartTime: string, slotEndTime: string) => void;
}

export const PeriodGrid: React.FC<PeriodGridProps> = ({
  totalPeriods,
  periodDurationMinutes,
  startTime,
  breaks,
  allocations,
  onSelectSlot,
}) => {
  const slots = React.useMemo(() => {
    return calculatePeriodSlots(startTime, periodDurationMinutes, totalPeriods, breaks);
  }, [startTime, periodDurationMinutes, totalPeriods, breaks]);

  const allocationMap = React.useMemo(() => {
    const map = new Map<string, PeriodAllocation>();
    allocations.forEach((a) => {
      map.set(`${a.dayOfWeek}_${a.periodNumber}`, a);
    });
    return map;
  }, [allocations]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4">
      <table className="w-full text-center border-collapse text-xs">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold select-none">
            <th className="py-3 px-3 w-12 text-center">No</th>
            <th className="py-3 px-4 min-w-[140px] text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Time</span>
              </div>
            </th>
            {DAYS_OF_WEEK.map((day) => (
              <th key={day} className="py-3 px-3 min-w-[70px] uppercase font-bold text-center">
                {day.substring(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const p = slot.periodNumber;
            return (
              <React.Fragment key={`slot-row-${p}`}>
                {/* Period Row */}
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-zinc-500 dark:text-zinc-400">
                    {p}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const key = `${day}_${p}`;
                    const alloc = allocationMap.get(key);
                    const isConfigured = Boolean(alloc);

                    return (
                      <td key={key} className="py-3 px-2">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectSlot(day, p, slot.startTime, slot.endTime)
                          }
                          title={
                            isConfigured
                              ? `${day} Period ${p}: ${alloc?.subjectName} (${alloc?.teacherName})`
                              : `Click to assign ${day} Period ${p}`
                          }
                          className={`w-full min-h-[42px] rounded-xl flex items-center justify-center transition-all border ${
                            isConfigured
                              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white border-transparent shadow-sm'
                              : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800/80 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                          }`}
                        >
                          {isConfigured ? (
                            <div className="flex flex-col items-center justify-center gap-0.5 p-1">
                              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-[10px] font-bold truncate max-w-[65px]">
                                {alloc?.subjectName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-600 text-sm font-light">
                              +
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>

                {/* Break Banner if placed after this period */}
                {slot.breakAfter && (
                  <tr key={`break-${p}`}>
                    <td colSpan={2} className="py-2.5 px-3 bg-slate-700 dark:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider text-center">
                      {slot.breakAfter.name}
                    </td>
                    <td
                      colSpan={DAYS_OF_WEEK.length}
                      className="py-2.5 px-4 bg-slate-700 dark:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest text-center shadow-inner"
                    >
                      {slot.breakAfter.name}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
