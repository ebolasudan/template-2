// Custom error classes for better error handling

/**
 * Base application error class with enhanced context and tracing
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly requestId?: string;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    context?: {
      requestId?: string;
      userId?: string;
      path?: string;
      method?: string;
      userAgent?: string;
      ip?: string;
      [key: string]: any;
    }
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.requestId = context?.requestId || generateRequestId();
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Create error with detailed context from request
   */
  static fromRequest(
    message: string,
    request: Request,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR'
  ): AppError {
    const url = new URL(request.url);
    const context = {
      requestId: request.headers.get('x-request-id') || generateRequestId(),
      path: url.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: getClientIP(request),
    };
    
    return new AppError(message, statusCode, code, true, context);
  }
  
  /**
   * Get formatted error message with context
   */
  getDetailedMessage(): string {
    const parts = [this.message];
    
    if (this.requestId) {
      parts.push(`Request ID: ${this.requestId}`);
    }
    
    if (this.context?.path) {
      parts.push(`Path: ${this.context.path}`);
    }
    
    if (this.context?.userId) {
      parts.push(`User: ${this.context.userId}`);
    }
    
    return parts.join(' | ');
  }
}

// Utility functions for error context
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  return forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown';
}

// Specific error types with enhanced context
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly invalidValue?: any;
  
  constructor(
    message: string, 
    field?: string, 
    invalidValue?: any,
    context?: Parameters<typeof AppError.prototype.constructor>[4]
  ) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
    this.field = field;
    this.invalidValue = invalidValue;
  }
  
  static fromField(
    field: string,
    message: string,
    invalidValue?: any,
    context?: Parameters<typeof AppError.prototype.constructor>[4]
  ): ValidationError {
    const fullMessage = `Validation failed for field '${field}': ${message}`;
    return new ValidationError(fullMessage, field, invalidValue, context);
  }
  
  getDetailedMessage(): string {
    const base = super.getDetailedMessage();
    const parts = [base];
    
    if (this.field) {
      parts.push(`Field: ${this.field}`);
    }
    
    if (this.invalidValue !== undefined) {
      parts.push(`Value: ${JSON.stringify(this.invalidValue)}`);
    }
    
    return parts.join(' | ');
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