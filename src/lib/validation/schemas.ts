/**
 * Validation schemas for API requests and responses using Zod
 * 
 * This module provides centralized validation schemas to ensure type safety
 * and consistent validation across all API endpoints.
 * 
 * @example
 * ```typescript
 * import { ChatRequestSchema } from '@/lib/validation/schemas';
 * 
 * const validatedData = ChatRequestSchema.parse(requestBody);
 * ```
 */

import { z } from 'zod';

// Message validation schema
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system'], {
    errorMap: () => ({ message: 'Role must be one of: user, assistant, system' })
  }),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(50000, 'Message content too long (max 50,000 characters)')
    .refine(
      (content) => content.trim().length > 0,
      'Message content cannot be only whitespace'
    )
});

// Chat request validation schema
export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema)
    .min(1, 'At least one message is required')
    .max(100, 'Too many messages (max 100)'),
  model: z.string()
    .optional()
    .refine(
      (model) => !model || ['gpt-4o', 'gpt-4', 'claude-3-5-sonnet-20240620', 'claude-3-sonnet-20240229'].includes(model),
      'Invalid model specified'
    ),
  temperature: z.number()
    .min(0, 'Temperature must be >= 0')
    .max(2, 'Temperature must be <= 2')
    .optional(),
  maxTokens: z.number()
    .int('Max tokens must be an integer')
    .min(1, 'Max tokens must be >= 1')
    .max(200000, 'Max tokens must be <= 200,000')
    .optional(),
  stream: z.boolean().optional().default(true)
});

// Image generation request validation schema
export const ImageGenerationRequestSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(2000, 'Prompt too long (max 2,000 characters)')
    .refine(
      (prompt) => prompt.trim().length > 0,
      'Prompt cannot be only whitespace'
    ),
  negative_prompt: z.string()
    .max(1000, 'Negative prompt too long (max 1,000 characters)')
    .optional(),
  width: z.number()
    .int('Width must be an integer')
    .min(256, 'Width must be >= 256')
    .max(2048, 'Width must be <= 2048')
    .refine((w) => w % 64 === 0, 'Width must be divisible by 64')
    .optional()
    .default(512),
  height: z.number()
    .int('Height must be an integer')
    .min(256, 'Height must be >= 256')
    .max(2048, 'Height must be <= 2048')
    .refine((h) => h % 64 === 0, 'Height must be divisible by 64')
    .optional()
    .default(512),
  num_inference_steps: z.number()
    .int('Inference steps must be an integer')
    .min(1, 'Inference steps must be >= 1')
    .max(100, 'Inference steps must be <= 100')
    .optional()
    .default(25),
  guidance_scale: z.number()
    .min(1, 'Guidance scale must be >= 1')
    .max(20, 'Guidance scale must be <= 20')
    .optional()
    .default(7.5),
  num_samples: z.number()
    .int('Number of samples must be an integer')
    .min(1, 'Number of samples must be >= 1')
    .max(4, 'Number of samples must be <= 4')
    .optional()
    .default(1),
  seed: z.number()
    .int('Seed must be an integer')
    .min(0, 'Seed must be >= 0')
    .max(2147483647, 'Seed must be <= 2147483647')
    .optional()
});

// Transcription request validation schema
export const TranscriptionRequestSchema = z.object({
  language: z.string()
    .length(2, 'Language must be a 2-letter code (e.g., "en")')
    .optional(),
  model: z.enum(['whisper-1', 'nova-2'], {
    errorMap: () => ({ message: 'Model must be whisper-1 or nova-2' })
  }).optional()
});

// LM Studio request validation schema
export const LMStudioRequestSchema = ChatRequestSchema.extend({
  top_p: z.number()
    .min(0, 'top_p must be >= 0')
    .max(1, 'top_p must be <= 1')
    .optional(),
  top_k: z.number()
    .int('top_k must be an integer')
    .min(1, 'top_k must be >= 1')
    .max(100, 'top_k must be <= 100')
    .optional(),
  repeat_penalty: z.number()
    .min(0.1, 'repeat_penalty must be >= 0.1')
    .max(2, 'repeat_penalty must be <= 2')
    .optional(),
  stop: z.array(z.string().max(100, 'Stop sequence too long'))
    .max(4, 'Too many stop sequences (max 4)')
    .optional()
});

// Deepgram configuration validation schema
export const DeepgramConfigSchema = z.object({
  model: z.string()
    .min(1, 'Model name is required')
    .optional(),
  language: z.string()
    .length(2, 'Language must be a 2-letter code')
    .optional(),
  smart_format: z.boolean().optional(),
  punctuate: z.boolean().optional(),
  profanity_filter: z.boolean().optional(),
  redact: z.array(z.string()).optional(),
  diarize: z.boolean().optional(),
  multichannel: z.boolean().optional(),
  alternatives: z.number()
    .int('Alternatives must be an integer')
    .min(1, 'Alternatives must be >= 1')
    .max(10, 'Alternatives must be <= 10')
    .optional(),
  numerals: z.boolean().optional()
});

// Generic API error response schema
export const APIErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    status: z.number(),
    timestamp: z.string(),
    path: z.string().optional(),
    details: z.any().optional()
  })
});

// Environment configuration schema
export const EnvConfigSchema = z.object({
  // Firebase (required)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
  
  // AI Services (optional)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  
  // LM Studio (optional)
  LM_STUDIO_BASE_URL: z.string().url('LM Studio base URL must be valid').optional(),
  LM_STUDIO_API_KEY: z.string().optional(),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('App URL must be valid').optional(),
  
  // Redis (optional)
  REDIS_URL: z.string().url('Redis URL must be valid').optional(),
  
  // Firebase Admin (optional)
  FIREBASE_ADMIN_PROJECT_ID: z.string().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email('Firebase admin client email must be valid').optional()
});

// User input sanitization schema
export const SanitizedTextSchema = z.string()
  .transform((text) => text.trim())
  .refine((text) => text.length > 0, 'Text cannot be empty after trimming')
  .refine(
    (text) => !/<script|javascript:|on\w+=/i.test(text),
    'Text contains potentially unsafe content'
  );

// File upload validation schema
export const FileUploadSchema = z.object({
  name: z.string().min(1, 'Filename is required'),
  size: z.number()
    .int('File size must be an integer')
    .min(1, 'File size must be > 0')
    .max(10 * 1024 * 1024, 'File size must be <= 10MB'), // 10MB limit
  type: z.string()
    .refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp', 'audio/wav', 'audio/mp3', 'audio/m4a'].includes(type),
      'Unsupported file type'
    )
});

// Export type definitions for TypeScript
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ImageGenerationRequest = z.infer<typeof ImageGenerationRequestSchema>;
export type TranscriptionRequest = z.infer<typeof TranscriptionRequestSchema>;
export type LMStudioRequest = z.infer<typeof LMStudioRequestSchema>;
export type DeepgramConfig = z.infer<typeof DeepgramConfigSchema>;
export type EnvConfig = z.infer<typeof EnvConfigSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;

/**
 * Validation error with detailed information
 */
export class ValidationError extends Error {
  public readonly field?: string;
  public readonly code: string;
  
  constructor(message: string, field?: string, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Safely parse and validate data with detailed error reporting
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Additional context for error reporting
 * @returns Validated data
 * @throws ValidationError with detailed information
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const firstError = result.error.errors[0];
    const field = firstError.path.join('.');
    const message = `${context ? `${context}: ` : ''}${firstError.message}${field ? ` (field: ${field})` : ''}`;
    
    throw new ValidationError(message, field);
  }
  
  return result.data;
}

/**
 * Validate multiple schemas and return all errors
 * 
 * @param validations - Array of validation functions
 * @returns Array of validation errors (empty if all valid)
 */
export function validateMultiple(validations: (() => void)[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const validate of validations) {
    try {
      validate();
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      }
    }
  }
  
  return errors;
}