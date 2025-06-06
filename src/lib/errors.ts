// Custom error classes for better error handling

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded${retryAfter ? `. Try again in ${retryAfter} seconds` : ''}`,
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}${originalError ? ` - ${originalError.message}` : ''}`,
      502,
      'EXTERNAL_SERVICE_ERROR'
    );
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 503, 'CONFIGURATION_ERROR', false);
  }
}

// Error type guards
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

// Error response formatter
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    status: number;
    timestamp: string;
    path?: string;
    details?: any;
  };
}

export function formatErrorResponse(
  error: AppError | Error,
  path?: string,
  details?: any
): ErrorResponse {
  const isAppErr = isAppError(error);
  
  return {
    error: {
      message: error.message,
      code: isAppErr ? error.code : 'INTERNAL_ERROR',
      status: isAppErr ? error.statusCode : 500,
      timestamp: new Date().toISOString(),
      path,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    },
  };
}