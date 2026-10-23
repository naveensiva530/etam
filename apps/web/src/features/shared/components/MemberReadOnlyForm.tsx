import React from 'react';
import { ArrowLeft, User } from 'lucide-react';

export interface ReadOnlyField {
  label: string;
  value?: string;
  imageUrl?: string;
  customNode?: React.ReactNode;
  className?: string;
}

interface MemberReadOnlyFormProps {
  title: string;
  icon: React.ReactNode;
  fields: ReadOnlyField[];
  onClose: () => void;
}

/**
 * Standard Read-Only Field Card matching the requested specification:
 * - Rounded container with subtle border & background
 * - Top line: Gray label ending with colon (e.g. "Qualification:")
 * - Bottom line: Bold value (e.g. "M.Sc, B.Ed")
 */
export const ReadOnlyCard: React.FC<{ label: string; value?: string; className?: string }> = ({
  label,
  value,
  className = '',
}) => {
  const displayLabel = label.endsWith(':') ? label : `${label}:`;
  return (
    <div
      className={`rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-850/50 transition-colors ${className}`}
    >
      <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">
        {displayLabel}
      </span>
      <span className="mt-1 block text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
        {value || '—'}
      </span>
    </div>
  );
};

export const MemberReadOnlyForm: React.FC<MemberReadOnlyFormProps> = ({ title, icon, fields, onClose }) => {
  const photoIndex = fields.findIndex((f) => f.imageUrl !== undefined);
  const hasPhoto = photoIndex !== -1;

  const topFields = hasPhoto ? fields.slice(0, photoIndex) : fields;
  const photoField = hasPhoto ? fields[photoIndex] : null;
  const remainingFields = hasPhoto ? fields.slice(photoIndex + 1) : [];

  const splitMiddle = Math.ceil(remainingFields.length / 2);
  const col2Fields = remainingFields.slice(0, splitMiddle);
  const col3Fields = remainingFields.slice(splitMiddle);

  return (
    <section className="flex w-full flex-col overflow-hidden bg-white dark:bg-zinc-900">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="flex items-center gap-2 truncate text-base font-bold text-zinc-900 dark:text-zinc-100">
            {icon}{title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Top / General Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {topFields.map((field) =>
            field.customNode ? (
              <div key={field.label} className={field.className || ''}>
                {field.customNode}
              </div>
            ) : (
              <ReadOnlyCard
                key={field.label}
                label={field.label}
                value={field.value}
                className={field.className}
              />
            )
          )}
        </div>

        {/* Lower Grid with Photo (Col 1: Photo | Col 2: Fields | Col 3: Fields) */}
        {hasPhoto && photoField && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Column 1: Passport Photo Box */}
            <div className="md:col-span-1 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-850/50 flex flex-col items-center justify-center transition-colors">
              <div className="w-full text-left mb-2">
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {photoField.label.endsWith(':') ? photoField.label : `${photoField.label}:`}
                </span>
              </div>
              <div className="w-32 h-40 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden flex items-center justify-center shadow-xs">
                {photoField.imageUrl ? (
                  <img
                    src={photoField.imageUrl}
                    alt="Passport Photograph"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-700/80 flex items-center justify-center text-zinc-400 dark:text-zinc-300 mb-2">
                      <User className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">
                      Passport Photo
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Not Uploaded
                    </span>
                  </div>
                )}
              </div>
              <span className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {photoField.imageUrl ? 'Passport Size Photograph' : 'No photo uploaded'}
              </span>
            </div>

            {/* Column 2 */}
            <div className="md:col-span-1 flex flex-col gap-4">
              {col2Fields.map((field) =>
                field.customNode ? (
                  <div key={field.label} className={field.className || ''}>
                    {field.customNode}
                  </div>
                ) : (
                  <ReadOnlyCard
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    className={field.className}
                  />
                )
              )}
            </div>

            {/* Column 3 */}
            <div className="md:col-span-1 flex flex-col gap-4">
              {col3Fields.map((field) =>
                field.customNode ? (
                  <div key={field.label} className={field.className || ''}>
                    {field.customNode}
                  </div>
                ) : (
                  <ReadOnlyCard
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    className={field.className}
                  />
                )
              )}
            </div>
          </div>
        )}

        <footer className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close Details
          </button>
        </footer>
      </div>
    </section>
  );
};
