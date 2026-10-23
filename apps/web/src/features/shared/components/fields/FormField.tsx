import React from 'react';

export interface FormFieldProps {
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

/**
 * Generic wrapper: label + field content (children) + optional error message.
 * Keeps every field consistent without repeating label/error boilerplate.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  htmlFor,
  className = '',
}) => (
  <div className={className}>
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
    >
      {label}
    </label>
    {children}
    {error && (
      <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1" role="alert">
        {error}
      </p>
    )}
  </div>
);
