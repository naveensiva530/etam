import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, Settings } from 'lucide-react';

interface MultiSkillDropdownProps {
  value: string[];
  options: string[];
  loading: boolean;
  onChange: (value: string[]) => void;
  onManageSkills?: () => void;
  label: string;
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 ' +
  'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 ' +
  'focus:ring-gray-900 dark:focus:ring-gray-100';

export const MultiSkillDropdown: React.FC<MultiSkillDropdownProps> = ({
  value,
  options,
  loading,
  onChange,
  onManageSkills,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const allOptions = useMemo(() => Array.from(new Set([...options, ...value])), [options, value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredOptions = allOptions.filter((option) =>
    option.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative">
      <div className={`${INPUT_CLASS} flex min-h-[38px] flex-wrap items-center gap-1.5`}>
        {value.map((skill) => (
          <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-gray-800">
            {skill}
            <button
              type="button"
              aria-label={`Remove ${skill}`}
              onClick={() => onChange(value.filter((item) => item !== skill))}
              className="text-gray-500 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => {
            setIsOpen(!isOpen);
            setSearch('');
          }}
          className="min-w-[120px] flex-1 py-0.5 text-left text-sm text-gray-500 outline-none"
        >
          {value.length ? 'Add another skill…' : `Choose ${label.toLowerCase()}`}
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="relative border-b border-gray-100 p-2 dark:border-gray-800">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              aria-label={`Search ${label}`}
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div role="listbox" aria-label={label} aria-multiselectable="true" className="max-h-48 overflow-y-auto py-1">
            {loading ? (
              <p className="px-3 py-3 text-sm text-gray-500">Loading {label.toLowerCase()}…</p>
            ) : filteredOptions.length ? (
              filteredOptions.map((option) => {
                const selected = value.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onChange(selected ? value.filter((item) => item !== option) : [...value, option])}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {option}
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-3 text-sm text-gray-500">No matching {label.toLowerCase()}.</p>
            )}
          </div>
          {onManageSkills && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onManageSkills();
              }}
              className="flex w-full items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-850 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Settings className="h-3.5 w-3.5" />
              Manage Skills
            </button>
          )}
        </div>
      )}
    </div>
  );
};
