import { 
  ChatRequest, 
  ChatResponse, 
  ImageGenerationRequest, 
  ImageGenerationResponse,
  TranscriptionRequest,
  TranscriptionResponse,
  DeepgramConfig,
  DeepgramResponse,
  APIError,
  APIResponse,
  isAPIError
} from '@/types/api';

// Type-safe API client
export class APIClient {
  private baseURL: string;
  private headers: HeadersInit;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || '';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  // Set authorization token
  setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  // Generic request handler with type safety
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          error: {
            message: data.error?.message || 'An error occurred',
            type: data.error?.type || 'api_error',
            code: data.error?.code || 'unknown',
            status: response.status,
          },
        } as APIError;
      }

      return data as T;
    } catch (error) {
      if (isAPIError(error)) {
        throw error;
      }
      
      throw {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          type: 'network_error',
          code: 'network_error',
          status: 0,
        },
      } as APIError;
    }
  }

  // Chat APIs
  async chatWithOpenAI(request: ChatRequest): Promise<APIResponse<ChatResponse>> {
    return this.request<ChatResponse>('/api/openai/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async chatWithAnthropic(request: ChatRequest): Promise<APIResponse<ChatResponse>> {
    return this.request<ChatResponse>('/api/anthropic/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Streaming chat APIs
  async streamChatWithOpenAI(request: ChatRequest): Promise<ReadableStream> {
    const response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.body!;
  }

  async streamChatWithAnthropic(request: ChatRequest): Promise<ReadableStream> {
    const response = await fetch('/api/anthropic/chat', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.body!;
  }

  // Image generation
  async generateImage(request: ImageGenerationRequest): Promise<APIResponse<ImageGenerationResponse>> {
    return this.request<ImageGenerationResponse>('/api/replicate/generate-image', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Audio transcription
  async transcribeAudio(request: TranscriptionRequest): Promise<APIResponse<TranscriptionResponse>> {
    const formData = new FormData();
    formData.append('audio', request.audio);
    if (request.language) formData.append('language', request.language);
    if (request.model) formData.append('model', request.model);

    return this.request<TranscriptionResponse>('/api/openai/transcribe', {
      method: 'POST',
      body: formData,
      headers: {
        ...this.headers,
        'Content-Type': undefined, // Let browser set content-type for FormData
      } as any,
    });
  }

  // Deepgram configuration
  async getDeepgramConfig(config?: DeepgramConfig): Promise<APIResponse<DeepgramResponse>> {
    return this.request<DeepgramResponse>('/api/deepgram', {
      method: 'POST',
      body: JSON.stringify({ options: config }),
    });
  }
}

// Create a singleton instance
export const apiClient = new APIClient();

// Helper hook for React components
import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export function useAPIClient() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // In a real app, you'd get the actual JWT token
      user.getIdToken().then(token => {
        apiClient.setAuthToken(token);
      });
    }
  }, [user]);

  return apiClient;
}