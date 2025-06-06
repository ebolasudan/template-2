import { withErrorHandler } from "@/lib/api/error-handler";
import { ChatRequest } from "@/types/api";
import { ValidationError, ConfigurationError, AuthenticationError, ExternalServiceError } from "@/lib/errors";
import { getServerSession } from "@/lib/auth/session";
import { withRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const runtime = "nodejs"; // LM Studio typically requires Node.js runtime

const rateLimitedHandler = withRateLimit(RATE_LIMIT_CONFIGS.ai)(async (req: Request) => {
  // Check authentication
  const session = await getServerSession(req);
  if (!session) {
    throw new AuthenticationError();
  }

  // Validate LM Studio configuration
  if (!env.LM_STUDIO_BASE_URL) {
    throw new ConfigurationError('LM Studio base URL not configured. Please set LM_STUDIO_BASE_URL environment variable.');
  }

  // Parse and validate request body
  const body = await req.json() as Partial<ChatRequest>;
  
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw new ValidationError('Messages array is required and must not be empty');
  }

  // Validate message format
  for (const message of body.messages) {
    if (!message.role || !message.content) {
      throw new ValidationError('Each message must have a role and content');
    }
    if (!['user', 'assistant', 'system'].includes(message.role)) {
      throw new ValidationError('Message role must be "user", "assistant", or "system"');
    }
  }

  try {
    // Prepare LM Studio compatible request
    const lmStudioRequest = {
      model: body.model || 'default', // LM Studio uses the loaded model
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.maxTokens,
      stream: true, // Enable streaming
    };

    // Make request to LM Studio
    const lmStudioUrl = `${env.LM_STUDIO_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided (LM Studio may or may not require it)
    if (env.LM_STUDIO_API_KEY) {
      headers['Authorization'] = `Bearer ${env.LM_STUDIO_API_KEY}`;
    }

    const response = await fetch(lmStudioUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(lmStudioRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ExternalServiceError('LM Studio', new Error(`HTTP ${response.status}: ${errorText}`));
    }

    // Check if the response body exists
    if (!response.body) {
      throw new ExternalServiceError('LM Studio', new Error('No response body received'));
    }

    // Create a streaming response that transforms LM Studio's format to match our API
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const text = decoder.decode(chunk);
        
        // LM Studio sends data in OpenAI-compatible SSE format
        // We can pass it through directly or transform if needed
        controller.enqueue(encoder.encode(text));
      }
    });

    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        throw new ConfigurationError('Cannot connect to LM Studio. Please ensure LM Studio is running and accessible at the configured URL.');
      }
      if (error.message.includes('401')) {
        throw new ConfigurationError('Invalid LM Studio API key or authentication failed');
      }
      if (error.message.includes('404')) {
        throw new ConfigurationError('LM Studio endpoint not found. Please check the base URL configuration.');
      }
    }
    throw error;
  }
});

export const POST = withErrorHandler(rateLimitedHandler, { path: '/api/lmstudio/chat' });