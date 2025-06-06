'use client';

import React, { useEffect } from "react";
import { Image as ImageIcon, X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploadProps {
  onImageChange: (file: File | null) => void;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  className?: string;
}

export default function ImageUpload({ 
  onImageChange,
  maxSizeInMB = 5,
  acceptedFormats,
  className = ""
}: ImageUploadProps) {
  const {
    file,
    preview,
    isLoading,
    error,
    fileInputRef,
    handleFileSelect,
    removeFile,
    acceptString,
  } = useImageUpload({
    maxSizeInMB,
    acceptedFormats,
  });

  // Notify parent component of file changes
  useEffect(() => {
    onImageChange(file);
  }, [file, onImageChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`w-full ${className}`}>
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full h-64 group"
          >
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg" />
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              aria-label="Remove image"
            >
              <X size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.label
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            htmlFor="image-upload"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`
              flex flex-col items-center justify-center w-full h-64 
              border-2 border-gray-300 border-dashed rounded-lg 
              cursor-pointer bg-gray-50 hover:bg-gray-100 
              transition-colors duration-200
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isLoading ? (
                <Loader2 className="w-10 h-10 mb-3 text-gray-400 animate-spin" />
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-700">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    {acceptedFormats ? 
                      acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ') : 
                      'PNG, JPG, GIF, WEBP'
                    } (MAX. {maxSizeInMB}MB)
                  </p>
                </>
              )}
            </div>
          </motion.label>
        )}
      </AnimatePresence>

      <input
        type="file"
        id="image-upload"
        accept={acceptString}
        onChange={handleInputChange}
        className="hidden"
        ref={fileInputRef}
        disabled={isLoading}
      />

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600 flex items-center">
              <X className="w-4 h-4 mr-2" />
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}