import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";
import { withErrorHandler } from "@/lib/api/error-handler";
import { ChatRequestSchema, safeValidate } from "@/lib/validation";
import { ValidationError, ConfigurationError, AuthenticationError, AppError } from "@/lib/errors";
import { getServerSession } from "@/lib/auth/session";
import { sanitizeInput } from "@/lib/validation/sanitization";

export const runtime = "edge";

export const POST = withErrorHandler(async (req: Request) => {
  // Check authentication
  const session = await getServerSession(req);
  if (!session) {
    throw AuthenticationError.fromRequest('Authentication required', req);
  }

  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    throw AppError.fromRequest('Anthropic API key not configured', req, 503, 'CONFIGURATION_ERROR');
  }

  // Parse request body
  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    throw AppError.fromRequest('Invalid JSON in request body', req, 400, 'INVALID_JSON');
  }

  // Validate and sanitize request data
  const validatedData = safeValidate(
    ChatRequestSchema,
    requestBody,
    'Anthropic Chat Request'
  );

  // Sanitize message content
  const sanitizedMessages = validatedData.messages.map(message => ({
    ...message,
    content: sanitizeInput(message.content, 'CHAT_MESSAGE')
  }));

  try {
    const result = await streamText({
      model: anthropic(validatedData.model || "claude-3-5-sonnet-20240620"),
      messages: convertToCoreMessages(sanitizedMessages),
      system: "You are a helpful AI assistant",
      temperature: validatedData.temperature ?? 0.7,
      maxTokens: validatedData.maxTokens,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // Re-throw with enhanced context
    if (error instanceof Error) {
      const context = {
        requestId: req.headers.get('x-request-id'),
        provider: 'anthropic',
        model: validatedData.model,
        messageCount: sanitizedMessages.length,
      };
      
      if (error.message.includes('401')) {
        throw new AppError('Invalid Anthropic API key', 401, 'INVALID_API_KEY', true, context);
      }
      if (error.message.includes('429')) {
        throw new AppError('Anthropic rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', true, context);
      }
      if (error.message.includes('400')) {
        throw new AppError('Invalid request to Anthropic API', 400, 'INVALID_REQUEST', true, context);
      }
    }
    throw AppError.fromRequest('Anthropic service error', req, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}, { path: '/api/anthropic/chat' });