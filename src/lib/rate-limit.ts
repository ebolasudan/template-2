import { RateLimitError } from './errors';

// Rate limit configuration
export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  api: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 requests per minute
  },
  auth: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5, // 5 attempts per 15 minutes
  },
  ai: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 5, // 5 AI requests per minute
  },
  upload: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 20, // 20 uploads per hour
  },
} as const;

// Simple in-memory store for rate limiting
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, interval: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      const resetTime = now + interval;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    record.count++;
    return record;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Create store instance
const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    rateLimitStore.cleanup();
  }, 5 * 60 * 1000);
}

// Get client identifier from request
function getClientId(request: Request): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Use the first available IP
  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  // You could also include user ID if authenticated
  const userId = request.headers.get('x-user-id');
  
  return userId ? `user:${userId}` : `ip:${ip}`;
}

// Rate limiter class
export class RateLimiter {
  constructor(private config: RateLimitConfig) {}

  async check(request: Request, identifier?: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const clientId = identifier || getClientId(request);
    const key = `rate-limit:${clientId}`;
    
    const { count, resetTime } = await rateLimitStore.increment(key, this.config.interval);
    const remaining = Math.max(0, this.config.uniqueTokenPerInterval - count);
    
    return {
      success: count <= this.config.uniqueTokenPerInterval,
      limit: this.config.uniqueTokenPerInterval,
      remaining,
      reset: resetTime,
    };
  }

  async reset(request: Request, identifier?: string): Promise<void> {
    const clientId = identifier || getClientId(request);
    const key = `rate-limit:${clientId}`;
    await rateLimitStore.reset(key);
  }
}

// Middleware for rate limiting
export function withRateLimit(
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
) {
  const limiter = new RateLimiter(config);

  return function rateLimitMiddleware<T extends (...args: any[]) => Promise<any>>(
    handler: T
  ): T {
    return (async (request: Request, ...args: any[]) => {
      const result = await limiter.check(request);

      // Add rate limit headers to response
      const response = new Response();
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
        response.headers.set('Retry-After', retryAfter.toString());
        
        throw new RateLimitError(retryAfter);
      }

      // Call the original handler
      const handlerResponse = await handler(request, ...args);

      // Copy rate limit headers to the actual response
      if (handlerResponse instanceof Response) {
        response.headers.forEach((value, key) => {
          handlerResponse.headers.set(key, value);
        });
      }

      return handlerResponse;
    }) as T;
  };
}

// Utility functions
export function createRateLimiter(config: RateLimitConfig = RATE_LIMIT_CONFIGS.api) {
  return new RateLimiter(config);
}

// Rate limit by user ID
export async function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): Promise<boolean> {
  const limiter = new RateLimiter(config);
  const mockRequest = new Request('http://localhost', {
    headers: { 'x-user-id': userId },
  });
  
  const result = await limiter.check(mockRequest);
  return result.success;
}

// Rate limit by API key
export async function checkApiKeyRateLimit(
  apiKey: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): Promise<boolean> {
  const limiter = new RateLimiter(config);
  const mockRequest = new Request('http://localhost');
  
  const result = await limiter.check(mockRequest, `api-key:${apiKey}`);
  return result.success;
}