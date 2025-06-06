import { NextResponse } from 'next/server';
import { 
  AppError, 
  isAppError, 
  formatErrorResponse, 
  ConfigurationError,
  ExternalServiceError 
} from '@/lib/errors';

// Centralized error handler for API routes
export function handleError(error: unknown, path?: string): NextResponse {
  // Log error for monitoring
  console.error('API Error:', {
    error,
    path,
    timestamp: new Date().toISOString(),
  });

  // Handle known errors
  if (isAppError(error)) {
    return NextResponse.json(
      formatErrorResponse(error, path),
      { status: error.statusCode }
    );
  }

  // Handle Vercel AI SDK errors
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      const configError = new ConfigurationError('API key not configured');
      return NextResponse.json(
        formatErrorResponse(configError, path),
        { status: configError.statusCode }
      );
    }

    if (error.message.includes('rate limit')) {
      return NextResponse.json(
        formatErrorResponse(error, path),
        { status: 429 }
      );
    }

    // External service errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      const serviceError = new ExternalServiceError('AI Provider', error);
      return NextResponse.json(
        formatErrorResponse(serviceError, path),
        { status: serviceError.statusCode }
      );
    }
  }

  // Handle unknown errors
  const genericError = new AppError('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
  return NextResponse.json(
    formatErrorResponse(genericError, path, error),
    { status: 500 }
  );
}

// Async error wrapper for API routes
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options?: { path?: string }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error, options?.path);
    }
  }) as T;
}

// Request validation wrapper
export function withValidation<T>(
  schema: { parse: (data: unknown) => T },
  handler: (data: T, req: Request) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      return await handler(validatedData, req);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return handleError(
          new AppError('Invalid request data', 400, 'VALIDATION_ERROR'),
          req.url
        );
      }
      return handleError(error, req.url);
    }
  };
}