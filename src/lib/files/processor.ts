import { storage } from '@/lib/firebase/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ValidationError } from '@/lib/errors';

export interface FileProcessorConfig {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  imageOptimization?: boolean;
  autoCompress?: boolean;
  generateThumbnails?: boolean;
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  processedName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  type: string;
  metadata: Record<string, any>;
  uploadedAt: Date;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class FileProcessor {
  private config: Required<FileProcessorConfig>;

  constructor(config: FileProcessorConfig = {}) {
    this.config = {
      maxSizeInMB: config.maxSizeInMB ?? 10,
      allowedTypes: config.allowedTypes ?? [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/json',
      ],
      imageOptimization: config.imageOptimization ?? true,
      autoCompress: config.autoCompress ?? true,
      generateThumbnails: config.generateThumbnails ?? true,
    };
  }

  // Main processing pipeline
  async process(file: File, userId: string): Promise<ProcessedFile> {
    // 1. Validate
    const validation = await this.validate(file);
    if (!validation.valid) {
      throw new ValidationError(validation.error!);
    }

    // 2. Optimize (if applicable)
    const optimizedFile = await this.optimize(file);

    // 3. Generate thumbnail (if image)
    let thumbnailBlob: Blob | null = null;
    if (this.isImage(file) && this.config.generateThumbnails) {
      thumbnailBlob = await this.generateThumbnail(optimizedFile);
    }

    // 4. Upload to storage
    const processedFile = await this.upload(optimizedFile, thumbnailBlob, userId);

    return processedFile;
  }

  // Validate file
  async validate(file: File): Promise<FileValidationResult> {
    // Check file type
    if (!this.config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    const maxSizeInBytes = this.config.maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${this.config.maxSizeInMB}MB`,
      };
    }

    // Additional validation for specific file types
    if (this.isImage(file)) {
      const imageValidation = await this.validateImage(file);
      if (!imageValidation.valid) {
        return imageValidation;
      }
    }

    return { valid: true };
  }

  // Optimize file (compression, resizing, etc.)
  async optimize(file: File): Promise<File> {
    if (!this.config.autoCompress) {
      return file;
    }

    if (this.isImage(file) && this.config.imageOptimization) {
      return this.optimizeImage(file);
    }

    // For other file types, return as-is for now
    return file;
  }

  // Optimize image
  private async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions (max 2048px on longest side)
        const maxDimension = 2048;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx!.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to optimize image'));
              return;
            }

            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          file.type,
          0.85 // 85% quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Generate thumbnail
  private async generateThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Fixed thumbnail size
        const thumbnailSize = 200;
        canvas.width = thumbnailSize;
        canvas.height = thumbnailSize;

        // Calculate crop to maintain aspect ratio
        const aspectRatio = img.width / img.height;
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;

        if (aspectRatio > 1) {
          sourceWidth = img.height;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          sourceHeight = img.width;
          sourceY = (img.height - sourceHeight) / 2;
        }

        // Draw thumbnail
        ctx!.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          thumbnailSize,
          thumbnailSize
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate thumbnail'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload to Firebase Storage
  private async upload(
    file: File,
    thumbnail: Blob | null,
    userId: string
  ): Promise<ProcessedFile> {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = file.name.split('.').pop() || '';
    const processedName = `${fileId}.${fileExtension}`;

    // Upload main file
    const mainPath = `uploads/${userId}/${processedName}`;
    const mainRef = ref(storage, mainPath);
    const mainSnapshot = await uploadBytes(mainRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        userId,
      },
    });
    const mainUrl = await getDownloadURL(mainSnapshot.ref);

    // Upload thumbnail if exists
    let thumbnailUrl: string | undefined;
    if (thumbnail) {
      const thumbnailPath = `uploads/${userId}/thumbnails/${fileId}.jpg`;
      const thumbnailRef = ref(storage, thumbnailPath);
      const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbnail, {
        contentType: 'image/jpeg',
      });
      thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
    }

    return {
      id: fileId,
      originalName: file.name,
      processedName,
      url: mainUrl,
      thumbnailUrl,
      size: file.size,
      type: file.type,
      metadata: {
        userId,
        path: mainPath,
      },
      uploadedAt: new Date(),
    };
  }

  // Delete file from storage
  async delete(processedFile: ProcessedFile): Promise<void> {
    const mainRef = ref(storage, processedFile.metadata.path);
    await deleteObject(mainRef);

    if (processedFile.thumbnailUrl) {
      const thumbnailPath = processedFile.metadata.path.replace(
        processedFile.processedName,
        `thumbnails/${processedFile.id}.jpg`
      );
      const thumbnailRef = ref(storage, thumbnailPath);
      await deleteObject(thumbnailRef).catch(() => {
        // Ignore thumbnail deletion errors
      });
    }
  }

  // Helper methods
  private isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private async validateImage(file: File): Promise<FileValidationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        // Check minimum dimensions
        if (img.width < 10 || img.height < 10) {
          resolve({
            valid: false,
            error: 'Image dimensions too small. Minimum size is 10x10 pixels.',
          });
          return;
        }

        // Check maximum dimensions
        if (img.width > 10000 || img.height > 10000) {
          resolve({
            valid: false,
            error: 'Image dimensions too large. Maximum size is 10000x10000 pixels.',
          });
          return;
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          error: 'Invalid image file or corrupted data.',
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Create singleton instance
export const fileProcessor = new FileProcessor();

// React hook for file processing
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export function useFileProcessor(config?: FileProcessorConfig) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processor = new FileProcessor(config);

  const processFile = useCallback(
    async (file: File): Promise<ProcessedFile | null> => {
      if (!user) {
        setError('User authentication required');
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const processed = await processor.process(file, user.uid);
        return processed;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'File processing failed';
        setError(errorMessage);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [user, processor]
  );

  const deleteFile = useCallback(
    async (processedFile: ProcessedFile): Promise<boolean> => {
      setError(null);

      try {
        await processor.delete(processedFile);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'File deletion failed';
        setError(errorMessage);
        return false;
      }
    },
    [processor]
  );

  return {
    processFile,
    deleteFile,
    isProcessing,
    error,
  };
}