'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  className = '',
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'relative overflow-hidden',
    none: '',
  };

  const style = {
    width,
    height,
  };

  if (animation === 'wave') {
    return (
      <div
        className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
        style={style}
      >
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{
            translateX: ['100%', '200%'],
          }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: 1.5,
            ease: 'linear',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Preset skeleton components
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '80%' : '100%'}
          height="0.875rem"
          variant="text"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="50%" height="1rem" className="mb-2" />
          <Skeleton width="30%" height="0.75rem" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2 mt-4">
        <Skeleton width={80} height={32} variant="rectangular" />
        <Skeleton width={80} height={32} variant="rectangular" />
      </div>
    </div>
  );
}

export function SkeletonImage({ 
  aspectRatio = '16/9',
  className = '' 
}: { 
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio }}>
      <Skeleton variant="rectangular" width="100%" height="100%" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}