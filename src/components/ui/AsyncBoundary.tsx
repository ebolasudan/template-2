/**
 * AsyncBoundary component that combines ErrorBoundary and Suspense
 * 
 * This component provides a unified solution for handling both loading states
 * and error states in asynchronous components, ensuring consistent UX patterns.
 * 
 * @example
 * ```tsx
 * <AsyncBoundary
 *   fallback={<ChatMessageSkeleton />}
 *   errorFallback={CustomErrorComponent}
 * >
 *   <ChatMessages />
 * </AsyncBoundary>
 * ```
 */

'use client';

import React, { Suspense, memo } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { LoadingSpinner, LoadingDots } from './LoadingBoundary';

export interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ 
    error: Error; 
    retry: () => void;
    requestId?: string;
  }>;
  loadingVariant?: 'spinner' | 'dots' | 'skeleton';
  fullHeight?: boolean;
  className?: string;
}

/**
 * Default error fallback component with retry functionality
 */
const DefaultErrorFallback = memo(({ 
  error, 
  retry, 
  requestId 
}: { 
  error: Error; 
  retry: () => void;
  requestId?: string;
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <svg 
        className="w-6 h-6 text-red-600" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Something went wrong
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      {error.message || 'An unexpected error occurred'}
    </p>
    {requestId && (
      <p className="text-xs text-gray-400 mb-4">
        Request ID: {requestId}
      </p>
    )}
    <button
      onClick={retry}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Try Again
    </button>
  </div>
));

DefaultErrorFallback.displayName = 'DefaultErrorFallback';

/**
 * AsyncBoundary component that wraps children with error and loading boundaries
 */
const AsyncBoundary = memo<AsyncBoundaryProps>(({
  children,
  fallback,
  errorFallback: ErrorFallbackComponent = DefaultErrorFallback,
  loadingVariant = 'spinner',
  fullHeight = false,
  className = '',
}) => {
  // Memoize the default fallback to prevent recreation
  const defaultFallback = React.useMemo(() => {
    if (fallback) return fallback;
    
    const heightClass = fullHeight ? 'min-h-screen' : 'min-h-[200px]';
    const combinedClassName = `flex items-center justify-center ${heightClass} ${className}`;
    
    switch (loadingVariant) {
      case 'dots':
        return (
          <div className={combinedClassName}>
            <LoadingDots />
          </div>
        );
      case 'skeleton':
        return (
          <div className={`${combinedClassName} w-full`}>
            <div className="w-full max-w-md space-y-4">
              <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
              <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
              <div className="animate-pulse bg-gray-200 h-4 rounded w-5/6"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className={combinedClassName}>
            <LoadingSpinner />
          </div>
        );
    }
  }, [fallback, loadingVariant, fullHeight, className]);

  return (
    <ErrorBoundary fallback={<ErrorFallbackComponent error={new Error('Unknown error')} retry={() => window.location.reload()} />}>
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
});

AsyncBoundary.displayName = 'AsyncBoundary';

export default AsyncBoundary;

/**
 * Higher-order component that wraps a component with AsyncBoundary
 * 
 * @param Component - Component to wrap
 * @param boundaryProps - Props to pass to AsyncBoundary
 * @returns Wrapped component with error and loading boundaries
 * 
 * @example
 * ```tsx
 * const SafeChatMessages = withAsyncBoundary(ChatMessages, {
 *   loadingVariant: 'skeleton',
 *   errorFallback: CustomChatErrorComponent
 * });
 * ```
 */
export function withAsyncBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<AsyncBoundaryProps, 'children'>
) {
  const WrappedComponent = memo<P>((props) => (
    <AsyncBoundary {...boundaryProps}>
      <Component {...props} />
    </AsyncBoundary>
  ));
  
  WrappedComponent.displayName = `withAsyncBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for creating retry functionality in error boundaries
 * 
 * @returns Object with retry function and retry count
 * 
 * @example
 * ```tsx
 * const { retry, retryCount } = useRetry();
 * 
 * // In error fallback component
 * <button onClick={retry}>
 *   Retry {retryCount > 0 && `(${retryCount})`}
 * </button>
 * ```
 */
export function useRetry() {
  const [retryCount, setRetryCount] = React.useState(0);
  
  const retry = React.useCallback(() => {
    setRetryCount(prev => prev + 1);
    // Force re-render by updating a key or state
    window.location.reload();
  }, []);
  
  return { retry, retryCount };
}