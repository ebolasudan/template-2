'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton';

export interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'spinner' | 'skeleton' | 'card' | 'text' | 'custom';
  fullHeight?: boolean;
  message?: string;
}

export default function LoadingBoundary({
  children,
  fallback,
  variant = 'spinner',
  fullHeight = false,
  message = 'Loading...',
}: LoadingBoundaryProps) {
  const heightClass = fullHeight ? 'min-h-screen' : 'min-h-[200px]';

  const defaultFallbacks = {
    spinner: (
      <div className={`flex flex-col items-center justify-center ${heightClass}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    ),
    skeleton: (
      <div className="space-y-4">
        <Skeleton width="100%" height={200} variant="rectangular" />
        <SkeletonText lines={3} />
      </div>
    ),
    card: <SkeletonCard />,
    text: <SkeletonText lines={5} />,
    custom: fallback,
  };

  return (
    <Suspense fallback={fallback || defaultFallbacks[variant]}>
      {children}
    </Suspense>
  );
}

// Higher-order component for adding loading boundaries
export function withLoadingBoundary<P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Omit<LoadingBoundaryProps, 'children'>
) {
  return React.forwardRef<any, P>((props, ref) => (
    <LoadingBoundary {...loadingProps}>
      <Component {...props} ref={ref} />
    </LoadingBoundary>
  ));
}

// Loading states for specific content types
export function LoadingSpinner({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
    </div>
  );
}

export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
          style={{
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function LoadingProgress({ 
  value = 0,
  message,
  className = '' 
}: { 
  value?: number;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      {message && (
        <p className="text-sm text-gray-600 mb-2">{message}</p>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{value}%</p>
    </div>
  );
}