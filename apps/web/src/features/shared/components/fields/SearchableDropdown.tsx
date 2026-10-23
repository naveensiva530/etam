import React, { useRef, useEffect } from 'react';
import { Search, Settings } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  /** Currently selected value */
  value: string;
  /** Called when user selects an option */
  onChange: (value: string) => void;
  /** Available options */
  options: DropdownOption[];
  placeholder?: string;
  /** Text shown while options are loading */
  loading?: boolean;
  loadingText?: string;
  /** Text shown when no options match the search */
  emptyText?: string;
  /** Aria label for the listbox */
  listboxLabel?: string;
  /** Optional footer action (e.g. "Manage Department") */
  footerAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  /** Controlled open state */
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Controlled search text */
  search: string;
  onSearchChange: (v: string) => void;
  /** Ref to attach to the container (for click-outside) */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  'aria-label'?: string;
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 ' +
  'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ' +
  'focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100';

/**
 * Generic searchable dropdown used for Department, Academic Year, or any list.
 * Fully controlled: open state, search text, and selected value are all driven by props.
 */
export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  loading = false,
  loadingText = 'Loading…',
  emptyText = 'No options found.',
  listboxLabel,
  footerAction,
  isOpen,
  onOpen,
  onClose,
  search,
  onSearchChange,
  containerRef,
  disabled = false,
  'aria-label': ariaLabel,
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const resolvedRef = (containerRef as React.RefObject<HTMLDivElement>) ?? internalRef;

  // Click-outside: only needed when we own the ref
  useEffect(() => {
    if (containerRef) return; // parent manages click-outside externally
    const handler = (e: MouseEvent) => {
      if (resolvedRef.current && !resolvedRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [containerRef, resolvedRef, onClose]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div ref={resolvedRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (isOpen ? onClose() : onOpen())}
        className={`${INPUT_CLASS} flex items-center justify-between text-left`}
      >
        <span className={value ? '' : 'text-gray-400'}>{value || placeholder}</span>
        <svg
          className={`w-4 h-4 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {/* Search */}
          <div className="relative border-b border-gray-100 p-2 dark:border-gray-800">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              aria-label={`Search ${listboxLabel ?? ''}`}
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Options list */}
          <div
            role="listbox"
            aria-label={listboxLabel}
            className="max-h-48 overflow-y-auto py-1"
          >
            {loading ? (
              <p className="px-3 py-3 text-sm text-gray-500">{loadingText}</p>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    onClose();
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    value === opt.value
                      ? 'font-medium text-gray-900 dark:text-gray-100'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-gray-500">
                {search.trim() ? emptyText : 'Nothing to show.'}
              </p>
            )}
          </div>

          {/* Optional footer action */}
          {footerAction && (
            <button
              type="button"
              onClick={footerAction.onClick}
              className="flex w-full items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-850 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {footerAction.icon ?? <Settings className="h-3.5 w-3.5" />}
              {footerAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
