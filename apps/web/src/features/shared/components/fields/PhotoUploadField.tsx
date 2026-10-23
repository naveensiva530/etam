import React from 'react';
import { Camera, Upload, User, X } from 'lucide-react';

interface PhotoUploadFieldProps {
  photoUrl: string;
  error?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
}

/**
 * Aadhaar / Government Portal format photo upload component:
 * 1. Big passport photo preview box on top (3.5 × 4.5 cm ratio).
 * 2. Dedicated upload button directly BELOW the photo box.
 */
export const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  photoUrl,
  error,
  fileInputRef,
  onUpload,
  onRemove,
}) => (
  <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-zinc-50/60 dark:bg-zinc-900/60 transition-colors">
    <input
      type="file"
      ref={fileInputRef}
      onChange={onUpload}
      accept="image/png, image/jpeg"
      className="hidden"
      aria-label="Upload photo"
    />

    {/* 1. Large Passport Photo Frame (Government Portal / Aadhaar standard 3.5 × 4.5 cm) */}
    <div
      onClick={() => fileInputRef.current?.click()}
      className={`group relative w-32 h-40 rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all shadow-xs ${
        photoUrl
          ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:ring-2 hover:ring-zinc-400'
          : 'border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
      }`}
      title={photoUrl ? 'Click to change photo' : 'Click to select passport photo'}
    >
      {photoUrl ? (
        <>
          <img
            src={photoUrl}
            alt="Passport Photo"
            className="w-full h-full object-cover"
          />
          {/* Hover overlay to change */}
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-2xs">
            <Camera className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Change Photo</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-700/80 flex items-center justify-center text-zinc-400 dark:text-zinc-300 mb-2">
            <User className="w-7 h-7 stroke-[1.5]" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">
            Passport Photo
          </span>
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            3.5 × 4.5 cm
          </span>
        </div>
      )}
    </div>

    {/* 2. Upload Option Directly BELOW the Photo Box */}
    <div className="mt-3 flex flex-col items-center w-full max-w-[160px] gap-1.5">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-2xs transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        {photoUrl ? 'Change Photo' : 'Upload Photo'}
      </button>

      {photoUrl && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" /> Remove Photo
        </button>
      )}
    </div>

    {error && (
      <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1.5 text-center" role="alert">
        {error}
      </p>
    )}
  </div>
);
