import { unstable_cache } from 'next/cache';

// Cache configuration
export const CACHE_TAGS = {
  chat: 'chat',
  images: 'images',
  transcription: 'transcription',
  user: (userId: string) => `user-${userId}`,
} as const;

export const CACHE_DURATIONS = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  day: 86400, // 24 hours
} as const;

// Simple in-memory cache for development
const memoryCache = new Map<string, { value: any; expires: number }>();

// Memory cache implementation
export class MemoryCache {
  static get<T>(key: string): T | null {
    const item = memoryCache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  static set<T>(key: string, value: T, ttlSeconds: number): void {
    memoryCache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000),
    });
  }

  static delete(key: string): void {
    memoryCache.delete(key);
  }

  static clear(): void {
    memoryCache.clear();
  }

  static size(): number {
    return memoryCache.size;
  }
}

// Cached AI response function
export const getCachedAIResponse = unstable_cache(
  async (prompt: string, provider: 'openai' | 'anthropic') => {
    // This is a placeholder - in real implementation, you'd call the AI service
    return {
      response: `Cached response for: ${prompt}`,
      provider,
      timestamp: new Date().toISOString(),
    };
  },
  ['ai-response'],
  {
    revalidate: CACHE_DURATIONS.medium,
    tags: [CACHE_TAGS.chat],
  }
);

// Cached image generation
export const getCachedImage = unstable_cache(
  async (prompt: string, settings: any) => {
    // This is a placeholder - in real implementation, you'd call Replicate
    return {
      imageUrl: `https://placeholder.com/512x512?text=${encodeURIComponent(prompt)}`,
      prompt,
      settings,
      timestamp: new Date().toISOString(),
    };
  },
  ['image-generation'],
  {
    revalidate: CACHE_DURATIONS.day,
    tags: [CACHE_TAGS.images],
  }
);

// Cache key generators
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);
  
  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

// Cache wrapper for API routes
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    key: string;
    ttl?: number;
    tags?: string[];
  }
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = generateCacheKey(options.key, args[0] || {});
    
    // Check memory cache first
    const cached = MemoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Execute function
    const result = await fn(...args);
    
    // Store in memory cache
    MemoryCache.set(cacheKey, result, options.ttl || CACHE_DURATIONS.short);
    
    return result;
  }) as T;
}

// Revalidation helpers
export async function revalidateChat() {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(CACHE_TAGS.chat);
}

export async function revalidateImages() {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(CACHE_TAGS.images);
}

export async function revalidateUser(userId: string) {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(CACHE_TAGS.user(userId));
}

// Cleanup old cache entries periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, item] of memoryCache.entries()) {
      if (now > item.expires) {
        memoryCache.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}