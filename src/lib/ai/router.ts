import { Message, ChatRequest } from '@/types/api';
import { env, hasOpenAI, hasAnthropic } from '@/lib/env';
import { ConfigurationError } from '@/lib/errors';

export type AIProvider = 'openai' | 'anthropic' | 'auto';

export interface AIRouterConfig {
  defaultProvider?: AIProvider;
  fallbackEnabled?: boolean;
  costOptimization?: boolean;
  loadBalancing?: boolean;
}

export interface AIProviderInfo {
  name: AIProvider;
  available: boolean;
  costPerToken: number;
  speed: 'fast' | 'medium' | 'slow';
  capabilities: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    maxTokens: number;
  };
}

// Provider information
const PROVIDER_INFO: Record<Exclude<AIProvider, 'auto'>, Omit<AIProviderInfo, 'available'>> = {
  openai: {
    name: 'openai',
    costPerToken: 0.00003, // GPT-4 pricing
    speed: 'fast',
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      maxTokens: 128000,
    },
  },
  anthropic: {
    name: 'anthropic',
    costPerToken: 0.00002, // Claude 3.5 Sonnet pricing
    speed: 'medium',
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      maxTokens: 200000,
    },
  },
};

export class AIRouter {
  private config: Required<AIRouterConfig>;
  private requestCounts: Map<AIProvider, number> = new Map();
  
  constructor(config: AIRouterConfig = {}) {
    this.config = {
      defaultProvider: config.defaultProvider || 'auto',
      fallbackEnabled: config.fallbackEnabled ?? true,
      costOptimization: config.costOptimization ?? false,
      loadBalancing: config.loadBalancing ?? false,
    };
  }

  // Get available providers
  getAvailableProviders(): AIProviderInfo[] {
    const providers: AIProviderInfo[] = [];

    if (hasOpenAI()) {
      providers.push({
        ...PROVIDER_INFO.openai,
        available: true,
      });
    }

    if (hasAnthropic()) {
      providers.push({
        ...PROVIDER_INFO.anthropic,
        available: true,
      });
    }

    return providers;
  }

  // Select the best provider based on request and configuration
  selectProvider(request: ChatRequest): AIProvider {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new ConfigurationError('No AI providers configured. Please set up at least one API key.');
    }

    // If a specific provider is requested and available, use it
    if (this.config.defaultProvider !== 'auto') {
      const provider = availableProviders.find(p => p.name === this.config.defaultProvider);
      if (provider) {
        return provider.name;
      }
    }

    // Auto-selection logic
    let selectedProvider: AIProviderInfo | undefined;

    // Cost optimization: choose the cheapest provider
    if (this.config.costOptimization) {
      selectedProvider = availableProviders.reduce((cheapest, current) => 
        current.costPerToken < cheapest.costPerToken ? current : cheapest
      );
    }
    // Load balancing: distribute requests evenly
    else if (this.config.loadBalancing) {
      selectedProvider = this.selectByLoadBalancing(availableProviders);
    }
    // Default: choose based on capabilities and speed
    else {
      selectedProvider = this.selectByCapabilities(availableProviders, request);
    }

    if (!selectedProvider) {
      selectedProvider = availableProviders[0];
    }

    // Track request count for load balancing
    this.requestCounts.set(
      selectedProvider.name as Exclude<AIProvider, 'auto'>,
      (this.requestCounts.get(selectedProvider.name as Exclude<AIProvider, 'auto'>) || 0) + 1
    );

    return selectedProvider.name;
  }

  // Select provider by load balancing
  private selectByLoadBalancing(providers: AIProviderInfo[]): AIProviderInfo {
    let minCount = Infinity;
    let selectedProvider = providers[0];

    for (const provider of providers) {
      const count = this.requestCounts.get(provider.name as Exclude<AIProvider, 'auto'>) || 0;
      if (count < minCount) {
        minCount = count;
        selectedProvider = provider;
      }
    }

    return selectedProvider;
  }

  // Select provider based on capabilities
  private selectByCapabilities(providers: AIProviderInfo[], request: ChatRequest): AIProviderInfo {
    // Check if request needs specific capabilities
    const needsLongContext = (request.messages?.join('').length || 0) > 10000;
    const needsVision = request.messages?.some(msg => 
      typeof msg.content === 'object' && msg.content.type === 'image'
    );

    // Score providers based on requirements
    const scores = providers.map(provider => {
      let score = 0;

      // Speed scoring
      if (provider.speed === 'fast') score += 3;
      else if (provider.speed === 'medium') score += 2;
      else score += 1;

      // Context length scoring
      if (needsLongContext && provider.capabilities.maxTokens > 100000) {
        score += 5;
      }

      // Vision capability
      if (needsVision && !provider.capabilities.vision) {
        score -= 10; // Penalize if vision is needed but not supported
      }

      // Cost factor (lower is better)
      score -= provider.costPerToken * 100000;

      return { provider, score };
    });

    // Sort by score and return the best
    scores.sort((a, b) => b.score - a.score);
    return scores[0].provider;
  }

  // Execute chat request with automatic fallback
  async chat(request: ChatRequest): Promise<ReadableStream> {
    const primaryProvider = this.selectProvider(request);
    
    try {
      return await this.executeChatRequest(primaryProvider, request);
    } catch (error) {
      if (!this.config.fallbackEnabled) {
        throw error;
      }

      // Try fallback providers
      const availableProviders = this.getAvailableProviders();
      const fallbackProviders = availableProviders
        .filter(p => p.name !== primaryProvider)
        .map(p => p.name);

      for (const fallbackProvider of fallbackProviders) {
        try {
          console.warn(`Primary provider ${primaryProvider} failed, trying ${fallbackProvider}`);
          return await this.executeChatRequest(fallbackProvider, request);
        } catch (fallbackError) {
          continue;
        }
      }

      throw error; // All providers failed
    }
  }

  // Execute chat request with specific provider
  private async executeChatRequest(provider: AIProvider, request: ChatRequest): Promise<ReadableStream> {
    const endpoint = provider === 'openai' ? '/api/openai/chat' : '/api/anthropic/chat';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`${provider} API error: ${response.statusText}`);
    }

    return response.body!;
  }

  // Get auth token (placeholder - implement based on your auth system)
  private async getAuthToken(): Promise<string> {
    // In a real implementation, this would get the user's auth token
    return 'user-auth-token';
  }

  // Get provider statistics
  getStatistics() {
    const stats: Record<string, any> = {};
    
    for (const [provider, count] of this.requestCounts.entries()) {
      stats[provider] = {
        requestCount: count,
        info: PROVIDER_INFO[provider as Exclude<AIProvider, 'auto'>],
      };
    }

    return stats;
  }

  // Reset request counts
  resetStatistics() {
    this.requestCounts.clear();
  }
}

// Singleton instance
export const aiRouter = new AIRouter();

// React hook for using AI router
import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export function useAIRouter(config?: AIRouterConfig) {
  const { user } = useAuth();
  const [router] = useState(() => new AIRouter(config));

  const chat = useCallback(
    async (messages: Message[], options?: Partial<ChatRequest>) => {
      if (!user) {
        throw new Error('Authentication required');
      }

      return router.chat({
        messages,
        ...options,
      });
    },
    [router, user]
  );

  const getProviders = useCallback(() => {
    return router.getAvailableProviders();
  }, [router]);

  const getStats = useCallback(() => {
    return router.getStatistics();
  }, [router]);

  return {
    chat,
    getProviders,
    getStats,
  };
}