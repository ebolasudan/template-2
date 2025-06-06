// Environment variable validation

export interface EnvConfig {
  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  
  // AI Services
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  REPLICATE_API_TOKEN?: string;
  DEEPGRAM_API_KEY?: string;
  
  // Local LLM via LM Studio
  LM_STUDIO_BASE_URL?: string;
  LM_STUDIO_API_KEY?: string;
  
  // App Configuration
  NEXT_PUBLIC_APP_URL?: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required Firebase variables
  const requiredFirebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ] as const;

  for (const varName of requiredFirebaseVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Optional AI service variables with warnings
  const optionalAIVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'REPLICATE_API_TOKEN',
    'DEEPGRAM_API_KEY',
    'LM_STUDIO_BASE_URL',
  ] as const;

  const missingAIServices: string[] = [];
  for (const varName of optionalAIVars) {
    if (!process.env[varName]) {
      missingAIServices.push(varName);
    }
  }

  if (missingAIServices.length === optionalAIVars.length) {
    console.warn('⚠️  No AI service API keys configured. At least one AI service should be configured.');
  } else if (missingAIServices.length > 0) {
    console.info(`ℹ️  Some AI services not configured: ${missingAIServices.join(', ')}`);
  }

  // Throw error if required variables are missing
  if (errors.length > 0) {
    throw new EnvironmentError(
      `Environment validation failed:\n${errors.join('\n')}\n\nPlease check your .env.local file.`
    );
  }

  return {
    // Firebase (required)
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    
    // AI Services (optional)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    
    // Local LLM via LM Studio
    LM_STUDIO_BASE_URL: process.env.LM_STUDIO_BASE_URL,
    LM_STUDIO_API_KEY: process.env.LM_STUDIO_API_KEY,
    
    // App Configuration
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  };
}

// Validate environment variables on module load
export const env = validateEnv();

// Helper functions to check which services are available
export const hasOpenAI = () => Boolean(env.OPENAI_API_KEY);
export const hasAnthropic = () => Boolean(env.ANTHROPIC_API_KEY);
export const hasReplicate = () => Boolean(env.REPLICATE_API_TOKEN);
export const hasDeepgram = () => Boolean(env.DEEPGRAM_API_KEY);
export const hasLMStudio = () => Boolean(env.LM_STUDIO_BASE_URL);

export const getAvailableAIServices = () => ({
  openai: hasOpenAI(),
  anthropic: hasAnthropic(),
  replicate: hasReplicate(),
  deepgram: hasDeepgram(),
  lmstudio: hasLMStudio(),
});

// Export a safe version of env for client-side use
export const publicEnv = {
  FIREBASE_API_KEY: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  APP_URL: env.NEXT_PUBLIC_APP_URL,
};