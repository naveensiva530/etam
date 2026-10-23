import React from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import type { BreakItem } from '../types/timetable.types';

interface BreakConfiguratorProps {
  breaks: BreakItem[];
  onChange: (breaks: BreakItem[]) => void;
  totalPeriods: number;
}

export const BreakConfigurator: React.FC<BreakConfiguratorProps> = ({
  breaks,
  onChange,
  totalPeriods,
}) => {
  const inBetweenOptions = React.useMemo(() => {
    const opts: string[] = [];
    for (let i = 1; i < totalPeriods; i++) {
      opts.push(`${i} to ${i + 1}`);
    }
    return opts;
  }, [totalPeriods]);

  const handleAddBreak = () => {
    const newBreakNumber = breaks.length + 1;
    const defaultInBetween =
      inBetweenOptions[Math.min(newBreakNumber * 2 - 1, inBetweenOptions.length - 1)] ||
      '2 to 3';

    const newBreak: BreakItem = {
      id: `break-${Date.now()}`,
      name: `Break ${newBreakNumber}`,
      time: '00:15:00',
      durationMinutes: 15,
      inBetween: defaultInBetween,
    };
    onChange([...breaks, newBreak]);
  };

  const handleUpdateBreak = (index: number, updates: Partial<BreakItem>) => {
    const next = [...breaks];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const handleRemoveBreak = (index: number) => {
    onChange(breaks.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
        Break Configuration
      </h3>

      <div className="space-y-3">
        {breaks.map((b, idx) => (
          <div
            key={b.id || idx}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3 relative group"
          >
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                Break Name <span className="text-red-500">*</span>
              </label>
              {breaks.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveBreak(idx)}
                  className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                  title="Remove Break"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <input
              type="text"
              value={b.name}
              onChange={(e) => handleUpdateBreak(idx, { name: e.target.value })}
              placeholder="e.g. Break 1"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Break Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={b.time}
                    onChange={(e) => {
                      const val = e.target.value;
                      let mins = 15;
                      const parts = val.split(':');
                      if (parts.length >= 2) {
                        mins = parseInt(parts[1], 10) || 15;
                      }
                      handleUpdateBreak(idx, { time: val, durationMinutes: mins });
                    }}
                    placeholder="00:15:00"
                    className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <Clock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  In Between <span className="text-red-500">*</span>
                </label>
                <select
                  value={b.inBetween}
                  onChange={(e) => handleUpdateBreak(idx, { inBetween: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {inBetweenOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddBreak}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 py-1 px-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Break</span>
        </button>
      </div>
    </div>
  );
};
