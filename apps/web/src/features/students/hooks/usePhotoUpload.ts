import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePhotoUploadReturn {
  photoUrl: string;
  setPhotoUrl: (url: string) => void;
  photoError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearPhotoError: () => void;
  handleRemovePhoto: () => void;
}

export function usePhotoUpload(initialUrl = ''): UsePhotoUploadReturn {
  const [photoUrl, setPhotoUrl] = useState(initialUrl);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync photoUrl when initialUrl changes (e.g. selecting different student in Edit)
  useEffect(() => {
    setPhotoUrl(initialUrl || '');
    setPhotoError('');
  }, [initialUrl]);

  const clearPhotoError = useCallback(() => setPhotoError(''), []);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoError('Photo must be JPG or PNG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo size cannot exceed 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
      setPhotoError('');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPhotoUrl('');
    setPhotoError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    photoUrl,
    setPhotoUrl,
    photoError,
    fileInputRef,
    handlePhotoUpload,
    clearPhotoError,
    handleRemovePhoto,
  };
}
