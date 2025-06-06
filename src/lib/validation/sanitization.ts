/**
 * Input sanitization utilities to prevent XSS and other security vulnerabilities
 * 
 * This module provides comprehensive input sanitization for user-generated content,
 * preventing XSS attacks and ensuring data integrity.
 * 
 * @example
 * ```typescript
 * import { sanitizeText, sanitizeHtml } from '@/lib/validation/sanitization';
 * 
 * const cleanText = sanitizeText(userInput);
 * const cleanHtml = sanitizeHtml(htmlContent);
 * ```
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for different sanitization levels
 */
interface SanitizationConfig {
  maxLength?: number;
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  removeEmojis?: boolean;
  normalizeWhitespace?: boolean;
}

/**
 * Predefined sanitization configurations for common use cases
 */
export const SANITIZATION_CONFIGS = {
  // Strict text-only sanitization for user input
  TEXT_ONLY: {
    maxLength: 10000,
    allowHtml: false,
    removeEmojis: false,
    normalizeWhitespace: true,
  },
  
  // Chat message sanitization
  CHAT_MESSAGE: {
    maxLength: 50000,
    allowHtml: false,
    removeEmojis: false,
    normalizeWhitespace: true,
  },
  
  // Basic HTML content (for rich text editors)
  BASIC_HTML: {
    maxLength: 100000,
    allowHtml: true,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'blockquote'],
    allowedAttributes: {},
    normalizeWhitespace: false,
  },
  
  // Rich HTML content (for advanced editors)
  RICH_HTML: {
    maxLength: 200000,
    allowHtml: true,
    allowedTags: [
      'p', 'div', 'span', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'u', 'b', 'i', 's', 'code', 'pre',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img'
    ],
    allowedAttributes: {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'width', 'height'],
      'code': ['class'],
      'pre': ['class']
    },
    normalizeWhitespace: false,
  },
  
  // Filename sanitization
  FILENAME: {
    maxLength: 255,
    allowHtml: false,
    removeEmojis: true,
    normalizeWhitespace: true,
  },
  
  // URL/slug sanitization
  URL_SLUG: {
    maxLength: 100,
    allowHtml: false,
    removeEmojis: true,
    normalizeWhitespace: true,
  }
} as const;

/**
 * Sanitize plain text content to remove potentially dangerous characters
 * 
 * @param text - Input text to sanitize
 * @param config - Sanitization configuration
 * @returns Sanitized text
 */
export function sanitizeText(
  text: string, 
  config: SanitizationConfig = SANITIZATION_CONFIGS.TEXT_ONLY
): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  let sanitized = text;
  
  // Remove HTML tags if not allowed
  if (!config.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Remove potentially dangerous patterns
  sanitized = sanitized
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\bon\w+\s*=/gi, '')
    // Remove data: URLs (except safe ones)
    .replace(/data:(?!image\/(png|jpeg|gif|webp))[^;,]+[;,]/gi, '');
  
  // Remove emojis if specified
  if (config.removeEmojis) {
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }
  
  // Normalize whitespace
  if (config.normalizeWhitespace) {
    sanitized = sanitized
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double newline
      .trim();
  }
  
  // Truncate to max length
  if (config.maxLength && sanitized.length > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength).trim();
  }
  
  return sanitized;
}

/**
 * Sanitize HTML content using DOMPurify
 * 
 * @param html - HTML content to sanitize
 * @param config - Sanitization configuration
 * @returns Sanitized HTML
 */
export function sanitizeHtml(
  html: string,
  config: SanitizationConfig = SANITIZATION_CONFIGS.BASIC_HTML
): string {
  if (typeof html !== 'string') {
    return '';
  }
  
  if (!config.allowHtml) {
    return sanitizeText(html, config);
  }
  
  // Configure DOMPurify
  const purifyConfig: any = {
    ALLOWED_TAGS: config.allowedTags || [],
    ALLOWED_ATTR: Object.keys(config.allowedAttributes || {}),
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
  };
  
  // Add specific attribute rules
  if (config.allowedAttributes) {
    for (const [tag, attrs] of Object.entries(config.allowedAttributes)) {
      purifyConfig.ALLOWED_ATTR = purifyConfig.ALLOWED_ATTR.concat(attrs);
    }
  }
  
  let sanitized = DOMPurify.sanitize(html, purifyConfig);
  
  // Apply additional text-based sanitization
  if (config.normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
  }
  
  // Truncate to max length
  if (config.maxLength && sanitized.length > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength);
    // Try to close any open tags properly
    sanitized = DOMPurify.sanitize(sanitized + '...', purifyConfig);
  }
  
  return sanitized;
}

/**
 * Sanitize filename to prevent path traversal and other issues
 * 
 * @param filename - Filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return 'untitled';
  }
  
  return filename
    // Remove path separators
    .replace(/[\/\\:]/g, '')
    // Remove potentially dangerous characters
    .replace(/[<>"|?*]/g, '')
    // Remove control characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    // Remove leading/trailing dots and spaces
    .replace(/^[\s.]+|[\s.]+$/g, '')
    // Normalize to single spaces
    .replace(/\s+/g, ' ')
    // Limit length
    .substring(0, 255)
    .trim() || 'untitled';
}

/**
 * Sanitize URL slug for safe routing
 * 
 * @param text - Text to convert to URL slug
 * @returns URL-safe slug
 */
export function sanitizeUrlSlug(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    // Replace spaces and special chars with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 100);
}

/**
 * Sanitize email address
 * 
 * @param email - Email address to sanitize
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }
  
  const sanitized = email.toLowerCase().trim();
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  // Additional security checks
  if (sanitized.includes('..') || sanitized.includes('--')) {
    return null;
  }
  
  return sanitized;
}

/**
 * Sanitize phone number
 * 
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }
  
  // Keep only digits, spaces, hyphens, parentheses, and plus sign
  return phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
}

/**
 * Sanitize URL to prevent open redirects and other issues
 * 
 * @param url - URL to sanitize
 * @param allowedDomains - List of allowed domains (optional)
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string, allowedDomains?: string[]): string | null {
  if (typeof url !== 'string') {
    return null;
  }
  
  const trimmed = url.trim();
  
  // Block javascript: and data: URLs
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }
  
  try {
    const urlObj = new URL(trimmed, 'https://example.com');
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Check allowed domains if specified
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = urlObj.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(domain => 
        hostname === domain.toLowerCase() || 
        hostname.endsWith('.' + domain.toLowerCase())
      );
      
      if (!isAllowed) {
        return null;
      }
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Comprehensive input sanitizer that handles multiple data types
 * 
 * @param input - Input data to sanitize
 * @param type - Type of sanitization to apply
 * @param config - Optional configuration override
 * @returns Sanitized data
 */
export function sanitizeInput(
  input: unknown,
  type: keyof typeof SANITIZATION_CONFIGS = 'TEXT_ONLY',
  config?: Partial<SanitizationConfig>
): string {
  if (input === null || input === undefined) {
    return '';
  }
  
  const inputString = String(input);
  const finalConfig = { ...SANITIZATION_CONFIGS[type], ...config };
  
  if (finalConfig.allowHtml) {
    return sanitizeHtml(inputString, finalConfig);
  } else {
    return sanitizeText(inputString, finalConfig);
  }
}

/**
 * Batch sanitize an object's string properties
 * 
 * @param obj - Object to sanitize
 * @param fieldConfigs - Configuration for each field
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldConfigs: Record<keyof T, {
    type: keyof typeof SANITIZATION_CONFIGS;
    config?: Partial<SanitizationConfig>;
  }>
): T {
  const sanitized = { ...obj };
  
  for (const [field, { type, config }] of Object.entries(fieldConfigs)) {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      sanitized[field] = sanitizeInput(sanitized[field], type, config);
    }
  }
  
  return sanitized;
}

/**
 * Validate that sanitized input meets security requirements
 * 
 * @param input - Input to validate
 * @param maxLength - Maximum allowed length
 * @returns True if valid, false otherwise
 */
export function validateSanitizedInput(input: string, maxLength = 10000): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  // Check length
  if (input.length > maxLength) {
    return false;
  }
  
  // Check for potentially dangerous patterns that shouldn't exist after sanitization
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:(?!image)/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}