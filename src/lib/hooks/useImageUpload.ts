import { useState, useCallback, useRef } from 'react';

export interface ImageUploadOptions {
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  onError?: (error: string) => void;
}

export interface ImageUploadState {
  file: File | null;
  preview: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useImageUpload(options: ImageUploadOptions = {}) {
  const {
    maxSizeInMB = 5,
    acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    onError,
  } = options;

  const [state, setState] = useState<ImageUploadState>({
    file: null,
    preview: null,
    isLoading: false,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `File size exceeds ${maxSizeInMB}MB limit`;
    }

    return null;
  }, [acceptedFormats, maxSizeInMB]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setState({
        file: null,
        preview: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      const error = validationError;
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    // Set loading state
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setState({
        file,
        preview: reader.result as string,
        isLoading: false,
        error: null,
      });
    };
    reader.onerror = () => {
      const error = 'Failed to read file';
      setState({
        file: null,
        preview: null,
        isLoading: false,
        error,
      });
      onError?.(error);
    };
    reader.readAsDataURL(file);
  }, [validateFile, onError]);

  const removeFile = useCallback(() => {
    setState({
      file: null,
      preview: null,
      isLoading: false,
      error: null,
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    // State
    ...state,
    fileInputRef,
    
    // Actions
    handleFileSelect,
    removeFile,
    openFilePicker,
    
    // Utilities
    acceptString: acceptedFormats.map(format => 
      format.replace('image/', '.')).join(','),
  };
}