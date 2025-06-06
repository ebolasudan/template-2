// API Request/Response Types

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Chat API Types
export interface ChatRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
}

export interface ChatChoice {
  index: number;
  message: Message;
  finish_reason: string;
}

// Image Generation Types
export interface ImageGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  num_samples?: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  id: string;
  images: string[];
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  error?: string;
}

// Transcription Types
export interface TranscriptionRequest {
  audio: File | Blob;
  language?: string;
  model?: string;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  words?: TranscriptionWord[];
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// Deepgram WebSocket Types
export interface DeepgramConfig {
  model?: string;
  language?: string;
  smart_format?: boolean;
  punctuate?: boolean;
  profanity_filter?: boolean;
  redact?: string[];
  diarize?: boolean;
  multichannel?: boolean;
  alternatives?: number;
  numerals?: boolean;
}

export interface DeepgramResponse {
  url: string;
  options: DeepgramConfig;
}

// Error Response Types
export interface APIError {
  error: {
    message: string;
    type: string;
    code: string;
    status: number;
  };
}

// Generic API Response
export type APIResponse<T> = T | APIError;

// Type guards
export function isAPIError(response: any): response is APIError {
  return response && response.error && typeof response.error.message === 'string';
}