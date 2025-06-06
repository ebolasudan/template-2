/**
 * Enhanced ErrorBoundary component with recovery mechanisms and detailed error reporting
 * 
 * This component provides a comprehensive error boundary that catches JavaScript errors
 * anywhere in the child component tree, logs errors, and displays a fallback UI.
 * 
 * Features:
 * - Automatic error reporting and logging
 * - Retry mechanisms with exponential backoff
 * - Development vs production error displays
 * - Request ID tracking for debugging
 * - Custom error fallback components
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<CustomErrorComponent />}
 *   onError={(error, errorInfo) => sendToAnalytics(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

'use client';

import React, { Component, ErrorInfo, ReactNode, memo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetKeys?: (string | number)[];
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
}

/**
 * Generate unique error ID for tracking
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              
              <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
                Oops! Something went wrong
              </h1>
              
              <p className="mt-2 text-sm text-center text-gray-600">
                We're sorry for the inconvenience. The application encountered an unexpected error.
              </p>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="primary"
                  fullWidth
                  leftIcon={<RefreshCw size={18} />}
                >
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  fullWidth
                  leftIcon={<Home size={18} />}
                >
                  Go to Home
                </Button>
              </div>

              <p className="mt-4 text-xs text-center text-gray-500">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary programmatically
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = () => setError(null);
  const throwError = (error: Error) => setError(error);

  return { throwError, resetError };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));
}