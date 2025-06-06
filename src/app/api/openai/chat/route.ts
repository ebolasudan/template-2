import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { withErrorHandler } from "@/lib/api/error-handler";
import { ChatRequest } from "@/types/api";
import { ValidationError, ConfigurationError, AuthenticationError } from "@/lib/errors";
import { getServerSession } from "@/lib/auth/session";
import { withRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";

export const runtime = "edge";

const rateLimitedHandler = withRateLimit(RATE_LIMIT_CONFIGS.ai)(async (req: Request) => {
  // Check authentication
  const session = await getServerSession(req);
  if (!session) {
    throw new AuthenticationError();
  }

  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    throw new ConfigurationError('OpenAI API key not configured');
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
    const result = await streamText({
      model: openai(body.model || "gpt-4o"),
      messages: convertToCoreMessages(body.messages),
      system: "You are a helpful AI assistant",
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new ConfigurationError('Invalid OpenAI API key');
      }
      if (error.message.includes('429')) {
        throw new Error('OpenAI rate limit exceeded');
      }
    }
    throw error;
  }
});

export const POST = withErrorHandler(rateLimitedHandler, { path: '/api/openai/chat' });